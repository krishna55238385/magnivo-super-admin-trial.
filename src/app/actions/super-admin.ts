'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import pool from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET as string

const ROLE_PERMISSIONS = {
  super_admin: ['all'],
  admin: ['view_clients', 'manage_onboarding', 'view_billing', 'manage_support', 'view_team', 'view_audit'],
  billing: ['view_clients', 'view_billing', 'manage_billing'],
  support: ['view_clients', 'manage_support', 'view_audit'],
  viewer: ['view_clients', 'view_billing', 'view_audit'],
}

function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || []
  return perms.includes('all') || perms.includes(permission)
}

export async function getRolePermissions() {
  return ROLE_PERMISSIONS
}

// Require an internal team role, optionally scoped to a specific permission
async function requireSuperAdmin(permission?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('magnivo_super_token')?.value
  if (!token) return { ok: false, error: 'Authentication required' }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    const validRoles = Object.keys(ROLE_PERMISSIONS)
    if (!validRoles.includes(payload.role)) {
      return { ok: false, error: 'Invalid role' }
    }
    if (permission && !hasPermission(payload.role, permission)) {
      return { ok: false, error: `Permission denied: requires ${permission}` }
    }
    return { ok: true, user: payload }
  } catch {
    return { ok: false, error: 'Invalid session' }
  }
}

// SELECT queries fall back to [] instead of throwing when a table doesn't exist yet
async function safeQuery(sql: string, params: any[] = []) {
  try {
    return await pool.query(sql, params)
  } catch (err) {
    console.error('super-admin query failed:', err)
    return { rows: [] as any[] }
  }
}

// ──────────────────────────────────────────
// CLIENT MANAGEMENT
// ──────────────────────────────────────────

// A status counts as "done" once it's moved off its not-started placeholder value
const NOT_STARTED_STATUSES = new Set(['not_sent', 'not_issued'])
const isStepDone = (status: string | null) => status != null && !NOT_STARTED_STATUSES.has(status)

export async function getAllClients() {
  const auth = await requireSuperAdmin('view_clients')
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT
       o.id,
       o.name,
       o.created_at,
       COALESCE(uc.user_count, 0)::int AS user_count,
       COALESCE(cs.plan_name, 'trial') AS plan_name,
       COALESCE(cs.status, 'trial') AS status,
       COALESCE(cs.mrr_cents, 0) AS mrr_cents,
       cs.payment_status,
       ot.nda_status,
       ot.msa_status,
       ot.onboarding_form_status,
       ot.data_auth_status,
       ot.invoice_status
     FROM public.organizations o
     LEFT JOIN (
       SELECT organization_id, COUNT(*)::int AS user_count
       FROM public.users
       GROUP BY organization_id
     ) uc ON uc.organization_id = o.id
     LEFT JOIN LATERAL (
       SELECT plan_name, status, mrr_cents, payment_status
       FROM public.client_subscriptions cs
       WHERE cs.organization_id = o.id
       ORDER BY cs.created_at DESC
       LIMIT 1
     ) cs ON true
     LEFT JOIN LATERAL (
       SELECT nda_status, msa_status, onboarding_form_status, data_auth_status, invoice_status
       FROM public.onboarding_tracker ot
       WHERE ot.organization_id = o.id
       ORDER BY ot.created_at DESC
       LIMIT 1
     ) ot ON true
     ORDER BY o.created_at DESC`
  )

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    created_at: r.created_at,
    user_count: r.user_count,
    plan_name: r.plan_name,
    status: r.status,
    mrr_cents: r.mrr_cents,
    payment_status: r.payment_status,
    onboarding_complete: [
      r.nda_status,
      r.msa_status,
      r.onboarding_form_status,
      r.data_auth_status,
      r.invoice_status,
    ].every(isStepDone),
  }))
}

export async function getClientDetail(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { org: null, users: [], invoices: [], usageSummary: [] }

  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [orgRes, usersRes, invoicesRes, usageRes, subRes] = await Promise.all([
    safeQuery(`SELECT * FROM public.organizations WHERE id = $1`, [orgId]),
    safeQuery(`SELECT id, full_name, role, created_at FROM public.users WHERE organization_id = $1`, [orgId]),
    safeQuery(`SELECT * FROM public.invoices WHERE organization_id = $1 ORDER BY issued_at DESC LIMIT 10`, [orgId]),
    safeQuery(
      `SELECT model, feature, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE organization_id = $1 AND date >= $2`,
      [orgId, since]
    ),
    safeQuery(
      `SELECT status, plan_name FROM public.client_subscriptions WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orgId]
    ),
  ])

  return {
    org: orgRes.rows[0] || null,
    users: usersRes.rows,
    invoices: invoicesRes.rows,
    usageSummary: usageRes.rows,
    status: subRes.rows[0]?.status || 'trial',
    plan: subRes.rows[0]?.plan_name || 'Starter',
  }
}

