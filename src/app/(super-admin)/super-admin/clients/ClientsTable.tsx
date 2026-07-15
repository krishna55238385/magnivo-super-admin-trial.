'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, MoreHorizontal, ExternalLink,
  Eye, Settings, Ban, BookmarkPlus,
  Bookmark, X, CheckSquare, Square, CheckCircle2, Clock3,
} from 'lucide-react'
import Link from 'next/link'
import { suspendClient, changeClientPlan, onboardClient } from '@/app/actions/super-admin'

export type Client = {
  id: string
  name: string
  created_at: string
  user_count: number
  plan_name: string | null
  status: string | null
  mrr_cents: number | null
  payment_status: string | null
  onboarding_complete: boolean
}

const STATUS_COLORS: Record<string, { color: string; dot: string }> = {
  active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  trial: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  past_due: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  suspended: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
}
const DEFAULT_STATUS_COLOR = { color: 'bg-white/[0.06] text-white/40 border-white/[0.1]', dot: 'bg-white/30' }

const PAYMENT_COLORS: Record<string, string> = {
  paid: 'text-emerald-400',
  overdue: 'text-amber-400',
  failed: 'text-red-400',
  trial: 'text-blue-400',
}
const DEFAULT_PAYMENT_COLOR = 'text-white/40'

const PLAN_COLORS: Record<string, string> = {
  enterprise: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  pro: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  growth: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  starter: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  trial: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}
const DEFAULT_PLAN_COLOR = 'text-white/40 bg-white/[0.06] border-white/[0.1]'

