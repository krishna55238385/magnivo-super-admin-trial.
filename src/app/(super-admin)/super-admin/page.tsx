import {
  Building2, Users, DollarSign, Zap, TrendingUp, TrendingDown,
  ArrowRight, AlertCircle, CheckCircle2, Activity
} from 'lucide-react'
import {
  getPlatformStats,
  getMRRTrend,
  getTopClientsByRevenue,
  getRecentActivity,
  getPlanBreakdown,
} from '@/app/actions/super-admin'
import { MRRChart, PlanBreakdownChart, TokenUsageChart } from './SuperAdminCharts'

const PLAN_COLORS = ['#8b5cf6', '#6366f1', '#a78bfa', '#4c1d95', '#312e81']

const SEVERITY_ICON: Record<string, { icon: any; color: string }> = {
  high: { icon: AlertCircle, color: 'text-red-400' },
  medium: { icon: TrendingUp, color: 'text-amber-400' },
  low: { icon: CheckCircle2, color: 'text-emerald-400' },
}

function timeAgo(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function StatCard({ label, value, sub, trend, icon: Icon, color }: any) {
  const isUp = trend > 0
  return (
    <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
          isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[12px] text-white/40 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function SuperAdminDashboard() {
  const [stats, mrrTrend, topClientsRaw, recentActivityRaw, planBreakdownRaw] = await Promise.all([
    getPlatformStats('30d'),
    getMRRTrend(6),
    getTopClientsByRevenue(5),
    getRecentActivity(6),
    getPlanBreakdown(),
  ])

  const mrrData = mrrTrend.map((r: any) => ({
    month: new Date(r.month).toLocaleDateString('en-US', { month: 'short' }),
    mrr: r.mrr_cents / 100,
  }))
  const momPercent = mrrData.length >= 2 && mrrData[mrrData.length - 2].mrr > 0
    ? Math.round(((mrrData[mrrData.length - 1].mrr - mrrData[mrrData.length - 2].mrr) / mrrData[mrrData.length - 2].mrr) * 100)
    : null

  const planBreakdown = planBreakdownRaw.map((p: any, i: number) => ({
    name: p.plan_name,
    value: p.client_count,
    color: PLAN_COLORS[i % PLAN_COLORS.length],
  }))

  const topClients = topClientsRaw.map((c: any) => ({
    name: c.name,
    plan: c.plan_name || 'trial',
    mrr: c.mrr_cents / 100,
    userCount: c.user_count,
    status: c.status || 'trial',
  }))

  const recentActivity = recentActivityRaw.map((a: any) => {
    const { icon, color } = SEVERITY_ICON[a.severity as string] || SEVERITY_ICON.low
    return {
      label: a.target_label ? `${a.details || a.action} — ${a.target_label}` : (a.details || a.action),
      time: timeAgo(a.created_at),
      icon,
      color,
    }
  })

  const totalMrr = stats.total_mrr_cents / 100
  const avgRevenue = stats.avg_revenue_per_client / 100

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Platform Overview</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-1.5 outline-none">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clients" value={stats.total_clients} sub={`${stats.trial_clients} in trial`} trend={0} icon={Building2} color="bg-violet-500/15 text-violet-400" />
        <StatCard label="Monthly Revenue" value={`$${totalMrr.toLocaleString()}`} sub="MRR · last 30 days" trend={0} icon={DollarSign} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Active Users" value={stats.total_users} sub="across all orgs" trend={0} icon={Users} color="bg-blue-500/15 text-blue-400" />
        <StatCard label="Tokens Used" value={stats.total_token_usage.toLocaleString()} sub={`this month · $${stats.total_token_cost.toFixed(4)} cost`} trend={0} icon={Zap} color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Revenue / Client" value={`$${avgRevenue.toFixed(0)}`} sub="per month" trend={0} icon={TrendingUp} color="bg-pink-500/15 text-pink-400" />
        <StatCard label="Churn Rate" value={`${stats.churn_rate.toFixed(1)}%`} sub="last 90 days" trend={0} icon={TrendingDown} color="bg-red-500/15 text-red-400" />
        <StatCard label="Open Support Tickets" value={stats.open_support_tickets} sub="" trend={0} icon={AlertCircle} color="bg-orange-500/15 text-orange-400" />
        <StatCard label="Uptime" value="99.97%" sub="last 30 days" trend={0} icon={Activity} color="bg-teal-500/15 text-teal-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        <MRRChart data={mrrData} momPercent={momPercent} />
        <PlanBreakdownChart data={planBreakdown} totalClients={stats.active_clients} />
      </div>

      {/* Token usage */}
      <TokenUsageChart totalCost={`$${stats.total_estimated_cost.toFixed(2)}`} />

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top clients */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-white">Top Clients by Revenue</p>
            <a href="/super-admin/clients" className="text-[11px] text-violet-400 flex items-center gap-1 hover:text-violet-300">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/50">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-medium text-white/80 truncate">{c.name}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                      c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-white/30">{c.plan} · {c.userCount} users</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-white">${c.mrr.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-semibold text-white">Recent Activity</p>
            <a href="/super-admin/audit" className="text-[11px] text-violet-400 flex items-center gap-1 hover:text-violet-300">
              Audit log <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-white/70">{a.label}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