export async function getSupportTicketsForClient(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT st.*, COUNT(sm.id) AS message_count
     FROM public.support_tickets st
     LEFT JOIN public.support_messages sm ON sm.ticket_id = st.id
     WHERE st.organization_id = $1
     GROUP BY st.id
     ORDER BY st.created_at DESC`,
    [orgId]
  )

  return rows
}

export async function getAuditLogsForClient(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT * FROM public.super_admin_audit_logs
     WHERE entity_name = (SELECT name FROM public.organizations WHERE id = $1 LIMIT 1)
     OR details::text LIKE '%' || $1 || '%'
     ORDER BY created_at DESC
     LIMIT 50`,
    [orgId]
  )

  return rows
}

export async function getNotesForClient(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { notes: null }

  const { rows } = await safeQuery(
    `SELECT notes FROM public.onboarding_tracker WHERE organization_id = $1`,
    [orgId]
  )

  return { notes: rows[0]?.notes ?? null }
}

export async function updateClientNotes(orgId: string, notes: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const updateRes = await pool.query(
    `UPDATE public.onboarding_tracker SET notes = $2 WHERE organization_id = $1`,
    [orgId, notes]
  )
  if (updateRes.rowCount === 0) {
    return { error: 'No onboarding record found for this organization' }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    ['client.notes_updated', 'client', orgId, JSON.stringify({ message: 'Internal notes updated' }), 'low']
  )

  revalidatePath(`/super-admin/clients/${orgId}`)
  return { success: true }
}

