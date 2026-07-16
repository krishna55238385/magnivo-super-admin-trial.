'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Users, CreditCard, Zap, Settings,
  AlertCircle, ExternalLink, Shield,
  Globe, Calendar, DollarSign,
  FileText, Ban, Edit2, Plus, RotateCcw,
  LifeBuoy, BarChart2, MessageSquare, Send, Clock, Lock, X, Activity
} from 'lucide-react'
import Link from 'next/link'
import {
  suspendClient, deleteOrganization, changeClientPlan, updateClientNotes,
  updateClientUser, deactivateClientUser, reactivateClientUser,
  setClientUserLimit,
} from '@/app/actions/super-admin'
import IssueInvoiceModal, { InvoicePlanOption } from '@/components/super-admin/IssueInvoiceModal'

type Org = { id: string; name: string; created_at: string; timezone?: string | null; currency?: string | null; logo_url?: string | null }
type User = { id: string; full_name: string | null; role: string | null; email?: string | null; is_active?: boolean | null; created_at?: string }
type Invoice = { id: string; invoice_number: string; amount_cents: number; status: string; issued_at: string }
type UsageRow = { model: string; feature: string; total_tokens: number; estimated_cost_usd: number }
type Ticket = { id: string; ticket_number?: string; subject?: string; description?: string; priority?: string; status?: string; category?: string; message_count?: number; created_at?: string }
type AuditLog = Record<string, any>

const tabs = ['Overview', 'Users', 'Billing', 'Usage', 'Integrations', 'Support', 'Notes', 'Settings', 'Audit']

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const invoiceStatusColor: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  overdue: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  void: 'bg-white/[0.06] text-white/40 border-white/[0.1]',
}

const statusBadgeColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  suspended: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const PLAN_OPTIONS = ['Starter', 'Growth', 'Pro', 'Enterprise']

const ticketStatusColor: Record<string, string> = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-white/[0.06] text-white/40 border-white/[0.1]',
}

const OPEN_TICKET_STATUSES = new Set(['open', 'in_progress', 'waiting'])

