'use client'

import { useState } from 'react'
import {
  Building2, Search, Filter, Plus, MoreHorizontal, CheckCircle2,
  AlertCircle, XCircle, ExternalLink, Users, Zap, DollarSign,
  Eye, Settings, Ban, ArrowUpRight, RefreshCw, BookmarkPlus,
  Bookmark, ChevronDown, X, CheckSquare, Square, TrendingUp,
  TrendingDown, Heart
} from 'lucide-react'
import Link from 'next/link'

const clients = [
  {
    id: 'c1', name: 'Acme Corp', domain: 'acmecorp.com', plan: 'Enterprise',
    status: 'active', users: 24, mrr: 4200, tokensThisMonth: '48.2M',
    tokenCost: 96.40, joinedAt: 'Jan 12, 2026', owner: 'Sarah Chen',
    industry: 'SaaS', healthScore: 98, lastActive: '2 min ago',
    openIssues: 0, paymentStatus: 'paid',
  },
  {
    id: 'c2', name: 'TechVentures', domain: 'techventures.io', plan: 'Pro',
    status: 'active', users: 12, mrr: 1800, tokensThisMonth: '21.4M',
    tokenCost: 42.80, joinedAt: 'Feb 3, 2026', owner: 'Marcus Webb',
    industry: 'FinTech', healthScore: 95, lastActive: '1 hr ago',
    openIssues: 1, paymentStatus: 'paid',
  },
  {
    id: 'c3', name: 'SalesGenius', domain: 'salesgenius.com', plan: 'Pro',
    status: 'issues', users: 8, mrr: 1800, tokensThisMonth: '12.1M',
    tokenCost: 24.20, joinedAt: 'Mar 22, 2026', owner: 'Priya Nair',
    industry: 'CRM/Sales', healthScore: 78, lastActive: '3 hr ago',
    openIssues: 3, paymentStatus: 'overdue',
  },
  {
    id: 'c4', name: 'DataSync Pro', domain: 'datasync.pro', plan: 'Growth',
    status: 'active', users: 6, mrr: 1200, tokensThisMonth: '14.8M',
    tokenCost: 29.60, joinedAt: 'Apr 8, 2026', owner: 'Ali Hassan',
    industry: 'Data', healthScore: 92, lastActive: '30 min ago',
    openIssues: 0, paymentStatus: 'paid',
  },
  {
    id: 'c5', name: 'GrowthLab', domain: 'growthlab.io', plan: 'Starter',
    status: 'active', users: 3, mrr: 490, tokensThisMonth: '6.3M',
    tokenCost: 12.60, joinedAt: 'May 14, 2026', owner: 'Lena Schmidt',
    industry: 'Marketing', healthScore: 88, lastActive: '2 hr ago',
    openIssues: 0, paymentStatus: 'paid',
  },
  {
    id: 'c6', name: 'Nexus Digital', domain: 'nexusdigital.co', plan: 'Growth',
    status: 'suspended', users: 7, mrr: 0, tokensThisMonth: '0',
    tokenCost: 0, joinedAt: 'Mar 5, 2026', owner: 'Tom Bradley',
    industry: 'Agency', healthScore: 0, lastActive: '14 days ago',
    openIssues: 2, paymentStatus: 'failed',
  },
  {
    id: 'c7', name: 'CloudScale', domain: 'cloudscale.ai', plan: 'Enterprise',
    status: 'trial', users: 18, mrr: 0, tokensThisMonth: '8.4M',
    tokenCost: 16.80, joinedAt: 'Jun 25, 2026', owner: 'Raj Patel',
    industry: 'Cloud', healthScore: 91, lastActive: '4 hr ago',
    openIssues: 0, paymentStatus: 'trial',
  },
]

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  issues: { label: 'Issues', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  suspended: { label: 'Suspended', color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  trial: { label: 'Trial', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
}

const paymentConfig: Record<string, string> = {
  paid: 'text-emerald-400',
  overdue: 'text-red-400',
  failed: 'text-red-400',
  trial: 'text-blue-400',
}

const planColor: Record<string, string> = {
  Enterprise: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Pro: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Growth: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Starter: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

type SavedView = { name: string; status: string; plan: string; health: string; payment: string }

const DEFAULT_SAVED_VIEWS: SavedView[] = [
  { name: 'At Risk', status: 'issues', plan: 'all', health: 'low', payment: 'all' },
  { name: 'Payment Issues', status: 'all', plan: 'all', health: 'all', payment: 'overdue' },
  { name: 'Enterprise Only', status: 'all', plan: 'Enterprise', health: 'all', payment: 'all' },
]

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [showOnboardModal, setShowOnboardModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [savedViews, setSavedViews] = useState<SavedView[]>(DEFAULT_SAVED_VIEWS)
  const [showSaveViewModal, setShowSaveViewModal] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [bulkAction, setBulkAction] = useState('')
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.domain.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const matchPlan = planFilter === 'all' || c.plan === planFilter
    const matchPayment = paymentFilter === 'all' || c.paymentStatus === paymentFilter
    const matchHealth = healthFilter === 'all'
      || (healthFilter === 'high' && c.healthScore >= 90)
      || (healthFilter === 'medium' && c.healthScore >= 70 && c.healthScore < 90)
      || (healthFilter === 'low' && c.healthScore < 70)
    return matchSearch && matchStatus && matchPlan && matchPayment && matchHealth
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
    setHealthFilter(v.health)
    setPaymentFilter(v.payment)
  }

  function saveCurrentView() {
    if (!newViewName.trim()) return
    setSavedViews(prev => [...prev, { name: newViewName.trim(), status: statusFilter, plan: planFilter, health: healthFilter, payment: paymentFilter }])
    setNewViewName('')
    setShowSaveViewModal(false)
  }

  function executeBulkAction() {
    setSelected(new Set())
    setBulkAction('')
    setShowBulkConfirm(false)
  }

  const atRiskCount = clients.filter(c => c.healthScore < 80 && c.healthScore > 0).length

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{clients.length} organizations · {clients.filter(c => c.status === 'active').length} active
            {atRiskCount > 0 && <span className="ml-2 text-amber-400">· {atRiskCount} at risk</span>}
          </p>
        </div>
        <button
          onClick={() => setShowOnboardModal(true)}
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
          { value: statusFilter, onChange: setStatusFilter, options: [['all','All Status'],['active','Active'],['trial','Trial'],['issues','Issues'],['suspended','Suspended']] },
          { value: planFilter, onChange: setPlanFilter, options: [['all','All Plans'],['Enterprise','Enterprise'],['Pro','Pro'],['Growth','Growth'],['Starter','Starter']] },
          { value: healthFilter, onChange: setHealthFilter, options: [['all','All Health'],['high','High (90+)'],['medium','Medium (70-89)'],['low','Low (<70)']] },
          { value: paymentFilter, onChange: setPaymentFilter, options: [['all','All Payment'],['paid','Paid'],['overdue','Overdue'],['failed','Failed'],['trial','Trial']] },
        ].map(({ value, onChange, options }, i) => (
          <select
            key={i}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none"
          >
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}

        {(statusFilter !== 'all' || planFilter !== 'all' || healthFilter !== 'all' || paymentFilter !== 'all') && (
          <button
            onClick={() => { setStatusFilter('all'); setPlanFilter('all'); setHealthFilter('all'); setPaymentFilter('all') }}
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
                onClick={() => { setBulkAction(a.label); setShowBulkConfirm(true) }}
                className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-colors ${
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
              {['Client', 'Plan', 'Status', 'Users', 'MRR', 'Tokens (mo.)', 'Payment', 'Health', 'Last Active', ''].map(h => (
                <th key={h} className="text-left text-[11px] font-medium text-white/30 px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const st = statusConfig[c.status]
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
                        <p className="text-[11px] text-white/30">{c.domain}</p>
                      </div>
                      {c.healthScore > 0 && c.healthScore < 80 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">AT RISK</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${planColor[c.plan]}`}>{c.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${st.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">{c.users}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-white/85">
                    {c.mrr > 0 ? `$${c.mrr.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">{c.tokensThisMonth}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-medium capitalize ${paymentConfig[c.paymentStatus]}`}>
                      {c.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.healthScore > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.healthScore >= 90 ? 'bg-emerald-400' : c.healthScore >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${c.healthScore}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/40">{c.healthScore}%</span>
                      </div>
                    ) : <span className="text-[11px] text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-white/30">{c.lastActive}</td>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOnboardModal(false)}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-white mb-1">Onboard New Client</h2>
            <p className="text-[12px] text-white/40 mb-5">Create a new organization and send invite to the admin.</p>
            <div className="space-y-3">
              {[
                { label: 'Company Name', placeholder: 'Acme Corp' },
                { label: 'Admin Email', placeholder: 'admin@acmecorp.com' },
                { label: 'Domain', placeholder: 'acmecorp.com' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[11px] font-medium text-white/50 block mb-1">{f.label}</label>
                  <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Plan</label>
                <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none">
                  <option>Starter</option>
                  <option>Growth</option>
                  <option>Pro</option>
                  <option>Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowOnboardModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Create & Send Invite</button>
            </div>
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
                {statusFilter !== 'all' && <p>Status: <span className="text-white/50">{statusFilter}</span></p>}
                {planFilter !== 'all' && <p>Plan: <span className="text-white/50">{planFilter}</span></p>}
                {healthFilter !== 'all' && <p>Health: <span className="text-white/50">{healthFilter}</span></p>}
                {paymentFilter !== 'all' && <p>Payment: <span className="text-white/50">{paymentFilter}</span></p>}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBulkConfirm(false)}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-[15px] font-semibold text-white mb-2">Confirm: {bulkAction}</h2>
            <p className="text-[12px] text-white/40 mb-5">This will apply to <span className="text-white/70 font-semibold">{selected.size} client{selected.size > 1 ? 's' : ''}</span>. Continue?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={executeBulkAction} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