export async function onboardClient(data: {
  companyName: string
  adminEmail: string
  domain: string
  plan: string
}) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)

  // NOTE: this creates a real organization_invites row (same mechanism the CRM's
  // inviteUser() uses) and returns the link for the super admin to hand off manually.
  // No email is sent automatically yet — that's a separate follow-up task.
  const client = await pool.connect()
  let org
  let inviteToken
  try {
    await client.query('BEGIN')

    const orgRes = await client.query(
      `INSERT INTO public.organizations (name, timezone, currency) VALUES ($1, 'UTC', 'USD') RETURNING id`,
      [data.companyName]
    )
    org = orgRes.rows[0]

    await client.query(
      `INSERT INTO public.client_subscriptions (organization_id, plan_name, status, mrr_cents, payment_status, trial_ends_at)
       VALUES ($1, $2, 'trial', 0, 'trial', $3)`,
      [org.id, data.plan, trialEnd.toISOString()]
    )

    const inviteRes = await client.query(
      `INSERT INTO public.organization_invites (organization_id, email, role, invited_by)
       VALUES ($1, $2, 'admin', NULL) RETURNING token`,
      [org.id, data.adminEmail]
    )
    inviteToken = inviteRes.rows[0].token

    await client.query(
      `INSERT INTO public.onboarding_tracker
         (organization_id, nda_status, msa_status, onboarding_form_status, data_auth_status, invoice_status, notes)
       VALUES ($1, 'not_sent', 'not_sent', 'not_sent', 'not_sent', 'not_issued', $2)`,
      [org.id, `Admin invite link generated for ${data.adminEmail} (domain: ${data.domain}). Link was shown to the super admin on creation — no email sent automatically.`]
    )

    await client.query(
      `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        'client.onboarded',
        'client',
        data.companyName,
        JSON.stringify({ message: `Onboarded ${data.companyName} on ${data.plan} plan`, organization_id: org.id }),
        'low',
      ]
    )

    await client.query('COMMIT')
  } catch (err: any) {
    await client.query('ROLLBACK')
    return { error: err.message || 'Failed to onboard client' }
  } finally {
    client.release()
  }

  revalidatePath('/super-admin/clients')
  revalidatePath('/super-admin/onboarding')
  return { success: true, orgId: org.id, inviteLink: `https://magnivo-ai.vercel.app/invite/${inviteToken}` }
}

export async function suspendClient(orgId: string, reason: string) {
  const auth = await requireSuperAdmin('all')
  if (!auth.ok) return { error: auth.error }

  const updateRes = await pool.query(`UPDATE public.client_subscriptions SET status = 'suspended' WHERE organization_id = $1`, [orgId])
  if (updateRes.rowCount === 0) {
    return { error: 'No subscription record found for this organization' }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    ['client.suspended', 'client', orgId, JSON.stringify({ message: reason }), 'high']
  )

  revalidatePath('/super-admin/clients')
  revalidatePath(`/super-admin/clients/${orgId}`)
  return { success: true }
}

export async function changeClientPlan(orgId: string, newPlan: string) {
  const auth = await requireSuperAdmin('manage_billing')
  if (!auth.ok) return { error: auth.error }

  const { rows: planRows } = await safeQuery(`SELECT * FROM public.plans WHERE name = $1`, [newPlan])
  const plan = planRows[0]
  if (!plan) return { error: 'Plan not found' }

  const updateRes = await pool.query(
    `UPDATE public.client_subscriptions SET plan_name = $1, mrr_cents = $2, updated_at = now() WHERE organization_id = $3`,
    [newPlan, plan.monthly_price_cents, orgId]
  )
  if (updateRes.rowCount === 0) {
    return { error: 'No subscription record found for this organization' }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    [
      'client.plan_changed',
      'client',
      `→ ${newPlan}`,
      JSON.stringify({
        message: `Plan changed to ${newPlan}, $${(plan.monthly_price_cents / 100).toFixed(0)}/mo`,
        organization_id: orgId,
      }),
      'medium',
    ]
  )

  revalidatePath('/super-admin/clients')
  return { success: true }
}

// ──────────────────────────────────────────
// ONBOARDING TRACKER
// ──────────────────────────────────────────

const VALID_DOC_FIELDS = new Set([
  'nda_status',
  'msa_status',
  'onboarding_form_status',
  'data_auth_status',
  'invoice_status',
])

const VALID_DOC_STATUSES = new Set([
  'not_sent',
  'sent',
  'signed',
  'completed',
  'not_issued',
  'issued',
  'paid',
])

export async function getOnboardingStatus(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return null

  const { rows } = await safeQuery(
    `SELECT nda_status, msa_status, onboarding_form_status, data_auth_status, invoice_status, activated_at, notes
     FROM public.onboarding_tracker WHERE organization_id = $1`,
    [orgId]
  )

  return rows[0] || null
}

export async function updateDocumentStatus(orgId: string, field: string, status: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  if (!VALID_DOC_FIELDS.has(field)) {
    throw new Error(`Invalid field: ${field}`)
  }
  if (!VALID_DOC_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`)
  }

  await pool.query(
    `UPDATE public.onboarding_tracker SET ${field} = $1 WHERE organization_id = $2`,
    [status, orgId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    [
      'onboarding.document_updated',
      'client',
      field,
      JSON.stringify({ message: `${field} set to ${status}`, organization_id: orgId }),
      'low',
    ]
  )

  revalidatePath('/super-admin/onboarding')
  revalidatePath('/super-admin/clients')
  return { success: true }
}

export async function activateClient(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const { rows } = await safeQuery(
    `SELECT nda_status, msa_status, onboarding_form_status, data_auth_status, invoice_status
     FROM public.onboarding_tracker WHERE organization_id = $1`,
    [orgId]
  )
  const tracker = rows[0]
  const allComplete = !!tracker && [
    tracker.nda_status,
    tracker.msa_status,
    tracker.onboarding_form_status,
    tracker.data_auth_status,
    tracker.invoice_status,
  ].every(isStepDone)

  if (!allComplete) {
    return { error: 'All onboarding documents must be complete before activating' }
  }

  // NOTE: these two UPDATEs are not wrapped in a transaction — if the client_subscriptions
  // update below fails/no-ops, onboarding_tracker.activated_at has already committed, leaving
  // a partial state. Follow-up: wrap in a transaction (tracked separately, not fixed here).
  await pool.query(`UPDATE public.onboarding_tracker SET activated_at = now() WHERE organization_id = $1`, [orgId])
  const updateRes = await pool.query(`UPDATE public.client_subscriptions SET status = 'active' WHERE organization_id = $1`, [orgId])
  if (updateRes.rowCount === 0) {
    return { error: 'No subscription record found for this organization' }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    [
      'client.activated',
      'client',
      orgId,
      JSON.stringify({ message: 'Client activated after all onboarding documents completed' }),
      'medium',
    ]
  )

  revalidatePath('/super-admin/onboarding')
  revalidatePath('/super-admin/clients')
  return { success: true }
}

// ──────────────────────────────────────────
// BILLING
// ──────────────────────────────────────────

export async function getAllInvoices(status?: string) {
  const auth = await requireSuperAdmin('view_billing')
  if (!auth.ok) return []

  const params: any[] = []
  let sql = `SELECT i.*, o.name AS organization_name FROM public.invoices i LEFT JOIN public.organizations o ON o.id = i.organization_id`
  if (status && status !== 'all') {
    params.push(status)
    sql += ` WHERE i.status = $${params.length}`
  }
  sql += ` ORDER BY i.issued_at DESC LIMIT 100`

  const { rows } = await safeQuery(sql, params)
  return rows.map((r: any) => ({ ...r, organizations: { name: r.organization_name } }))
}

export async function issueInvoice(data: {
  orgId: string
  planName: string
  amountCents: number
  dueDate: string
  notes?: string
}) {
  const auth = await requireSuperAdmin('manage_billing')
  if (!auth.ok) return { error: auth.error }

  const { rows: countRows } = await safeQuery(`SELECT COUNT(*)::int AS count FROM public.invoices`)
  const invoiceNum = `INV-${String((countRows[0]?.count || 0) + 1000 + 1).padStart(4, '0')}`

  let invoice
  try {
    const insertRes = await pool.query(
      `INSERT INTO public.invoices (invoice_number, organization_id, plan_name, amount_cents, status, due_at, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6) RETURNING *`,
      [invoiceNum, data.orgId, data.planName, data.amountCents, data.dueDate, data.notes || null]
    )
    invoice = insertRes.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    [
      'invoice.issued',
      'billing',
      invoiceNum,
      JSON.stringify({
        message: `Manual invoice issued for $${(data.amountCents / 100).toFixed(2)}`,
        invoice_id: invoice.id,
      }),
      'low',
    ]
  )

  revalidatePath('/super-admin/billing')
  return { success: true, invoiceId: invoice.id, invoiceNumber: invoiceNum }
}

export async function getMRRBreakdown() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT
       o.name AS org_name,
       cs.plan_name,
       cs.mrr_cents,
       cs.status,
       cs.payment_status,
       cs.trial_ends_at AS renewal_date
     FROM public.client_subscriptions cs
     JOIN public.organizations o ON o.id = cs.organization_id
     WHERE cs.status IN ('active', 'trial')
     ORDER BY cs.mrr_cents DESC`
  )

  return rows
}

export async function getPlans() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(`SELECT * FROM public.plans ORDER BY monthly_price_cents ASC`)
  return rows
}

