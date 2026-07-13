'use client'

import { useMemo, useState } from 'react'
import { Users, Building2, TrendingUp, TrendingDown, Globe } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

type PlatformStats = {
  total_clients: number
  total_users: number
  total_mrr_cents: number
  churn_rate: number
  active_clients: number
  trial_clients: number
}

type ClientRow = {
  id: string
  name: string
  created_at: string
  user_count: number
  plan_name: string
  status: string
  mrr_cents: number
  onboarding_complete: boolean
}

const INDUSTRY_COLORS = ['#8b5cf6', '#6366f1', '#a78bfa', '#7c3aed', '#4c1d95', '#2e1065', '#38bdf8', '#0ea5e9']

const PERIOD_MONTHS: Record<string, number> = { '3m': 3, '6m': 6, '1y': 12 }

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}

export default function AnalyticsClient({ stats, clients }: { stats: PlatformStats; clients: ClientRow[] }) {
  const [period, setPeriod] = useState('6m')

  const now = useMemo(() => new Date(), [])
  const nMonths = PERIOD_MONTHS[period] ?? 6

  const growthChartData = useMemo(() => {
    const months = Array.from({ length: nMonths }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (nMonths - 1 - i), 1))
    return months.map(d => {
      const key = monthKey(d)
      const newClients = clients.filter(c => monthKey(new Date(c.created_at)) === key).length
      const totalClients = clients.filter(c => new Date(c.created_at) <= endOfMonth(d)).length
      return { month: monthLabel(d), newClients, totalClients }
    })
  }, [clients, nMonths, now])

  const momGrowth = useMemo(() => {
    const thisKey = monthKey(now)
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastKey = monthKey(lastMonthDate)
    const thisCount = clients.filter(c => monthKey(new Date(c.created_at)) === thisKey).length
    const lastCount = clients.filter(c => monthKey(new Date(c.created_at)) === lastKey).length
    if (lastCount > 0) return { pct: ((thisCount - lastCount) / lastCount) * 100, thisCount, lastCount }
    return { pct: thisCount > 0 ? 100 : 0, thisCount, lastCount }
  }, [clients, now])

  const industryData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of clients) {
      const letter = (c.name?.trim()?.[0] || '?').toUpperCase()
      counts.set(letter, (counts.get(letter) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: INDUSTRY_COLORS[i % INDUSTRY_COLORS.length] }))
  }, [clients])

  const totalClients = clients.length
  const activeClients = clients.filter(c => c.status === 'active').length
  const retentionPct = totalClients > 0 ? (activeClients / totalClients) * 100 : 0
  const churnPct = stats.churn_rate

  const activatedCount = clients.filter(c => c.onboarding_complete).length
  const signedUpCount = stats.total_clients
  const activationFunnel = [
    { stage: 'Signed Up', count: signedUpCount },
    { stage: 'Activated', count: activatedCount },
    { stage: 'First Campaign', count: 0 },
    { stage: 'Connected Email', count: 0 },
    { stage: 'Ran GTM Pipeline', count: 0 },
    { stage: 'Converted to Paid', count: 0 },
  ].map(s => ({ ...s, pct: signedUpCount > 0 ? (s.count / signedUpCount) * 100 : 0 }))

  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Platform Analytics</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Growth, retention, and adoption metrics across all clients</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none">
          <option value="3m">Last 3 months</option>
          <option value="6m">Last 6 months</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: `${stats.total_clients}`, delta: `${momGrowth.thisCount} new this month`, up: true, icon: Building2 },
          { label: 'Active Users', value: `${stats.total_users}`, delta: `${activeClients} clients active`, up: true, icon: Users },
          { label: 'MoM Growth', value: `${momGrowth.pct.toFixed(1)}%`, delta: `vs ${momGrowth.lastCount} last mo.`, up: momGrowth.pct >= 0, icon: TrendingUp },
          { label: 'Churn Rate', value: `${churnPct.toFixed(1)}%`, delta: 'suspended / total', up: false, icon: TrendingDown },
        ].map(({ label, value, delta, up, icon: Icon }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Icon className="w-4 h-4 text-white/30" />
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>{up ? '↑' : '↓'} {delta}</span>
            </div>
            <p className="text-[22px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Growth chart */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Client Growth</p>
          <p className="text-[11px] text-white/30 mb-5">New clients per month and cumulative total</p>
          {clients.length === 0 ? (
            <p className="text-[12px] text-white/30 py-16 text-center">No client data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={growthChartData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="newClients" fill="#06b6d4" radius={[4, 4, 0, 0]} name="New Clients" />
                <Line yAxisId="right" type="monotone" dataKey="totalClients" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Total Clients" />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-6 mt-3">
            {[{ color: 'bg-cyan-500', label: 'New Clients' }, { color: 'bg-violet-500', label: 'Total Clients' }].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                <span className="text-[11px] text-white/40">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Industry breakdown */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Industry Mix</p>
          <p className="text-[11px] text-white/30 mb-4">Placeholder grouping by client name (no industry field yet)</p>
          {industryData.length === 0 ? (
            <p className="text-[12px] text-white/30 py-10 text-center">No client data yet</p>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <PieChart width={120} height={120}>
                  <Pie data={industryData} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                    {industryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {industryData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-[11px] text-white/50">{d.name}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Retention + Funnel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Retention */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Monthly Retention Rate</p>
          <p className="text-[11px] text-white/30 mb-5">Active clients as a share of all clients</p>
          <div className="flex items-center justify-center py-6">
            <p className="text-[40px] font-bold text-emerald-400">{retentionPct.toFixed(1)}%</p>
          </div>
          <div className="mt-3 flex items-center justify-between text-center">
            <div>
              <p className="text-[18px] font-bold text-emerald-400">{activeClients}</p>
              <p className="text-[10px] text-white/30">Active clients</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-white">{churnPct.toFixed(1)}%</p>
              <p className="text-[10px] text-white/30">Churn rate</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-white">{totalClients}</p>
              <p className="text-[10px] text-white/30">Total clients</p>
            </div>
          </div>
        </div>

        {/* Activation funnel */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Activation Funnel</p>
          <p className="text-[11px] text-white/30 mb-4">All-time signups through onboarding (remaining stages pending tracking)</p>
          <div className="space-y-2">
            {activationFunnel.map((stage, i) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/60">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/40">{stage.count}</span>
                    <span className="text-[11px] font-semibold text-white w-8 text-right">{stage.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${stage.pct}%`, background: `hsl(${260 - i * 12}, 70%, ${60 - i * 3}%)` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic breakdown */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <p className="text-[13px] font-semibold text-white mb-4">Geographic Distribution</p>
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <Globe className="w-6 h-6 text-white/15" />
          <p className="text-[12px] text-white/30">No geographic data collected yet</p>
        </div>
      </div>
    </div>
  )
}
