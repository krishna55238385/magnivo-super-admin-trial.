'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import pool from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET as string

// Require super_admin role for all these actions
async function requireSuperAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('magnivo_super_token')?.value
  if (!token) return { ok: false, error: 'Authentication required' }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.role !== 'super_admin') return { ok: false, error: 'Super admin access required' }
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

export async function getAllClients() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const { rows: orgs } = await safeQuery(
    `SELECT id, name, created_at FROM public.organizations ORDER BY created_at DESC`
  )
  const { rows: userCounts } = await safeQuery(
    `SELECT organization_id, COUNT(*)::int AS count FROM public.users GROUP BY organization_id`
  )
  const { rows: subs } = await safeQuery(
    `SELECT organization_id, plan_name, status, mrr_cents, payment_status FROM public.client_subscriptions`
  )

  const userCountMap = new Map(userCounts.map((r: any) => [r.organization_id, r.count]))
  const subsMap = new Map<string, any[]>()
  for (const s of subs) {
    if (!subsMap.has(s.organization_id)) subsMap.set(s.organization_id, [])
    subsMap.get(s.organization_id)!.push(s)
  }

  return orgs.map((o: any) => ({
    ...o,
    users: [{ count: userCountMap.get(o.id) || 0 }],
    client_subscriptions: subsMap.get(o.id) || [],
  }))
}

export async function getClientDetail(orgId: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { org: null, users: [], invoices: [], usageSummary: [] }

  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [orgRes, usersRes, invoicesRes, usageRes] = await Promise.all([
    safeQuery(`SELECT * FROM public.organizations WHERE id = $1`, [orgId]),
    safeQuery(`SELECT id, full_name, role, created_at FROM public.users WHERE organization_id = $1`, [orgId]),
    safeQuery(`SELECT * FROM public.invoices WHERE organization_id = $1 ORDER BY issued_at DESC LIMIT 10`, [orgId]),
    safeQuery(
      `SELECT model, feature, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE organization_id = $1 AND date >= $2`,
      [orgId, since]
    ),
  ])

  return {
    org: orgRes.rows[0] || null,
    users: usersRes.rows,
    invoices: invoicesRes.rows,
    usageSummary: usageRes.rows,
  }
}

export async function onboardClient(data: {
  companyName: string
  adminEmail: string
  domain: string
  plan: string
}) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  let org
  try {
    const orgRes = await pool.query(
      `INSERT INTO public.organizations (name, timezone, currency) VALUES ($1, 'UTC', 'USD') RETURNING id`,
      [data.companyName]
    )
    org = orgRes.rows[0]
  } catch (err: any) {
    return { error: err.message || 'Failed to create organization' }
  }

  if (!org) return { error: 'Failed to create organization' }

  const { rows: planRows } = await safeQuery(`SELECT * FROM public.subscription_plans WHERE name = $1`, [data.plan])
  const plan = planRows[0]

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)

  await pool.query(
    `INSERT INTO public.client_subscriptions (organization_id, plan_id, plan_name, status, mrr_cents, token_limit, trial_ends_at, payment_status)
     VALUES ($1, $2, $3, 'trial', 0, $4, $5, 'trial')`,
    [org.id, plan?.id || null, data.plan, plan?.token_limit || 10000000, trialEnd.toISOString()]
  )

  await pool.query(
    `INSERT INTO public.onboarding_tracker (organization_id, steps) VALUES ($1, $2)`,
    [
      org.id,
      JSON.stringify([
        { key: 'signup', label: 'Account Created', done: true, ts: new Date().toISOString() },
        { key: 'invite', label: 'Admin Invited', done: false, ts: null },
        { key: 'profile', label: 'Profile Completed', done: false, ts: null },
        { key: 'integrations', label: 'Email Connected', done: false, ts: null },
        { key: 'icp', label: 'ICP Profile Created', done: false, ts: null },
        { key: 'first_run', label: 'First GTM Run', done: false, ts: null },
        { key: 'payment', label: 'Payment Method Added', done: false, ts: null },
        { key: 'converted', label: 'Converted to Paid', done: false, ts: null },
      ]),
    ]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, target_label, details, severity)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['client.onboarded', 'client', org.id, data.companyName, `Onboarded ${data.companyName} on ${data.plan} plan`, 'low']
  )

  revalidatePath('/super-admin/clients')
  revalidatePath('/super-admin/onboarding')
  return { success: true, orgId: org.id }
}