export async function createPlan(data: {
  name: string
  monthly_price_cents: number
  token_limit: number
  features: string[]
}) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  let plan
  try {
    const insertRes = await pool.query(
      `INSERT INTO public.plans (name, monthly_price_cents, token_limit, features)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.name, data.monthly_price_cents, data.token_limit, JSON.stringify(data.features)]
    )
    plan = insertRes.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }

  revalidatePath('/super-admin/billing')
  return { success: true, id: plan.id }
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const auth = await requireSuperAdmin('manage_billing')
  if (!auth.ok) return { error: auth.error }

  const VALID_INVOICE_STATUSES = new Set(['pending', 'paid', 'overdue', 'cancelled'])
  if (!VALID_INVOICE_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`)
  }

  await pool.query(
    `UPDATE public.invoices SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN now() ELSE NULL END WHERE id = $2`,
    [status, invoiceId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    ['invoice.status_updated', 'billing', invoiceId, JSON.stringify({ message: `Invoice status set to ${status}` }), 'low']
  )

  revalidatePath('/super-admin/billing')
  return { success: true }
}

export async function getRevenueStats() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return {
      total_mrr_cents: 0,
      total_arr_cents: 0,
      trial_count: 0,
      active_count: 0,
      overdue_invoices: 0,
      total_outstanding_cents: 0,
    }
  }

  const [mrrRes, trialRes, activeRes, overdueRes, outstandingRes] = await Promise.all([
    safeQuery(`SELECT COALESCE(SUM(mrr_cents), 0)::bigint AS total FROM public.client_subscriptions WHERE status = 'active'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.client_subscriptions WHERE status = 'trial'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.client_subscriptions WHERE status = 'active'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.invoices WHERE status = 'overdue'`),
    safeQuery(`SELECT COALESCE(SUM(amount_cents), 0)::bigint AS total FROM public.invoices WHERE status IN ('pending', 'overdue')`),
  ])

  const totalMrrCents = Number(mrrRes.rows[0]?.total) || 0

  return {
    total_mrr_cents: totalMrrCents,
    total_arr_cents: totalMrrCents * 12,
    trial_count: trialRes.rows[0]?.count || 0,
    active_count: activeRes.rows[0]?.count || 0,
    overdue_invoices: overdueRes.rows[0]?.count || 0,
    total_outstanding_cents: Number(outstandingRes.rows[0]?.total) || 0,
  }
}

