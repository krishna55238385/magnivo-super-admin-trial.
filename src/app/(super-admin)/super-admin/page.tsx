'use client'

import { useState } from 'react'
import {
  Building2, Users, DollarSign, Zap, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowRight, AlertCircle, CheckCircle2, Clock,
  CreditCard, Activity, BarChart2, Globe, Shield
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const mrrData = [
  { month: 'Jan', mrr: 12400, clients: 8 },
  { month: 'Feb', mrr: 15800, clients: 11 },
  { month: 'Mar', mrr: 18200, clients: 14 },
  { month: 'Apr', mrr: 22600, clients: 18 },
  { month: 'May', mrr: 26100, clients: 21 },
  { month: 'Jun', mrr: 31400, clients: 26 },
]

const tokenData = [
  { day: 'Mon', tokens: 2.4 },
  { day: 'Tue', tokens: 3.1 },
  { day: 'Wed', tokens: 2.8 },
  { day: 'Thu', tokens: 4.2 },
  { day: 'Fri', tokens: 3.9 },
  { day: 'Sat', tokens: 1.8 },
  { day: 'Sun', tokens: 1.3 },
]

const planBreakdown = [
  { name: 'Growth', value: 12, color: '#8b5cf6' },
  { name: 'Pro', value: 8, color: '#6366f1' },
  { name: 'Enterprise', value: 4, color: '#a78bfa' },
  { name: 'Starter', value: 2, color: '#4c1d95' },
]

const recentActivity = [
  { type: 'client_joined', label: 'TechCorp Inc. onboarded', time: '2 min ago', icon: Building2, color: 'text-emerald-400' },
  { type: 'payment', label: 'Invoice #INV-2847 paid ($2,400)', time: '18 min ago', icon: CreditCard, color: 'text-violet-400' },
  { type: 'alert', label: 'SalesGenius reported API error', time: '1 hr ago', icon: AlertCircle, color: 'text-amber-400' },
  { type: 'upgrade', label: 'Acme Co. upgraded to Enterprise', time: '2 hr ago', icon: TrendingUp, color: 'text-emerald-400' },
  { type: 'payment', label: 'Invoice #INV-2846 paid ($890)', time: '3 hr ago', icon: CreditCard, color: 'text-violet-400' },
  { type: 'client_joined', label: 'DataSync Pro onboarded', time: '5 hr ago', icon: Building2, color: 'text-emerald-400' },
]

const topClients = [
  { name: 'Acme Corp', plan: 'Enterprise', mrr: 4200, tokens: '48.2M', status: 'active', health: 98 },
  { name: 'TechVentures', plan: 'Pro', mrr: 1800, tokens: '21.4M', status: 'active', health: 95 },
  { name: 'DataSync Pro', plan: 'Growth', mrr: 1200, tokens: '14.8M', status: 'active', health: 92 },
  { name: 'SalesGenius', plan: 'Pro', mrr: 1800, tokens: '12.1M', status: 'issues', health: 78 },
  { name: 'GrowthLab', plan: 'Starter', mrr: 490, tokens: '6.3M', status: 'active', health: 88 },
]

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

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Platform Overview</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Monday, 30 June 2026 · Real-time</p>
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
        <StatCard label="Total Clients" value="26" sub="+3 this month" trend={13} icon={Building2} color="bg-violet-500/15 text-violet-400" />
        <StatCard label="Monthly Revenue" value="$31,400" sub="MRR · Jun 2026" trend={20} icon={DollarSign} color="bg-emerald-500/15 text-emerald-400" />
        <StatCard label="Active Users" value="384" sub="across all orgs" trend={8} icon={Users} color="bg-blue-500/15 text-blue-400" />
        <StatCard label="Tokens Used" value="142M" sub="this month · $284 cost" trend={24} icon={Zap} color="bg-amber-500/15 text-amber-400" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Revenue / Client" value="$1,208" sub="per month" trend={6} icon={TrendingUp} color="bg-pink-500/15 text-pink-400" />
        <StatCard label="Churn Rate" value="2.1%" sub="last 90 days" trend={-0.4} icon={TrendingDown} color="bg-red-500/15 text-red-400" />
        <StatCard label="Open Support Tickets" value="7" sub="3 urgent" trend={-18} icon={AlertCircle} color="bg-orange-500/15 text-orange-400" />
        <StatCard label="Uptime" value="99.97%" sub="last 30 days" trend={0.02} icon={Activity} color="bg-teal-500/15 text-teal-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* MRR Chart */}
        <div className="col-span-2 bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[13px] font-semibold text-white">Monthly Recurring Revenue</p>
              <p className="text-[11px] text-white/30 mt-0.5">Total platform MRR over time</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              +20% MoM
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                itemStyle={{ color: '#a78bfa' }}
                formatter={(v: any) => [`$${v.toLocaleString()}`, 'MRR']}
              />
              <Area type="monotone" dataKey="mrr" stroke="#8b5cf6" strokeWidth={2} fill="url(#mrrGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan breakdown */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Plan Breakdown</p>
          <p className="text-[11px] text-white/30 mb-5">26 active clients</p>
          <div className="flex justify-center mb-4">
            <PieChart width={140} height={140}>
              <Pie data={planBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {planBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2">
            {planBreakdown.map(p => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-[12px] text-white/60">{p.name}</span>
                </div>
                <span className="text-[12px] font-semibold text-white">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Token usage */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] font-semibold text-white">Token Usage This Week</p>
            <p className="text-[11px] text-white/30 mt-0.5">Millions of tokens consumed daily across all clients</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[11px] text-white/30">Total cost</p>
              <p className="text-[14px] font-semibold text-amber-400">$284.60</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={tokenData}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: any) => [`${v}M tokens`, 'Usage']}
            />
            <Bar dataKey="tokens" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
                  <p className="text-[10px] text-white/30">{c.plan} · {c.tokens} tokens</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-white">${c.mrr.toLocaleString()}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <div className={`w-12 h-1 rounded-full overflow-hidden bg-white/[0.06]`}>
                      <div className={`h-full rounded-full ${c.health >= 90 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${c.health}%` }} />
                    </div>
                    <span className={`text-[9px] ${c.health >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{c.health}%</span>
                  </div>
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