export async function suspendClient(orgId: string, reason: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  await pool.query(`UPDATE public.client_subscriptions SET status = 'suspended' WHERE organization_id = $1`, [orgId])

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, details, severity) VALUES ($1, $2, $3, $4, $5)`,
    ['client.suspended', 'client', orgId, reason, 'high']
  )

  revalidatePath('/super-admin/clients')
  return { success: true }
}

export async function changeClientPlan(orgId: string, newPlan: string) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const { rows: planRows } = await safeQuery(`SELECT * FROM public.subscription_plans WHERE name = $1`, [newPlan])
  const plan = planRows[0]
  if (!plan) return { error: 'Plan not found' }

  await pool.query(
    `UPDATE public.client_subscriptions SET plan_name = $1, plan_id = $2, token_limit = $3, mrr_cents = $4 WHERE organization_id = $5`,
    [newPlan, plan.id, plan.token_limit, plan.price_monthly, orgId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, target_label, details, severity) VALUES ($1, $2, $3, $4, $5, $6)`,
    ['client.plan_changed', 'client', orgId, `→ ${newPlan}`, `Plan changed to ${newPlan}, $${(plan.price_monthly / 100).toFixed(0)}/mo`, 'medium']
  )

  revalidatePath('/super-admin/clients')
  return { success: true }
}

// ──────────────────────────────────────────
// BILLING
// ──────────────────────────────────────────

export async function getAllInvoices(status?: string) {
  const auth = await requireSuperAdmin()
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
  const auth = await requireSuperAdmin()
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
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, target_label, details, severity) VALUES ($1, $2, $3, $4, $5, $6)`,
    ['invoice.issued', 'billing', invoice.id, invoiceNum, `Manual invoice issued for $${(data.amountCents / 100).toFixed(2)}`, 'low']
  )

  revalidatePath('/super-admin/billing')
  return { success: true, invoiceId: invoice.id, invoiceNumber: invoiceNum }
}

// ──────────────────────────────────────────
// TOKEN USAGE
// ──────────────────────────────────────────

export async function getPlatformTokenUsage(days = 30) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { byModel: [], byClient: [], byFeature: [], daily: [] }

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const [byModelRes, byClientRes, byFeatureRes, dailyRes] = await Promise.all([
    safeQuery(`SELECT model, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE date >= $1`, [since]),
    safeQuery(`SELECT organization_id, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE date >= $1`, [since]),
    safeQuery(`SELECT feature, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE date >= $1`, [since]),
    safeQuery(`SELECT date, total_tokens, estimated_cost_usd FROM public.token_usage_logs WHERE date >= $1 ORDER BY date ASC`, [since]),
  ])

  return {
    byModel: byModelRes.rows,
    byClient: byClientRes.rows,
    byFeature: byFeatureRes.rows,
    daily: dailyRes.rows,
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
  const auth = await requireSuperAdmin()
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
  const auth = await requireSuperAdmin()
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
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  await pool.query(
    `UPDATE public.support_tickets SET status = 'resolved', resolved_at = $1 WHERE id = $2`,
    [new Date().toISOString(), ticketId]
  )

  await pool.query(
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, severity) VALUES ($1, $2, $3, $4)`,
    ['ticket.resolved', 'support', ticketId, 'low']
  )

  revalidatePath('/super-admin/support')
  return { success: true }
}

export async function replyToTicket(ticketId: string, content: string, senderName: string) {
  const auth = await requireSuperAdmin()
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
  const auth = await requireSuperAdmin()
  if (!auth.ok) return []

  const params: any[] = []
  const conditions: string[] = []

  if (filters.severity && filters.severity !== 'all') {
    params.push(filters.severity)
    conditions.push(`severity = $${params.length}`)
  }
  if (filters.targetType && filters.targetType !== 'all') {
    params.push(filters.targetType)
    conditions.push(`target_type = $${params.length}`)
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
  const auth = await requireSuperAdmin()
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
  const auth = await requireSuperAdmin()
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
    `INSERT INTO public.super_admin_audit_logs (action, target_type, target_id, target_label, details, severity) VALUES ($1, $2, $3, $4, $5, $6)`,
    ['team.member_invited', 'team', member.id, `${data.fullName} (${data.role})`, `Invited ${data.email} as ${data.role}`, 'low']
  )

  revalidatePath('/super-admin/team')
  return { success: true }
}

// ──────────────────────────────────────────
// PLATFORM ANALYTICS
// ──────────────────────────────────────────

export async function getPlatformStats() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { totalClients: 0, totalUsers: 0, activeClients: 0, totalMRR: 0, openTickets: 0 }

  const [clientsRes, usersRes, subsRes, ticketsRes] = await Promise.all([
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.organizations`),
    safeQuery(`SELECT COUNT(*)::int AS count FROM public.users`),
    safeQuery(`SELECT status, mrr_cents FROM public.client_subscriptions`),
    safeQuery(`SELECT id FROM public.support_tickets WHERE status = 'open'`),
  ])

  const subscriptions = subsRes.rows
  const activeClients = subscriptions.filter((s: any) => s.status === 'active').length
  const totalMRR = subscriptions.reduce((acc: number, s: any) => acc + (s.mrr_cents || 0), 0)

  return {
    totalClients: clientsRes.rows[0]?.count || 0,
    totalUsers: usersRes.rows[0]?.count || 0,
    activeClients,
    totalMRR: totalMRR / 100,
    openTickets: ticketsRes.rows.length,
  }
}