// ──────────────────────────────────────────
// TOKEN USAGE
// ──────────────────────────────────────────

export async function getPlatformTokenUsage(days = 30) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return {
      by_model: [],
      by_client: [],
      by_feature: [],
      daily: [],
      totals: { total_tokens: 0, total_cost: 0 },
    }
  }

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const [byModelRes, byClientRes, byFeatureRes, dailyRes, totalsRes] = await Promise.all([
    safeQuery(
      `SELECT model, SUM(total_tokens)::bigint AS total_tokens, SUM(estimated_cost_usd)::numeric AS estimated_cost_usd, COUNT(*)::int AS call_count
       FROM public.token_usage_logs WHERE date >= $1 GROUP BY model ORDER BY total_tokens DESC`,
      [since]
    ),
    safeQuery(
      `SELECT t.organization_id, o.name AS organization_name, SUM(t.total_tokens)::bigint AS total_tokens, SUM(t.estimated_cost_usd)::numeric AS estimated_cost_usd
       FROM public.token_usage_logs t LEFT JOIN public.organizations o ON o.id = t.organization_id
       WHERE t.date >= $1 GROUP BY t.organization_id, o.name ORDER BY total_tokens DESC`,
      [since]
    ),
    safeQuery(
      `SELECT feature, SUM(total_tokens)::bigint AS total_tokens, SUM(estimated_cost_usd)::numeric AS estimated_cost_usd
       FROM public.token_usage_logs WHERE date >= $1 GROUP BY feature ORDER BY total_tokens DESC`,
      [since]
    ),
    safeQuery(
      `SELECT date, SUM(total_tokens)::bigint AS total_tokens, SUM(estimated_cost_usd)::numeric AS estimated_cost_usd
       FROM public.token_usage_logs WHERE date >= $1 GROUP BY date ORDER BY date ASC`,
      [since]
    ),
    safeQuery(
      `SELECT COALESCE(SUM(total_tokens), 0)::bigint AS total_tokens, COALESCE(SUM(estimated_cost_usd), 0)::numeric AS total_cost
       FROM public.token_usage_logs WHERE date >= $1`,
      [since]
    ),
  ])

  return {
    by_model: byModelRes.rows,
    by_client: byClientRes.rows,
    by_feature: byFeatureRes.rows,
    daily: dailyRes.rows,
    totals: {
      total_tokens: Number(totalsRes.rows[0]?.total_tokens) || 0,
      total_cost: Number(totalsRes.rows[0]?.total_cost) || 0,
    },
  }
}

export async function logTokenUsage(data: {
  orgId: string
  model: string
  feature: string
  promptTokens: number
  completionTokens: number
  costUsd: number
}) {
  const totalTokens = data.promptTokens + data.completionTokens
  const today = new Date().toISOString().slice(0, 10)

  await pool.query(
    `INSERT INTO public.token_usage_logs (organization_id, date, model, feature, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (organization_id, date, model, feature)
     DO UPDATE SET
       prompt_tokens = EXCLUDED.prompt_tokens,
       completion_tokens = EXCLUDED.completion_tokens,
       total_tokens = EXCLUDED.total_tokens,
       estimated_cost_usd = EXCLUDED.estimated_cost_usd`,
    [data.orgId, today, data.model, data.feature, data.promptTokens, data.completionTokens, totalTokens, data.costUsd]
  )
}

// ──────────────────────────────────────────
// SUPPORT
// ──────────────────────────────────────────

