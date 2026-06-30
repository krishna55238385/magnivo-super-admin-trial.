'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Require super_admin role for all these actions
async function requireSuperAdmin(supabase: any) {
  const cookieStore = await cookies()
  const isMockAuth = cookieStore.get('sb-mock-auth')?.value === 'true'
  const bypassAuth = process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true'

  if (isMockAuth || bypassAuth) return { ok: true, user: null }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Authentication required' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return { ok: false, error: 'Super admin access required' }

  return { ok: true, user }
}

// ──────────────────────────────────────────
// CLIENT MANAGEMENT
// ──────────────────────────────────────────

export async function getAllClients() {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { data: orgs } = await supabase
    .from('organizations')
    .select(`
      id, name, created_at,
      users(count),
      client_subscriptions(plan_name, status, mrr_cents, payment_status)
    `)
    .order('created_at', { ascending: false })

  return orgs || []
}

export async function getClientDetail(orgId: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const [{ data: org }, { data: users }, { data: invoices }, { data: usageSummary }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', orgId).single(),
    supabase.from('users').select('id, full_name, role, created_at').eq('organization_id', orgId),
    supabase.from('invoices').select('*').eq('organization_id', orgId).order('issued_at', { ascending: false }).limit(10),
    supabase.from('token_usage_logs')
      .select('model, feature, total_tokens, estimated_cost_usd')
      .eq('organization_id', orgId)
      .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
  ])

  return { org, users: users || [], invoices: invoices || [], usageSummary: usageSummary || [] }
}

export async function onboardClient(data: {
  companyName: string
  adminEmail: string
  domain: string
  plan: string
}) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  // Create organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: data.companyName, timezone: 'UTC', currency: 'USD' })
    .select('id')
    .single()

  if (orgError || !org) return { error: orgError?.message || 'Failed to create organization' }

  // Get plan details
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', data.plan)
    .single()

  // Create trial subscription
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 14)

  await supabase.from('client_subscriptions').insert({
    organization_id: org.id,
    plan_id: plan?.id,
    plan_name: data.plan,
    status: 'trial',
    mrr_cents: 0,
    token_limit: plan?.token_limit || 10000000,
    trial_ends_at: trialEnd.toISOString(),
    payment_status: 'trial',
  })

  // Create onboarding tracker
  await supabase.from('client_onboarding').insert({
    organization_id: org.id,
    steps: [
      { key: 'signup', label: 'Account Created', done: true, ts: new Date().toISOString() },
      { key: 'invite', label: 'Admin Invited', done: false, ts: null },
      { key: 'profile', label: 'Profile Completed', done: false, ts: null },
      { key: 'integrations', label: 'Email Connected', done: false, ts: null },
      { key: 'icp', label: 'ICP Profile Created', done: false, ts: null },
      { key: 'first_run', label: 'First GTM Run', done: false, ts: null },
      { key: 'payment', label: 'Payment Method Added', done: false, ts: null },
      { key: 'converted', label: 'Converted to Paid', done: false, ts: null },
    ],
  })

  // Log the action
  await supabase.from('platform_audit_logs').insert({
    action: 'client.onboarded',
    target_type: 'client',
    target_id: org.id,
    target_label: data.companyName,
    details: `Onboarded ${data.companyName} on ${data.plan} plan`,
    severity: 'low',
  })

  revalidatePath('/super-admin/clients')
  revalidatePath('/super-admin/onboarding')
  return { success: true, orgId: org.id }
}

export async function suspendClient(orgId: string, reason: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  await supabase
    .from('client_subscriptions')
    .update({ status: 'suspended' })
    .eq('organization_id', orgId)

  await supabase.from('platform_audit_logs').insert({
    action: 'client.suspended',
    target_type: 'client',
    target_id: orgId,
    details: reason,
    severity: 'high',
  })

  revalidatePath('/super-admin/clients')
  return { success: true }
}

export async function changeClientPlan(orgId: string, newPlan: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', newPlan)
    .single()

  if (!plan) return { error: 'Plan not found' }

  await supabase
    .from('client_subscriptions')
    .update({ plan_name: newPlan, plan_id: plan.id, token_limit: plan.token_limit, mrr_cents: plan.price_monthly })
    .eq('organization_id', orgId)

  await supabase.from('platform_audit_logs').insert({
    action: 'client.plan_changed',
    target_type: 'client',
    target_id: orgId,
    target_label: `→ ${newPlan}`,
    details: `Plan changed to ${newPlan}, $${(plan.price_monthly / 100).toFixed(0)}/mo`,
    severity: 'medium',
  })

  revalidatePath('/super-admin/clients')
  return { success: true }
}

// ──────────────────────────────────────────
// BILLING
// ──────────────────────────────────────────

export async function getAllInvoices(status?: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  let query = supabase
    .from('invoices')
    .select('*, organizations(name)')
    .order('issued_at', { ascending: false })
    .limit(100)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data || []
}