function formatLabel(v: string) {
  if (v === 'all') return 'All'
  return v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type SavedView = { name: string; status: string; plan: string; payment: string }

const DEFAULT_SAVED_VIEWS: SavedView[] = [
  { name: 'Payment Issues', status: 'all', plan: 'all', payment: 'overdue' },
  { name: 'Enterprise Only', status: 'all', plan: 'enterprise', payment: 'all' },
]

const PLAN_OPTIONS = ['Starter', 'Growth', 'Pro', 'Enterprise']

type BulkResult = { success: number; fail: number; errors: string[] }

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [onboardingFilter, setOnboardingFilter] = useState('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [onboardForm, setOnboardForm] = useState({ companyName: '', adminEmail: '', domain: '', plan: 'Starter' })
  const [onboardErrors, setOnboardErrors] = useState<Record<string, string>>({})
  const [onboardPending, setOnboardPending] = useState(false)
  const [onboardError, setOnboardError] = useState<string | null>(null)
  const [onboardResult, setOnboardResult] = useState<{ emailSent: boolean; inviteLink?: string; warning?: string } | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savedViews, setSavedViews] = useState<SavedView[]>(DEFAULT_SAVED_VIEWS)
  const [showSaveViewModal, setShowSaveViewModal] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [bulkActionKey, setBulkActionKey] = useState<'' | 'upgrade' | 'suspend'>('')
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [bulkPlanTarget, setBulkPlanTarget] = useState(PLAN_OPTIONS[0])
  const [bulkReason, setBulkReason] = useState('')
  const [bulkPending, setBulkPending] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)

  const statusOptions = useMemo(
    () => ['all', ...Array.from(new Set(clients.map(c => c.status ?? 'unknown')))],
    [clients]
  )
  const planOptions = useMemo(
    () => ['all', ...Array.from(new Set(clients.map(c => c.plan_name ?? 'unknown')))],
    [clients]
  )
  const paymentOptions = useMemo(
    () => ['all', ...Array.from(new Set(clients.map(c => c.payment_status ?? 'unknown')))],
    [clients]
  )

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (c.status ?? 'unknown') === statusFilter
    const matchPlan = planFilter === 'all' || (c.plan_name ?? 'unknown') === planFilter
    const matchPayment = paymentFilter === 'all' || (c.payment_status ?? 'unknown') === paymentFilter
    const matchOnboarding = onboardingFilter === 'all'
      || (onboardingFilter === 'complete' && c.onboarding_complete)
      || (onboardingFilter === 'pending' && !c.onboarding_complete)
    return matchSearch && matchStatus && matchPlan && matchPayment && matchOnboarding
  })

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(c => c.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function applyView(v: SavedView) {
    setStatusFilter(v.status)
    setPlanFilter(v.plan)
    setPaymentFilter(v.payment)
  }

  function saveCurrentView() {
    if (!newViewName.trim()) return
    setSavedViews(prev => [...prev, { name: newViewName.trim(), status: statusFilter, plan: planFilter, payment: paymentFilter }])
    setNewViewName('')
    setShowSaveViewModal(false)
  }

  function openOnboardModal() {
    setOnboardForm({ companyName: '', adminEmail: '', domain: '', plan: 'Starter' })
    setOnboardErrors({})
    setOnboardError(null)
    setOnboardResult(null)
    setLinkCopied(false)
    setShowOnboardModal(true)
  }

  function closeOnboardModal() {
    if (onboardPending) return
    const hadSuccess = !!onboardResult
    setShowOnboardModal(false)
    if (hadSuccess) router.refresh()
  }

  function validateOnboardForm() {
    const errors: Record<string, string> = {}
    if (!onboardForm.companyName.trim()) errors.companyName = 'Company name is required'
    if (!onboardForm.adminEmail.trim()) errors.adminEmail = 'Admin email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(onboardForm.adminEmail.trim())) errors.adminEmail = 'Enter a valid email address'
    if (!onboardForm.domain.trim()) errors.domain = 'Domain is required'
    else if (!/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(onboardForm.domain.trim())) errors.domain = 'Enter a valid domain (e.g. acmecorp.com)'
    return errors
  }

  async function handleOnboardSubmit() {
    const errors = validateOnboardForm()
    setOnboardErrors(errors)
    if (Object.keys(errors).length > 0) return

    setOnboardPending(true)
    setOnboardError(null)
    const result = await onboardClient({
      companyName: onboardForm.companyName.trim(),
      adminEmail: onboardForm.adminEmail.trim(),
      domain: onboardForm.domain.trim(),
      plan: onboardForm.plan,
    })
    setOnboardPending(false)
    if (result?.error) {
      setOnboardError(result.error)
      return
    }
    setOnboardResult({ emailSent: !!result.emailSent, inviteLink: result.inviteLink, warning: result.warning })
  }

  async function copyInviteLink() {
    if (!onboardResult?.inviteLink) return
    await navigator.clipboard.writeText(onboardResult.inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function openBulkConfirm(key: string) {
    if (key === 'export') {
      exportSelectedCsv()
      return
    }
    if (key === 'status') return // not implemented yet
    setBulkActionKey(key as 'upgrade' | 'suspend')
    setBulkResult(null)
    setBulkReason('')
    setBulkPlanTarget(PLAN_OPTIONS[0])
    setShowBulkConfirm(true)
  }

  function closeBulkModal() {
    if (bulkPending) return
    setShowBulkConfirm(false)
    setBulkActionKey('')
    setBulkResult(null)
    setBulkReason('')
    setSelected(new Set())
  }

  async function executeBulkAction() {
    if (!bulkActionKey) return
    const ids = Array.from(selected)
    setBulkPending(true)
    setBulkProgress({ done: 0, total: ids.length })

    let success = 0
    const errors: string[] = []
    for (const id of ids) {
      const clientName = clients.find(c => c.id === id)?.name ?? id
      const result = bulkActionKey === 'suspend'
        ? await suspendClient(id, bulkReason.trim() || 'Suspended via bulk action')
        : await changeClientPlan(id, bulkPlanTarget)
      if (result?.error) {
        errors.push(`${clientName}: ${result.error}`)
      } else {
        success++
      }
      setBulkProgress(p => ({ ...p, done: p.done + 1 }))
    }

    setBulkPending(false)
    setBulkResult({ success, fail: errors.length, errors })
    router.refresh()
  }

  function exportSelectedCsv() {
    const rows = filtered.filter(c => selected.has(c.id))
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
    const header = ['Client Name', 'Plan', 'Status', 'MRR', 'Users']
    const body = rows.map(c => [
      c.name,
      c.plan_name ?? '',
      c.status ?? '',
      c.mrr_cents ? (c.mrr_cents / 100).toFixed(2) : '0',
      String(c.user_count),
    ])
    const csv = [header, ...body].map(r => r.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const activeCount = clients.filter(c => c.status === 'active').length
  const pendingOnboardingCount = clients.filter(c => !c.onboarding_complete).length

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{clients.length} organizations · {activeCount} active
            {pendingOnboardingCount > 0 && <span className="ml-2 text-amber-400">· {pendingOnboardingCount} onboarding pending</span>}
          </p>
        </div>
        <button
          onClick={openOnboardModal}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Onboard Client
        </button>
      </div>

      {/* Saved Views */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-white/25 flex items-center gap-1"><Bookmark className="w-3 h-3" /> Views:</span>
        {savedViews.map(v => (
          <button
            key={v.name}
            onClick={() => applyView(v)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] transition-colors"
          >
            {v.name}
          </button>
        ))}
        <button
          onClick={() => setShowSaveViewModal(true)}
          className="text-[11px] px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/15 transition-colors flex items-center gap-1"
        >
          <BookmarkPlus className="w-3 h-3" /> Save current view
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#111118] border border-white/[0.08] rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-[13px] text-white/70 placeholder:text-white/25 outline-none flex-1"
            placeholder="Search clients…"
          />
        </div>

        {[
          { value: statusFilter, onChange: setStatusFilter, options: statusOptions },
          { value: planFilter, onChange: setPlanFilter, options: planOptions },
          { value: paymentFilter, onChange: setPaymentFilter, options: paymentOptions },
          { value: onboardingFilter, onChange: setOnboardingFilter, options: ['all', 'complete', 'pending'] },
        ].map(({ value, onChange, options }, i) => (
          <select
            key={i}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none"
          >
            {options.map(v => <option key={v} value={v}>{formatLabel(v)}</option>)}
          </select>
        ))}

        {(statusFilter !== 'all' || planFilter !== 'all' || paymentFilter !== 'all' || onboardingFilter !== 'all') && (
          <button
            onClick={() => { setStatusFilter('all'); setPlanFilter('all'); setPaymentFilter('all'); setOnboardingFilter('all') }}
            className="text-[11px] text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}

        <div className="ml-auto text-[12px] text-white/30">{filtered.length} results</div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-violet-600/10 border border-violet-500/25 rounded-xl px-4 py-3">
          <span className="text-[12px] text-violet-300 font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            {[
              { label: 'Upgrade Plan', value: 'upgrade' },
              { label: 'Change Status', value: 'status' },
              { label: 'Export CSV', value: 'export' },
              { label: 'Suspend All', value: 'suspend' },
            ].map(a => (
              <button
                key={a.value}
                disabled={a.value === 'status'}
                title={a.value === 'status' ? 'Not implemented yet' : undefined}
                onClick={() => openBulkConfirm(a.value)}
                className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  a.value === 'suspend'
                    ? 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/15'
                    : 'bg-white/[0.05] border-white/[0.1] text-white/60 hover:text-white hover:bg-white/[0.09]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3 w-10">
                <button onClick={toggleAll} className="text-white/30 hover:text-white/60 transition-colors">
                  {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-violet-400" /> : <Square className="w-3.5 h-3.5" />}
                </button>
              </th>
              {['Client', 'Plan', 'Status', 'Users', 'MRR', 'Payment', 'Onboarding', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-medium text-white/30 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const statusKey = c.status ?? 'unknown'
              const st = STATUS_COLORS[statusKey] ?? DEFAULT_STATUS_COLOR
              const planKey = (c.plan_name ?? 'unknown').toLowerCase()
              const planColorCls = PLAN_COLORS[planKey] ?? DEFAULT_PLAN_COLOR
              const paymentKey = c.payment_status ?? ''
              const paymentColorCls = PAYMENT_COLORS[paymentKey] ?? DEFAULT_PAYMENT_COLOR
              const isSelected = selected.has(c.id)
              return (
                <tr
                  key={c.id}
                  className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group ${isSelected ? 'bg-violet-500/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggleOne(c.id)} className="text-white/30 hover:text-white/60 transition-colors">
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-violet-400" /> : <Square className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <Link href={`/super-admin/clients/${c.id}`} className="text-[13px] font-medium text-white/85 hover:text-white transition-colors">
                          {c.name}
                        </Link>
                        <p className="text-[11px] text-white/30">Joined {formatDate(c.created_at)}</p>
                      </div>
                      {!c.onboarding_complete && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">ONBOARDING</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${planColorCls}`}>{formatLabel(c.plan_name ?? 'unknown')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {formatLabel(statusKey)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">{c.user_count}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-white/85">
                    {c.mrr_cents ? `$${(c.mrr_cents / 100).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {c.payment_status ? (
                      <span className={`text-[12px] font-medium capitalize ${paymentColorCls}`}>
                        {formatLabel(c.payment_status)}
                      </span>
                    ) : <span className="text-[11px] text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.onboarding_complete ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                        <Clock3 className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/super-admin/clients/${c.id}`}
                        className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                        <Eye className="w-3.5 h-3.5 text-white/50" />
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                          className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5 text-white/50" />
                        </button>
                        {openMenu === c.id && (
                          <div className="absolute right-0 top-8 z-50 bg-[#1a1a2e] border border-white/[0.1] rounded-lg shadow-xl py-1 w-44">
                            {[
                              { label: 'View Details', icon: Eye },
                              { label: 'Manage Settings', icon: Settings },
                              { label: 'Impersonate (30m)', icon: ExternalLink },
                              { label: 'Suspend', icon: Ban },
                            ].map(({ label, icon: Icon }) => (
                              <button key={label} className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors">
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Onboard modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeOnboardModal}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            {!onboardResult ? (
              <>
                <h2 className="text-[16px] font-semibold text-white mb-1">Onboard New Client</h2>
                <p className="text-[12px] text-white/40 mb-5">Create a new organization and send the admin their login credentials.</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-white/50 block mb-1">Company Name</label>
                    <input
                      value={onboardForm.companyName}
                      onChange={e => setOnboardForm({ ...onboardForm, companyName: e.target.value })}
                      disabled={onboardPending}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
                      placeholder="Acme Corp"
                    />
                    {onboardErrors.companyName && <p className="text-[11px] text-red-400 mt-1">{onboardErrors.companyName}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/50 block mb-1">Admin Email</label>
                    <input
                      value={onboardForm.adminEmail}
                      onChange={e => setOnboardForm({ ...onboardForm, adminEmail: e.target.value })}
                      disabled={onboardPending}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
                      placeholder="admin@acmecorp.com"
                    />
                    {onboardErrors.adminEmail && <p className="text-[11px] text-red-400 mt-1">{onboardErrors.adminEmail}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/50 block mb-1">Domain</label>
                    <input
                      value={onboardForm.domain}
                      onChange={e => setOnboardForm({ ...onboardForm, domain: e.target.value })}
                      disabled={onboardPending}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
                      placeholder="acmecorp.com"
                    />
                    {onboardErrors.domain && <p className="text-[11px] text-red-400 mt-1">{onboardErrors.domain}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/50 block mb-1">Plan</label>
                    <select
                      value={onboardForm.plan}
                      onChange={e => setOnboardForm({ ...onboardForm, plan: e.target.value })}
                      disabled={onboardPending}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none"
                    >
                      <option>Starter</option>
                      <option>Growth</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                </div>

                {onboardError && <p className="text-[12px] text-red-400 mt-4">{onboardError}</p>}

                <div className="flex gap-2 mt-5">
                  <button disabled={onboardPending} onClick={closeOnboardModal} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors disabled:opacity-40">Cancel</button>
                  <button disabled={onboardPending} onClick={handleOnboardSubmit} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors disabled:opacity-50">
                    {onboardPending ? 'Creating…' : 'Create Client'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[16px] font-semibold text-white mb-1">Client Created</h2>
                {onboardResult.emailSent ? (
                  <p className="text-[12px] text-white/40 mb-4">
                    A welcome email with login credentials was sent to <span className="text-white/70">{onboardForm.adminEmail}</span>. They can log in right away.
                  </p>
                ) : (
                  <>
                    <p className="text-[12px] text-amber-400 mb-2">
                      {onboardResult.warning || 'The welcome email failed to send.'}
                    </p>
                    <p className="text-[12px] text-white/40 mb-4">
                      Share this invite link with {onboardForm.adminEmail} manually:
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        readOnly
                        value={onboardResult.inviteLink}
                        onFocus={e => e.target.select()}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 outline-none"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="shrink-0 py-2 px-3 rounded-lg border border-white/[0.1] text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                      >
                        {linkCopied ? 'Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </>
                )}
                <button onClick={closeOnboardModal} className="w-full mt-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Save view modal */}
      {showSaveViewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSaveViewModal(false)}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-white mb-4">Save Current View</h2>
            <div className="space-y-3 mb-4">
              <div className="text-[11px] text-white/30 space-y-1">
                {statusFilter !== 'all' && <p>Status: <span className="text-white/50">{formatLabel(statusFilter)}</span></p>}
                {planFilter !== 'all' && <p>Plan: <span className="text-white/50">{formatLabel(planFilter)}</span></p>}
                {paymentFilter !== 'all' && <p>Payment: <span className="text-white/50">{formatLabel(paymentFilter)}</span></p>}
              </div>
              <input
                value={newViewName}
                onChange={e => setNewViewName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50"
                placeholder="View name (e.g. High Value Trials)"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowSaveViewModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveCurrentView} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Save View</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action confirm */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeBulkModal}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            {!bulkResult ? (
              <>
                <h2 className="text-[15px] font-semibold text-white mb-2">
                  {bulkActionKey === 'suspend' ? 'Suspend All' : 'Upgrade Plan'}
                </h2>
                <p className="text-[12px] text-white/40 mb-4">
                  This will apply to <span className="text-white/70 font-semibold">{selected.size} client{selected.size > 1 ? 's' : ''}</span>.
                </p>

                {bulkActionKey === 'upgrade' && (
                  <div className="mb-4">
                    <label className="text-[11px] font-medium text-white/50 block mb-1">New Plan</label>
                    <select
                      value={bulkPlanTarget}
                      onChange={e => setBulkPlanTarget(e.target.value)}
                      disabled={bulkPending}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none"
                    >
                      {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {bulkActionKey === 'suspend' && (
                  <div className="mb-4">
                    <label className="text-[11px] font-medium text-white/50 block mb-1">Reason (optional)</label>
                    <input
                      value={bulkReason}
                      onChange={e => setBulkReason(e.target.value)}
                      disabled={bulkPending}
                      placeholder="Suspended via bulk action"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none"
                    />
                  </div>
                )}

                {bulkPending && (
                  <p className="text-[11px] text-violet-300 mb-3">Processing {bulkProgress.done} of {bulkProgress.total}…</p>
                )}

                <div className="flex gap-2">
                  <button disabled={bulkPending} onClick={closeBulkModal} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors disabled:opacity-40">Cancel</button>
                  <button disabled={bulkPending} onClick={executeBulkAction} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors disabled:opacity-50">
                    {bulkPending ? 'Processing…' : 'Confirm'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[15px] font-semibold text-white mb-2">
                  {bulkResult.fail === 0 ? 'Done' : 'Completed with errors'}
                </h2>
                <p className="text-[12px] text-white/70 mb-3">
                  {bulkResult.success} of {bulkResult.success + bulkResult.fail} {bulkActionKey === 'suspend' ? 'suspended' : 'upgraded'}
                  {bulkResult.fail > 0 && `, ${bulkResult.fail} failed`}
                </p>
                {bulkResult.errors.length > 0 && (
                  <ul className="text-[11px] text-red-400 space-y-1 mb-4 max-h-32 overflow-y-auto">
                    {bulkResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
                <button onClick={closeBulkModal} className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