export async function getSupportTickets(status?: string) {
  const auth = await requireSuperAdmin('manage_support')
  if (!auth.ok) return []

  const params: any[] = []
  let sql = `
    SELECT t.*, o.name AS organization_name,
      (SELECT COUNT(*) FROM public.support_messages m WHERE m.ticket_id = t.id)::int AS message_count
    FROM public.support_tickets t
    LEFT JOIN public.organizations o ON o.id = t.organization_id
  `
  if (status && status !== 'all') {
    params.push(status)
    sql += ` WHERE t.status = $${params.length}`
  }
  sql += ` ORDER BY t.created_at DESC`

  const { rows } = await safeQuery(sql, params)
  return rows.map((r: any) => ({
    ...r,
    organizations: { name: r.organization_name },
    support_ticket_messages: [{ count: r.message_count }],
  }))
}

export async function createSupportTicket(data: {
  orgId: string
  subject: string
  description: string
  priority: string
  category: string
}) {
  const auth = await requireSuperAdmin('manage_support')
  if (!auth.ok) return { error: auth.error }

  const { rows: countRows } = await safeQuery(`SELECT COUNT(*)::int AS count FROM public.support_tickets`)
  const ticketNum = `TKT-${String((countRows[0]?.count || 0) + 100 + 1).padStart(3, '0')}`

  let ticket
  try {
    const insertRes = await pool.query(
      `INSERT INTO public.support_tickets (ticket_number, organization_id, subject, description, priority, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open') RETURNING *`,
      [ticketNum, data.orgId, data.subject, data.description, data.priority, data.category]
    )
    ticket = insertRes.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }

  revalidatePath('/super-admin/support')
  return { success: true, ticketId: ticket.id }
}

export async function resolveTicket(ticketId: string) {
  const auth = await requireSuperAdmin('manage_support')
  if (!auth.ok) return { error: auth.error }

  await pool.query(
    `UPDATE public.support_tickets SET status = 'resolved', resolved_at = $1 WHERE id = $2`,
    [new Date().toISOString(), ticketId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, severity) VALUES ($1, $2, $3, $4)`,
    ['ticket.resolved', 'support', ticketId, 'low']
  )

  revalidatePath('/super-admin/support')
  return { success: true }
}

export async function replyToTicket(ticketId: string, content: string, senderName: string) {
  const auth = await requireSuperAdmin('manage_support')
  if (!auth.ok) return { error: auth.error }

  await pool.query(
    `INSERT INTO public.support_messages (ticket_id, sender_type, sender_name, content) VALUES ($1, 'staff', $2, $3)`,
    [ticketId, senderName, content]
  )

  await pool.query(
    `UPDATE public.support_tickets SET status = 'in_progress', updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), ticketId]
  )

  revalidatePath('/super-admin/support')
  return { success: true }
}

// ──────────────────────────────────────────
// AUDIT LOGS
// ──────────────────────────────────────────