export async function issueInvoice(data: {
  orgId: string
  planName: string
  amountCents: number
  dueDate: string
  notes?: string
}) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  // Generate invoice number
  const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
  const invoiceNum = `INV-${String((count || 0) + 1000 + 1).padStart(4, '0')}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNum,
      organization_id: data.orgId,
      plan_name: data.planName,
      amount_cents: data.amountCents,
      status: 'pending',
      due_at: data.dueDate,
      notes: data.notes,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('platform_audit_logs').insert({
    action: 'invoice.issued',
    target_type: 'billing',
    target_id: invoice.id,
    target_label: invoiceNum,
    details: `Manual invoice issued for $${(data.amountCents / 100).toFixed(2)}`,
    severity: 'low',
  })

  revalidatePath('/super-admin/billing')
  return { success: true, invoiceId: invoice.id, invoiceNumber: invoiceNum }
}

// ──────────────────────────────────────────
// TOKEN USAGE
// ──────────────────────────────────────────

export async function getPlatformTokenUsage(days = 30) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const [{ data: byModel }, { data: byClient }, { data: byFeature }, { data: daily }] = await Promise.all([
    supabase.from('token_usage_logs')
      .select('model, total_tokens, estimated_cost_usd')
      .gte('date', since),
    supabase.from('token_usage_logs')
      .select('organization_id, total_tokens, estimated_cost_usd')
      .gte('date', since),
    supabase.from('token_usage_logs')
      .select('feature, total_tokens, estimated_cost_usd')
      .gte('date', since),
    supabase.from('token_usage_logs')
      .select('date, total_tokens, estimated_cost_usd')
      .gte('date', since)
      .order('date', { ascending: true }),
  ])

  return { byModel: byModel || [], byClient: byClient || [], byFeature: byFeature || [], daily: daily || [] }
}

export async function logTokenUsage(data: {
  orgId: string
  model: string
  feature: string
  promptTokens: number
  completionTokens: number
  costUsd: number
}) {
  const supabase = await createClient()

  const totalTokens = data.promptTokens + data.completionTokens
  const today = new Date().toISOString().slice(0, 10)

  await supabase.from('token_usage_logs').upsert({
    organization_id: data.orgId,
    date: today,
    model: data.model,
    feature: data.feature,
    prompt_tokens: data.promptTokens,
    completion_tokens: data.completionTokens,
    total_tokens: totalTokens,
    estimated_cost_usd: data.costUsd,
  }, {
    onConflict: 'organization_id,date,model,feature',
    ignoreDuplicates: false,
  })
}

// ──────────────────────────────────────────
// SUPPORT
// ──────────────────────────────────────────

export async function getSupportTickets(status?: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  let query = supabase
    .from('support_tickets')
    .select('*, organizations(name), support_ticket_messages(count)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const { data } = await query
  return data || []
}

export async function createSupportTicket(data: {
  orgId: string
  subject: string
  description: string
  priority: string
  category: string
}) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { count } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true })
  const ticketNum = `TKT-${String((count || 0) + 100 + 1).padStart(3, '0')}`

  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number: ticketNum,
      organization_id: data.orgId,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      category: data.category,
      status: 'open',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/super-admin/support')
  return { success: true, ticketId: ticket.id }
}

export async function resolveTicket(ticketId: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  await supabase
    .from('support_tickets')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', ticketId)

  await supabase.from('platform_audit_logs').insert({
    action: 'ticket.resolved',
    target_type: 'support',
    target_id: ticketId,
    severity: 'low',
  })

  revalidatePath('/super-admin/support')
  return { success: true }
}

export async function replyToTicket(ticketId: string, content: string, senderName: string) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  await supabase.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_type: 'staff',
    sender_name: senderName,
    content,
  })

  await supabase
    .from('support_tickets')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', ticketId)

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
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  let query = supabase
    .from('platform_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters.limit || 200)

  if (filters.severity && filters.severity !== 'all') query = query.eq('severity', filters.severity)
  if (filters.targetType && filters.targetType !== 'all') query = query.eq('target_type', filters.targetType)

  const { data } = await query
  return data || []
}

// ──────────────────────────────────────────
// INTERNAL TEAM
// ──────────────────────────────────────────

export async function getTeamMembers() {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { data } = await supabase
    .from('super_admin_users')
    .select('*')
    .order('created_at', { ascending: true })

  return data || []
}

export async function inviteTeamMember(data: {
  email: string
  fullName: string
  role: string
  department: string
}) {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { data: member, error } = await supabase
    .from('super_admin_users')
    .insert({
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      department: data.department,
      is_active: false, // becomes true once they accept invite
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('platform_audit_logs').insert({
    action: 'team.member_invited',
    target_type: 'team',
    target_id: member.id,
    target_label: `${data.fullName} (${data.role})`,
    details: `Invited ${data.email} as ${data.role}`,
    severity: 'low',
  })

  revalidatePath('/super-admin/team')
  return { success: true }
}

// ──────────────────────────────────────────
// PLATFORM ANALYTICS
// ──────────────────────────────────────────

export async function getPlatformStats() {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const [{ count: totalClients }, { count: totalUsers }, { data: subscriptions }, { data: openTickets }] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('client_subscriptions').select('status, mrr_cents'),
    supabase.from('support_tickets').select('id').eq('status', 'open'),
  ])

  const activeClients = subscriptions?.filter(s => s.status === 'active').length || 0
  const totalMRR = subscriptions?.reduce((acc, s) => acc + (s.mrr_cents || 0), 0) || 0

  return {
    totalClients: totalClients || 0,
    totalUsers: totalUsers || 0,
    activeClients,
    totalMRR: totalMRR / 100,
    openTickets: openTickets?.length || 0,
  }
}
