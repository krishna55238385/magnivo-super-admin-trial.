'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign, TrendingUp, CreditCard, AlertCircle, Plus,
  FileText, Download, CheckCircle2, XCircle, Clock, Ban,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import IssueInvoiceModal from '@/components/super-admin/IssueInvoiceModal'

type Invoice = {
  id: string
  invoice_number: string
  amount_cents: number
  status: string
  issued_at: string
  paid_at: string | null
  due_date: string | null
  organization_name: string | null
  organizations?: { name: string | null }
}

type RevenueStats = {
  total_mrr_cents: number
  total_arr_cents: number
  trial_count: number
  active_count: number
  overdue_invoices: number
  total_outstanding_cents: number
}

type MRRRow = {
  org_name: string
  plan_name: string
  mrr_cents: number
  status: string
  payment_status?: string
  renewal_date: string | null
}

type Plan = {
  id: string
  name: string
  monthly_price_cents: number
  token_limit: number | null
  features: string[] | Record<string, unknown> | string | unknown[] | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  paid: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  overdue: { label: 'Overdue', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  void: { label: 'Void', color: 'bg-white/[0.06] text-white/40 border-white/[0.1]', icon: Ban },
}
const defaultStatus = { label: 'Unknown', color: 'bg-white/[0.06] text-white/40 border-white/[0.1]', icon: Clock }

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizeFeatures(features: Plan['features']): string[] {
  if (!features) return []

  let parsed: unknown = features
  if (typeof features === 'string') {
    try {
      parsed = JSON.parse(features)
    } catch {
      return [features]
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map(f => {
      if (typeof f === 'string') return f
      if (f && typeof f === 'object') {
        const values = Object.values(f)
        if (values.length === 1 && typeof values[0] === 'string') return values[0]
        return JSON.stringify(f)
      }
      return String(f)
    })
  }

  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k.replace(/_/g, ' '))
  }

  return [String(parsed)]
}

type ClientOption = { id: string; name: string; plan_name?: string | null }

export default function BillingClient({
  invoices,
  revenueStats,
  mrrBreakdown,
  plans,
  clients,
}: {
  invoices: Invoice[]
  revenueStats: RevenueStats
  mrrBreakdown: MRRRow[]
  plans: Plan[]
  clients: ClientOption[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'invoices' | 'plans' | 'revenue'>('invoices')
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  function handleInvoiceSuccess(message: string) {
    setShowIssueModal(false)
    router.refresh()
    setToast({ type: 'success', text: message })
  }

  const totalMRR = revenueStats.total_mrr_cents
  const totalARR = revenueStats.total_arr_cents
  const overdueAmount = revenueStats.total_outstanding_cents
  const overdueCount = revenueStats.overdue_invoices
  const avgRevenuePerClient = revenueStats.active_count > 0 ? totalMRR / revenueStats.active_count : 0

  const planClientCounts = mrrBreakdown.reduce<Record<string, { count: number; mrr: number }>>((acc, row) => {
    const key = row.plan_name || 'Unknown'
    if (!acc[key]) acc[key] = { count: 0, mrr: 0 }
    acc[key].count += 1
    acc[key].mrr += row.mrr_cents || 0
    return acc
  }, {})

  const mrrByPlan = Object.entries(planClientCounts).map(([plan, v]) => ({ plan, mrr: v.mrr / 100 }))

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Billing & Revenue</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Manage invoices, plans, and revenue tracking</p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Issue Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Monthly Recurring Revenue', value: fmtMoney(totalMRR), sub: `${revenueStats.active_count} active clients`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Annual Recurring Revenue', value: fmtMoney(totalARR), sub: 'Projected', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Overdue / Outstanding', value: fmtMoney(overdueAmount), sub: `${overdueCount} overdue invoices`, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Revenue / Client', value: fmtMoney(avgRevenuePerClient), sub: 'per month', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
            <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit">
        {(['invoices', 'plans', 'revenue'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all capitalize ${
              activeTab === t ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'revenue' ? 'MRR Trend' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'invoices' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">{invoices.length} Invoices</p>
            <button className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Invoice', 'Client', 'Amount', 'Issued', 'Due', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[12px] text-white/30">No invoices yet</td>
                </tr>
              )}
              {invoices.map(inv => {
                const s = statusConfig[inv.status] || defaultStatus
                const Icon = s.icon
                const clientName = inv.organizations?.name || inv.organization_name || '—'
                return (
                  <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-[12px] font-medium text-white/70">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-white/70">{clientName}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-white">{fmtMoney(inv.amount_cents)}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{fmtDate(inv.issued_at)}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{fmtDate(inv.due_date)}</td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                        <Icon className="w-3 h-3" />
                        {s.label}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06]">View</button>
                        <button className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06]">Download</button>
                        {inv.status !== 'paid' && (
                          <button
                            disabled
                            title="Not implemented yet"
                            className="text-[11px] text-violet-400/40 cursor-not-allowed px-2 py-1 rounded border border-violet-500/10"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-4 gap-4">
          {plans.length === 0 && (
            <div className="col-span-4 bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center text-[12px] text-white/30">
              No plans configured yet
            </div>
          )}
          {plans.map(p => {
            const clientInfo = planClientCounts[p.name] || { count: 0, mrr: 0 }
            const features = normalizeFeatures(p.features)
            return (
              <div key={p.id} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-white">{p.name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{clientInfo.count} clients</p>
                  </div>
                  <p className="text-[18px] font-bold text-violet-400">{fmtMoney(p.monthly_price_cents)}<span className="text-[11px] text-white/30 font-normal">/mo</span></p>
                </div>
                <div className="flex-1 space-y-2 mb-4">
                  {p.token_limit != null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-[12px] text-white/50">{(p.token_limit / 1_000_000).toFixed(0)}M tokens/mo</span>
                    </div>
                  )}
                  {features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-[12px] text-white/50 capitalize">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/[0.06]">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/30">Revenue</span>
                    <span className="font-semibold text-white">{fmtMoney(clientInfo.mrr)}/mo</span>
                  </div>
                  <button className="w-full py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 hover:text-white/70 hover:bg-white/[0.07] transition-colors mt-2">
                    Edit Plan
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <p className="text-[13px] font-semibold text-white mb-1">MRR by Plan</p>
            <p className="text-[11px] text-white/30 mb-5">Current recurring revenue split across active plans</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mrrByPlan}>
                <XAxis dataKey="plan" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'MRR']}
                />
                <Bar dataKey="mrr" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[13px] font-semibold text-white">{mrrBreakdown.length} Active Subscriptions</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Client', 'Plan', 'MRR', 'Status', 'Renewal'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mrrBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-white/30">No active subscriptions</td>
                  </tr>
                )}
                {mrrBreakdown.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[12px] text-white/70">{row.org_name}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50 capitalize">{row.plan_name}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-white">{fmtMoney(row.mrr_cents)}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40 capitalize">{row.status}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{fmtDate(row.renewal_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showIssueModal && (
        <IssueInvoiceModal
          onClose={() => setShowIssueModal(false)}
          onSuccess={handleInvoiceSuccess}
          clients={clients}
          plans={plans}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-[13px] font-medium shadow-xl ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  )
}