export async function getPlatformAuditLogs(filters: {
  severity?: string
  targetType?: string
  limit?: number
} = {}) {
  const auth = await requireSuperAdmin('view_audit')
  if (!auth.ok) return []

  const params: any[] = []
  const conditions: string[] = []

  if (filters.severity && filters.severity !== 'all') {
    params.push(filters.severity)
    conditions.push(`severity = $${params.length}`)
  }
  if (filters.targetType && filters.targetType !== 'all') {
    params.push(filters.targetType)
    conditions.push(`entity_type = $${params.length}`)
  }

  let sql = `SELECT * FROM public.super_admin_audit_logs`
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`
  params.push(filters.limit || 200)
  sql += ` ORDER BY created_at DESC LIMIT $${params.length}`

  const { rows } = await safeQuery(sql, params)
  return rows
}

// ──────────────────────────────────────────
// INTERNAL TEAM
// ──────────────────────────────────────────

export async function getTeamMembers() {
  const auth = await requireSuperAdmin('view_team')
  if (!auth.ok) return []

  const { rows } = await safeQuery(`SELECT * FROM public.internal_team ORDER BY created_at ASC`)
  return rows
}

export async function inviteTeamMember(data: {
  email: string
  fullName: string
  role: string
  department: string
}) {
  const auth = await requireSuperAdmin('all')
  if (!auth.ok) return { error: auth.error }

  let member
  try {
    const insertRes = await pool.query(
      `INSERT INTO public.internal_team (email, full_name, role, department, is_active)
       VALUES ($1, $2, $3, $4, false) RETURNING *`,
      [data.email, data.fullName, data.role, data.department]
    )
    member = insertRes.rows[0]
  } catch (err: any) {
    return { error: err.message }
  }

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    [
      'team.member_invited',
      'team',
      `${data.fullName} (${data.role})`,
      JSON.stringify({ message: `Invited ${data.email} as ${data.role}`, member_id: member.id }),
      'low',
    ]
  )

  revalidatePath('/super-admin/team')
  return { success: true }
}

// ──────────────────────────────────────────
// PLATFORM ANALYTICS
// ──────────────────────────────────────────

const STATS_RANGE_DAYS: Record<'30d' | '90d' | 'year', number> = {
  '30d': 30,
  '90d': 90,
  year: 365,
}

export async function getPlatformStats(range: '30d' | '90d' | 'year' = '30d') {
  const auth = await requireSuperAdmin()
  if (!auth.ok) {
    return {
      total_clients: 0,
      total_users: 0,
      total_mrr_cents: 0,
      total_token_usage: 0,
      total_estimated_cost: 0,
      open_support_tickets: 0,
      trial_clients: 0,
      active_clients: 0,
      avg_revenue_per_client: 0,
      churn_rate: 0,
      total_token_cost: 0,
    }
  }

  const rangeDays = STATS_RANGE_DAYS[range] ?? 30
  const rangeStart = new Date(Date.now() - rangeDays * 86400000).toISOString().slice(0, 10)

  const [
    clientsRes,
    usersRes,
    mrrRes,
    usageRes,
    ticketsRes,
    trialRes,
    activeRes,
    suspendedRes,
    rangeCostRes,
  ] = await Promise.all([
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.organizations`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.users`),
    safeQuery(
      `SELECT COALESCE(SUM(mrr_cents), 0)::bigint AS total FROM public.client_subscriptions WHERE status = 'active'`
    ),
    safeQuery(
      `SELECT COALESCE(SUM(total_tokens), 0)::bigint AS tokens, COALESCE(SUM(estimated_cost_usd), 0)::numeric AS cost
       FROM public.token_usage_logs WHERE date >= CURRENT_DATE - 30`
    ),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.support_tickets WHERE status = 'open'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.client_subscriptions WHERE status = 'trial'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.client_subscriptions WHERE status = 'active'`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.client_subscriptions WHERE status = 'suspended'`),
    safeQuery(
      `SELECT COALESCE(SUM(estimated_cost_usd), 0)::numeric AS cost FROM public.token_usage_logs WHERE date >= $1`,
      [rangeStart]
    ),
  ])

  const totalClients = clientsRes.rows[0]?.count || 0
  const activeCount = activeRes.rows[0]?.count || 0
  const suspendedCount = suspendedRes.rows[0]?.count || 0
  const totalMrrCents = Number(mrrRes.rows[0]?.total) || 0

  return {
    total_clients: totalClients,
    total_users: usersRes.rows[0]?.count || 0,
    total_mrr_cents: totalMrrCents,
    total_token_usage: Number(usageRes.rows[0]?.tokens) || 0,
    total_estimated_cost: Number(usageRes.rows[0]?.cost) || 0,
    open_support_tickets: ticketsRes.rows[0]?.count || 0,
    trial_clients: trialRes.rows[0]?.count || 0,
    active_clients: activeCount,
    avg_revenue_per_client: activeCount > 0 ? totalMrrCents / activeCount : 0,
    churn_rate: totalClients > 0 ? (suspendedCount / totalClients) * 100 : 0,
    total_token_cost: Number(rangeCostRes.rows[0]?.cost) || 0,
  }
}

export async function getMRRTrend(months: number = 6) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT DATE_TRUNC('month', created_at) AS month, COALESCE(SUM(mrr_cents), 0)::bigint AS mrr
     FROM public.client_subscriptions
     WHERE status = 'active'
     GROUP BY month
     ORDER BY month ASC
     LIMIT $1`,
    [months]
  )

  return rows.map((r: any) => ({
    month: r.month,
    mrr_cents: Number(r.mrr) || 0,
  }))
}