export default function ClientDetailView({
  org, users, invoices, usageSummary, status, plan, tickets, auditLogs, notes: initialNotes, plans,
  userLimit, planMaxUsers,
}: {
  org: Org
  users: User[]
  invoices: Invoice[]
  usageSummary: UsageRow[]
  status: string
  plan: string
  tickets: Ticket[]
  auditLogs: AuditLog[]
  notes: string | null
  plans: InvoicePlanOption[]
  userLimit: number | null
  planMaxUsers: number | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState('Overview')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [showDangerConfirm, setShowDangerConfirm] = useState<string | null>(null)
  const [dangerInput, setDangerInput] = useState('')
  const [dangerReason, setDangerReason] = useState('')
  const [dangerPending, setDangerPending] = useState(false)
  const [dangerError, setDangerError] = useState<string | null>(null)
  const [clientStatus, setClientStatus] = useState(status)
  const [clientPlan, setClientPlan] = useState(plan)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(plan)
  const [planPending, setPlanPending] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [notesPending, setNotesPending] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [clientUsers, setClientUsers] = useState(users)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editUserPending, setEditUserPending] = useState(false)
  const [editUserError, setEditUserError] = useState<string | null>(null)
  const [deactivateUserTarget, setDeactivateUserTarget] = useState<User | null>(null)
  const [deactivateUserInput, setDeactivateUserInput] = useState('')
  const [deactivateUserPending, setDeactivateUserPending] = useState(false)
  const [deactivateUserError, setDeactivateUserError] = useState<string | null>(null)
  const [reactivatingUserId, setReactivatingUserId] = useState<string | null>(null)
  const [userLimitOverride, setUserLimitOverride] = useState<number | null>(userLimit)
  const [showUserLimitModal, setShowUserLimitModal] = useState(false)
  const [userLimitInput, setUserLimitInput] = useState('')
  const [userLimitPending, setUserLimitPending] = useState(false)
  const [userLimitError, setUserLimitError] = useState<string | null>(null)

  const effectiveUserLimit = userLimitOverride ?? planMaxUsers

  const dangerActions: Record<string, { label: string; confirmWord: string; color: string }> = {
    suspend: { label: 'Suspend Organization', confirmWord: 'SUSPEND', color: 'amber' },
    delete: { label: 'Delete Organization', confirmWord: 'DELETE', color: 'red' },
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function openDangerConfirm(action: string) {
    setShowDangerConfirm(action)
    setDangerInput('')
    setDangerReason('')
    setDangerError(null)
  }

  async function handleDangerConfirm() {
    if (!showDangerConfirm) return
    if (showDangerConfirm !== 'suspend' && showDangerConfirm !== 'delete') {
      setDangerError('This action is not implemented yet.')
      return
    }
    setDangerPending(true)
    setDangerError(null)
    const result = showDangerConfirm === 'suspend'
      ? await suspendClient(org.id, dangerReason.trim() || 'Suspended via admin dashboard')
      : await deleteOrganization(org.id)
    setDangerPending(false)
    if (result?.error) {
      setDangerError(result.error)
      return
    }
    if (showDangerConfirm === 'suspend') {
      setClientStatus('suspended')
      setShowDangerConfirm(null)
      setToast({ type: 'success', text: `${org.name} has been suspended.` })
      return
    }
    setShowDangerConfirm(null)
    router.push('/super-admin/clients')
  }

  function openPlanModal() {
    setSelectedPlan(clientPlan)
    setPlanError(null)
    setShowPlanModal(true)
  }

  async function handlePlanConfirm() {
    if (selectedPlan === clientPlan) return
    setPlanPending(true)
    setPlanError(null)
    const result = await changeClientPlan(org.id, selectedPlan)
    setPlanPending(false)
    if (result?.error) {
      setPlanError(result.error)
      return
    }
    setClientPlan(selectedPlan)
    setShowPlanModal(false)
    setToast({ type: 'success', text: `${org.name}'s plan changed to ${selectedPlan}.` })
  }

  async function handleSaveNotes() {
    setNotesPending(true)
    setNotesError(null)
    const result = await updateClientNotes(org.id, notes)
    setNotesPending(false)
    if (result?.error) {
      setNotesError(result.error)
      return
    }
    setToast({ type: 'success', text: 'Notes saved.' })
  }

  function openEditUser(u: User) {
    setEditUser(u)
    setEditFullName(u.full_name ?? '')
    setEditEmail(u.email ?? '')
    setEditUserError(null)
  }

  async function handleEditUserConfirm() {
    if (!editUser) return
    const email = editEmail.trim()
    if (!email) {
      setEditUserError('Email is required')
      return
    }
    setEditUserPending(true)
    setEditUserError(null)
    const result = await updateClientUser(editUser.id, { full_name: editFullName.trim(), email })
    setEditUserPending(false)
    if (result?.error) {
      setEditUserError(result.error)
      return
    }
    setClientUsers(prev => prev.map(u => (u.id === editUser.id ? { ...u, full_name: editFullName.trim() || null, email } : u)))
    setToast({ type: 'success', text: `${editFullName.trim() || email}'s profile was updated.` })
    setEditUser(null)
  }

  function openDeactivateUser(u: User) {
    setDeactivateUserTarget(u)
    setDeactivateUserInput('')
    setDeactivateUserError(null)
  }

  async function handleDeactivateUserConfirm() {
    if (!deactivateUserTarget) return
    setDeactivateUserPending(true)
    setDeactivateUserError(null)
    const result = await deactivateClientUser(deactivateUserTarget.id)
    setDeactivateUserPending(false)
    if (result?.error) {
      setDeactivateUserError(result.error)
      return
    }
    setClientUsers(prev => prev.map(u => (u.id === deactivateUserTarget.id ? { ...u, is_active: false } : u)))
    setToast({ type: 'success', text: `${deactivateUserTarget.full_name || deactivateUserTarget.email || 'User'} has been deactivated.` })
    setDeactivateUserTarget(null)
  }

  async function handleReactivateUser(u: User) {
    setReactivatingUserId(u.id)
    const result = await reactivateClientUser(u.id)
    setReactivatingUserId(null)
    if (result?.error) {
      setToast({ type: 'error', text: result.error })
      return
    }
    setClientUsers(prev => prev.map(x => (x.id === u.id ? { ...x, is_active: true } : x)))
    setToast({ type: 'success', text: `${u.full_name || u.email || 'User'} has been reactivated.` })
  }

  function openUserLimitModal() {
    setUserLimitInput(userLimitOverride != null ? String(userLimitOverride) : '')
    setUserLimitError(null)
    setShowUserLimitModal(true)
  }

  async function handleUserLimitConfirm() {
    const trimmed = userLimitInput.trim()
    let parsed: number | null = null
    if (trimmed !== '') {
      const n = Number(trimmed)
      if (!Number.isInteger(n) || n <= 0) {
        setUserLimitError('Enter a positive whole number, or leave blank to inherit the plan default')
        return
      }
      parsed = n
    }
    setUserLimitPending(true)
    setUserLimitError(null)
    const result = await setClientUserLimit(org.id, parsed)
    setUserLimitPending(false)
    if (result?.error) {
      setUserLimitError(result.error)
      return
    }
    setUserLimitOverride(parsed)
    setShowUserLimitModal(false)
    setToast({
      type: 'success',
      text: parsed === null
        ? `${org.name}'s user limit now inherits the ${clientPlan} plan default.`
        : `${org.name}'s user limit set to ${parsed}.`,
    })
  }

  function handleInvoiceSuccess(message: string) {
    setShowIssueModal(false)
    router.refresh()
    setToast({ type: 'success', text: message })
  }

  const totalTokens30d = usageSummary.reduce((sum, r) => sum + (Number(r.total_tokens) || 0), 0)
  const activeUserCount = clientUsers.filter(u => u.is_active !== false).length
  const openTicketCount = tickets.filter(t => OPEN_TICKET_STATUSES.has(t.status ?? '')).length
  const totalInvoicedCents = invoices.reduce((sum, i) => sum + (Number(i.amount_cents) || 0), 0)

  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Breadcrumb & header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/super-admin/clients" className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[15px] font-bold text-white/70">
              {org.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{org.name}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusBadgeColor[clientStatus] ?? statusBadgeColor.trial}`}>
                  {clientStatus}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-violet-500/10 text-violet-400 border-violet-500/20">
                  {clientPlan}
                </span>
              </div>
              <p className="text-[12px] text-white/40 mt-0.5">Joined {formatDate(org.created_at)}{org.timezone ? ` · ${org.timezone}` : ''}{org.currency ? ` · ${org.currency}` : ''}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openPlanModal}
            className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" /> Change Plan
          </button>
          <button
            onClick={() => setShowImpersonateModal(true)}
            className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Impersonate
          </button>
          <button
            onClick={() => openDangerConfirm('suspend')}
            disabled={clientStatus === 'suspended'}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] px-3 py-2 rounded-lg hover:bg-amber-500/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Ban className="w-3.5 h-3.5" /> {clientStatus === 'suspended' ? 'Suspended' : 'Suspend'}
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: clientUsers.length, sub: `${activeUserCount} / ${effectiveUserLimit ?? '∞'} active`, icon: Users, color: 'text-blue-400' },
          { label: 'Tokens (30d)', value: totalTokens30d.toLocaleString(), sub: `${usageSummary.length} model/feature combos`, icon: Zap, color: 'text-amber-400' },
          { label: 'Open Tickets', value: openTicketCount, sub: `${tickets.length} total`, icon: LifeBuoy, color: 'text-violet-400' },
          { label: 'Total Invoiced', value: `$${(totalInvoicedCents / 100).toLocaleString()}`, sub: `${invoices.length} invoices`, icon: DollarSign, color: 'text-emerald-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-white/40">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-[18px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all relative ${
              tab === t
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
            {t === 'Support' && openTicketCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">
                {openTicketCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {/* Recent invoices */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[13px] font-semibold text-white mb-4">Recent Invoices</p>
              <div className="space-y-2">
                {invoices.length === 0 && <p className="text-[12px] text-white/30">No invoices yet.</p>}
                {invoices.slice(0, 5).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-[12px] font-medium text-white/70">{inv.invoice_number}</p>
                        <p className="text-[11px] text-white/30">{formatDate(inv.issued_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-white">${(inv.amount_cents / 100).toLocaleString()}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${invoiceStatusColor[inv.status] ?? invoiceStatusColor.void}`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-4">Account Info</p>
              <div className="space-y-3">
                {[
                  { label: 'Organization', value: org.name, icon: Shield },
                  { label: 'Joined', value: formatDate(org.created_at), icon: Calendar },
                  { label: 'Timezone', value: org.timezone || '—', icon: Globe },
                  { label: 'Currency', value: org.currency || '—', icon: DollarSign },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25">{label}</p>
                      <p className="text-[12px] text-white/70">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes preview */}
            {notes && (
              <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Internal Notes</p>
                  <button onClick={() => setTab('Notes')} className="text-[10px] text-violet-400 hover:text-violet-300">See all</button>
                </div>
                <p className="text-[12px] text-white/60 line-clamp-3">{notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <p className="text-[13px] font-semibold text-white">{clientUsers.length} Users</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {activeUserCount} / {effectiveUserLimit ?? '∞'} active seats used
                {userLimitOverride != null && <span className="text-violet-400"> · custom limit</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openUserLimitModal}
                className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-3 py-1.5 rounded-lg hover:bg-white/[0.08] transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Limit
              </button>
              <button className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 text-[12px] px-3 py-1.5 rounded-lg hover:bg-violet-600/30 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add User
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Name', 'Email', 'Role', 'Joined', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientUsers.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-[12px] text-white/30">No users found.</td></tr>
              )}
              {clientUsers.map(u => (
                <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold">
                        {(u.full_name || '?').charAt(0)}
                      </div>
                      <span className="text-[13px] font-medium text-white/80">{u.full_name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{u.email || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      u.role === 'admin' || u.role === 'super_admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-white/[0.05] text-white/50'
                    }`}>{u.role || 'user'}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-white/40">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.is_active === false ? 'bg-white/20' : 'bg-emerald-400'}`} />
                      <span className={`text-[11px] ${u.is_active === false ? 'text-white/30' : 'text-emerald-400'}`}>{u.is_active === false ? 'inactive' : 'active'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {u.is_active === false ? (
                      <button
                        onClick={() => handleReactivateUser(u)}
                        disabled={reactivatingUserId === u.id}
                        className="inline-flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {reactivatingUserId === u.id ? 'Reactivating…' : 'Reactivate'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditUser(u)} className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.15] transition-colors">Edit</button>
                        <button onClick={() => openDeactivateUser(u)} className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Billing' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-white">Invoice History</p>
            <button
              onClick={() => setShowIssueModal(true)}
              className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Issue Invoice
            </button>
          </div>
          {invoices.length === 0 && <p className="text-[12px] text-white/30">No invoices yet.</p>}
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white/30" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white/80">{inv.invoice_number}</p>
                  <p className="text-[11px] text-white/30">{formatDate(inv.issued_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-[14px] font-semibold text-white">${(inv.amount_cents / 100).toLocaleString()}</p>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${invoiceStatusColor[inv.status] ?? invoiceStatusColor.void}`}>{inv.status}</span>
                <button className="text-[11px] text-white/30 hover:text-white/60">Download</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Usage' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">Token Usage — Last 30 Days</p>
            <p className="text-[11px] text-white/30 mt-0.5">{totalTokens30d.toLocaleString()} total tokens across {usageSummary.length} model/feature combinations</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Model', 'Feature', 'Tokens', 'Est. Cost'].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usageSummary.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-[12px] text-white/30">No usage recorded in the last 30 days.</td></tr>
              )}
              {usageSummary.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[12px] text-white/70">{r.model}</td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{r.feature}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-white/80">{Number(r.total_tokens).toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] text-white/60">${Number(r.estimated_cost_usd).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Support' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-8 text-center">
              <LifeBuoy className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-[14px] text-white/50 font-medium">No support tickets</p>
              <p className="text-[12px] text-white/25 mt-1">This client has no tickets on record.</p>
              <button className="mt-4 px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-[12px] text-violet-400 hover:bg-violet-600/30 transition-colors">
                Create Ticket
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Ticket', 'Subject', 'Priority', 'Status', 'Category', 'Messages', 'Created'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[12px] text-white/50 font-mono">{t.ticket_number ?? t.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-[13px] text-white/80">{t.subject ?? '—'}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50 capitalize">{t.priority ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${ticketStatusColor[t.status ?? ''] ?? ticketStatusColor.closed}`}>{t.status ?? 'unknown'}</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{t.category ?? '—'}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{t.message_count ?? 0}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{formatDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Internal Notes tab */}
      {tab === 'Notes' && (
        <div className="space-y-4">
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-[12px] text-amber-300/70">These notes are internal only — never visible to the client.</p>
          </div>

          <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setNotesError(null) }}
              rows={6}
              className="w-full bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none resize-none"
              placeholder="No internal notes yet. Add context, flag risk, or leave updates for teammates…"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-white/25">Visible only to Magnivo team</span>
              <button
                onClick={handleSaveNotes}
                disabled={notesPending}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> {notesPending ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
            {notesError && <p className="text-[11px] text-red-400 mt-2">{notesError}</p>}
          </div>

          {!notes && (
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
              <MessageSquare className="w-7 h-7 text-white/15 mx-auto mb-3" />
              <p className="text-[13px] text-white/30">No internal notes yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'Settings' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-semibold text-white">Organization Details</p>
              <button className="text-[11px] text-violet-400 flex items-center gap-1 hover:text-violet-300">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Company Name', value: org.name },
                { label: 'Timezone', value: org.timezone || '—' },
                { label: 'Currency', value: org.currency || '—' },
                { label: 'Joined', value: formatDate(org.created_at) },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-[12px] text-white/40">{f.label}</span>
                  <span className="text-[12px] font-medium text-white/80">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5">
            <p className="text-[13px] font-semibold text-red-400 mb-1">Danger Zone</p>
            <p className="text-[12px] text-white/40 mb-4">These actions are irreversible. A typed confirmation is required.</p>
            <div className="space-y-2">
              <button
                onClick={() => openDangerConfirm('suspend')}
                disabled={clientStatus === 'suspended'}
                className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-400 hover:bg-amber-500/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {clientStatus === 'suspended' ? 'Organization Suspended' : 'Suspend Organization'}
              </button>
              <button
                onClick={() => openDangerConfirm('delete')}
                className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 hover:bg-red-500/15 transition-colors"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Audit' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-[14px] text-white/50 font-medium">No audit events</p>
              <p className="text-[12px] text-white/25 mt-1">No actions have been logged for this client yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {auditLogs.map((log, i) => (
                <div key={log.id ?? i} className="flex items-start gap-3 px-5 py-3">
                  <Activity className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[12px] text-white/70">
                      <span className="font-medium">{log.event_code ?? 'Event'}</span>
                      {(log.actor_name ?? log.actor_email) && <span className="text-white/40"> — by {log.actor_name ?? log.actor_email}</span>}
                    </p>
                    {log.details?.message && (
                      <p className="text-[11px] text-white/40 mt-0.5">{log.details.message}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-white/25 whitespace-nowrap">{formatDateTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Integrations' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
          <BarChart2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-[14px] text-white/50 font-medium">Integrations — Coming Soon</p>
          <p className="text-[12px] text-white/25 mt-1">This section is under active development.</p>
        </div>
      )}

      {/* Impersonation modal */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowImpersonateModal(false)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <ExternalLink className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-white">Impersonate {org.name}</h2>
                <p className="text-[11px] text-white/40">View the platform exactly as this client sees it</p>
              </div>
            </div>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3 mb-5 space-y-1.5">
              {[
                'Session auto-expires after 30 minutes',
                'Sensitive actions (billing, suspension) are blocked',
                'This entire session will be recorded in the audit log',
              ].map(w => (
                <div key={w} className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/70">{w}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowImpersonateModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => setShowImpersonateModal(false)} className="flex-1 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-[13px] text-white font-medium transition-colors">Start Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Danger action confirm modal */}
      {showDangerConfirm && (() => {
        const action = dangerActions[showDangerConfirm]
        const isRed = action.color === 'red'
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDangerConfirm(null)}>
            <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h2 className={`text-[15px] font-semibold mb-2 ${isRed ? 'text-red-400' : 'text-amber-400'}`}>{action.label}</h2>
              <p className="text-[12px] text-white/40 mb-4">
                Type <span className={`font-mono font-bold ${isRed ? 'text-red-400' : 'text-amber-400'}`}>{action.confirmWord}</span> to confirm this action.
              </p>
              <input
                value={dangerInput}
                onChange={e => setDangerInput(e.target.value)}
                className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-4 ${isRed ? 'border-red-500/30 focus:border-red-500/60' : 'border-amber-500/30 focus:border-amber-500/60'}`}
                placeholder={action.confirmWord}
              />
              {showDangerConfirm === 'suspend' && (
                <textarea
                  value={dangerReason}
                  onChange={e => setDangerReason(e.target.value)}
                  rows={2}
                  placeholder="Reason (optional) — recorded in the audit log"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/25 outline-none mb-4 resize-none"
                />
              )}
              {dangerError && <p className="text-[11px] text-red-400 mb-3">{dangerError}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowDangerConfirm(null)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
                <button
                  onClick={handleDangerConfirm}
                  disabled={dangerInput !== action.confirmWord || dangerPending}
                  className={`flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isRed ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                >
                  {dangerPending ? 'Working…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Change Plan modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlanModal(false)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-white mb-1">Change Plan</h2>
            <p className="text-[12px] text-white/40 mb-4">Select a new plan for {org.name}.</p>
            <div className="space-y-2 mb-4">
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                    selectedPlan === p
                      ? 'border-violet-500/50 bg-violet-600/15 text-violet-300'
                      : 'border-white/[0.08] text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{p}</span>
                  {clientPlan === p && <span className="text-[10px] text-white/30">Current</span>}
                </button>
              ))}
            </div>
            {planError && <p className="text-[11px] text-red-400 mb-3">{planError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowPlanModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handlePlanConfirm}
                disabled={selectedPlan === clientPlan || planPending}
                className="flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500"
              >
                {planPending ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set User Limit modal */}
      {showUserLimitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowUserLimitModal(false)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-white mb-1">Set User Limit</h2>
            <p className="text-[12px] text-white/40 mb-4">
              Override the seat cap for {org.name}. Leave blank to inherit the {clientPlan} plan default
              {planMaxUsers != null ? ` (${planMaxUsers})` : ' (unlimited)'}.
            </p>
            <label className="text-[11px] font-medium text-white/50 block mb-1">User Limit</label>
            <input
              value={userLimitInput}
              onChange={e => { setUserLimitInput(e.target.value); setUserLimitError(null) }}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-1"
              placeholder={planMaxUsers != null ? String(planMaxUsers) : 'Unlimited'}
              inputMode="numeric"
            />
            <p className="text-[10px] text-white/25 mb-4">Blank = inherit plan default. Currently {activeUserCount} active user{activeUserCount === 1 ? '' : 's'}.</p>
            {userLimitError && <p className="text-[11px] text-red-400 mb-3">{userLimitError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setShowUserLimitModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleUserLimitConfirm}
                disabled={userLimitPending}
                className="flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500"
              >
                {userLimitPending ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-white mb-1">Edit User</h2>
            <p className="text-[12px] text-white/40 mb-4">
              Update profile details for this user in {org.name}.
            </p>
            <label className="text-[11px] font-medium text-white/50 block mb-1">Full Name</label>
            <input
              value={editFullName}
              onChange={e => setEditFullName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-3"
              placeholder="Jane Doe"
            />
            <label className="text-[11px] font-medium text-white/50 block mb-1">Email</label>
            <input
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-4"
              placeholder="jane@acmecorp.com"
            />
            {editUserError && <p className="text-[11px] text-red-400 mb-3">{editUserError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleEditUserConfirm}
                disabled={!editEmail.trim() || (editFullName.trim() === (editUser.full_name ?? '') && editEmail.trim() === (editUser.email ?? '')) || editUserPending}
                className="flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500"
              >
                {editUserPending ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate user confirm modal */}
      {deactivateUserTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeactivateUserTarget(null)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-red-400 mb-2">Deactivate {deactivateUserTarget.full_name || deactivateUserTarget.email || 'this user'}</h2>
            <p className="text-[12px] text-white/40 mb-4">
              Type <span className="font-mono font-bold text-red-400">DEACTIVATE</span> to confirm. They will immediately lose access to {org.name}'s workspace.
            </p>
            <input
              value={deactivateUserInput}
              onChange={e => setDeactivateUserInput(e.target.value)}
              className="w-full bg-white/[0.04] border border-red-500/30 focus:border-red-500/60 rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-4"
              placeholder="DEACTIVATE"
            />
            {deactivateUserError && <p className="text-[11px] text-red-400 mb-3">{deactivateUserError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setDeactivateUserTarget(null)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={handleDeactivateUserConfirm}
                disabled={deactivateUserInput !== 'DEACTIVATE' || deactivateUserPending}
                className="flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500"
              >
                {deactivateUserPending ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIssueModal && (
        <IssueInvoiceModal
          onClose={() => setShowIssueModal(false)}
          onSuccess={handleInvoiceSuccess}
          plans={plans}
          fixedOrgId={org.id}
          fixedOrgName={org.name}
          defaultPlanName={clientPlan}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg border text-[12px] font-medium shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' : 'bg-red-950/90 border-red-500/30 text-red-300'
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}