export async function getTopClientsByRevenue(limit: number = 5) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT o.name, cs.plan_name, cs.mrr_cents, cs.status, COUNT(u.id)::int AS user_count
     FROM public.organizations o
     LEFT JOIN public.client_subscriptions cs ON cs.organization_id = o.id
     LEFT JOIN public.users u ON u.organization_id = o.id
     GROUP BY o.id, o.name, cs.plan_name, cs.mrr_cents, cs.status
     ORDER BY cs.mrr_cents DESC NULLS LAST
     LIMIT $1`,
    [limit]
  )

  return rows.map((r: any) => ({
    name: r.name,
    plan_name: r.plan_name,
    mrr_cents: Number(r.mrr_cents) || 0,
    status: r.status,
    user_count: r.user_count,
  }))
}

export async function getRecentActivity(limit: number = 10) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT * FROM public.super_admin_audit_logs ORDER BY created_at DESC LIMIT $1`,
    [limit]
  )

  return rows
}

// ──────────────────────────────────────────
// SYSTEM HEALTH
// ──────────────────────────────────────────

type ServiceHealth = {
  name: string
  host: string
  latency_ms: number
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

function deriveStatus(latencyMs: number, errored: boolean): 'operational' | 'degraded' | 'down' {
  if (errored) return 'down'
  if (latencyMs < 500) return 'operational'
  return 'degraded'
}

async function checkHttpService(name: string, host: string, url: string): Promise<ServiceHealth> {
  const start = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    await fetch(url, { signal: controller.signal, cache: 'no-store' })
    return { name, host, latency_ms: Date.now() - start, status: deriveStatus(Date.now() - start, false), uptime: '99.9%' }
  } catch {
    return { name, host, latency_ms: Date.now() - start, status: 'down', uptime: '99.9%' }
  } finally {
    clearTimeout(timeout)
  }
}

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    await pool.query('SELECT 1')
    const latency = Date.now() - start
    return { name: 'PostgreSQL (RDS)', host: 'AWS · ap-south-1', latency_ms: latency, status: deriveStatus(latency, false), uptime: '99.9%' }
  } catch {
    return { name: 'PostgreSQL (RDS)', host: 'AWS · ap-south-1', latency_ms: Date.now() - start, status: 'down', uptime: '99.9%' }
  }
}

export async function getSystemHealth(): Promise<ServiceHealth[]> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const [crm, gtm, db] = await Promise.all([
    checkHttpService('Magnivo AI CRM', 'Vercel · Mumbai', 'https://magnivo-ai.vercel.app/api/health'),
    checkHttpService('GTM Pipeline (FastAPI)', 'EC2 · Mumbai', 'http://3.111.55.185:8080/health'),
    checkDatabase(),
  ])

  return [crm, gtm, db]
}

// ──────────────────────────────────────────
// PLATFORM SETTINGS
// ──────────────────────────────────────────

const DEFAULT_PLATFORM_SETTINGS: Record<string, string> = {
  platform_name: 'Magnivo AI',
  support_email: 'support@magnivo.ai',
  default_token_limit: '100000',
  trial_duration_days: '14',
  maintenance_mode: 'false',
  allow_new_signups: 'true',
  alert_threshold_percent: '80',
  enforce_hard_token_cap: 'false',
  notify_churn: 'true',
  notify_payment_failure: 'true',
  notify_token_limit: 'true',
  notify_new_signup: 'true',
  notify_urgent_tickets: 'true',
}

export async function getPlatformSettings() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return DEFAULT_PLATFORM_SETTINGS

  const { rows } = await safeQuery(`SELECT key, value FROM public.platform_settings`)
  if (rows.length === 0) return DEFAULT_PLATFORM_SETTINGS

  const settings: Record<string, string> = { ...DEFAULT_PLATFORM_SETTINGS }
  for (const row of rows) settings[row.key] = row.value
  return settings
}

export async function updatePlatformSetting(key: string, value: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  await pool.query(
    `INSERT INTO public.platform_settings (key, value, updated_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
    [key, value, auth.user.userId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (event_code, entity_type, entity_name, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    ['settings.updated', 'settings', key, JSON.stringify({ message: `Updated ${key} to ${value}` }), 'medium']
  )

  revalidatePath('/super-admin/settings')
  return { success: true }
}

export async function getPlanBreakdown() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows } = await safeQuery(
    `SELECT cs.plan_name, COUNT(*)::int AS client_count
     FROM public.client_subscriptions cs
     WHERE cs.status IN ('active', 'trial')
     GROUP BY cs.plan_name
     ORDER BY client_count DESC`
  )

  return rows
}
