'use client'

import { useState } from 'react'
import { Users, Building2, TrendingUp, TrendingDown, BarChart2, Globe, Zap, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const growthData = [
  { month: 'Jan', clients: 8, users: 94, mrr: 12400 },
  { month: 'Feb', clients: 11, users: 138, mrr: 15800 },
  { month: 'Mar', clients: 14, users: 182, mrr: 18200 },
  { month: 'Apr', clients: 18, users: 244, mrr: 22600 },
  { month: 'May', clients: 21, users: 312, mrr: 26100 },
  { month: 'Jun', clients: 26, users: 384, mrr: 31400 },
]

const industryData = [
  { name: 'SaaS', value: 8, color: '#8b5cf6' },
  { name: 'FinTech', value: 5, color: '#6366f1' },
  { name: 'Marketing', value: 4, color: '#a78bfa' },
  { name: 'Agency', value: 4, color: '#7c3aed' },
  { name: 'Data', value: 3, color: '#4c1d95' },
  { name: 'Other', value: 2, color: '#2e1065' },
]

const retentionData = [
  { month: 'Jan', retention: 94 },
  { month: 'Feb', retention: 95 },
  { month: 'Mar', retention: 93 },
  { month: 'Apr', retention: 96 },
  { month: 'May', retention: 97 },
  { month: 'Jun', retention: 97.9 },
]

const activationFunnel = [
  { stage: 'Signed Up', count: 48, pct: 100 },
  { stage: 'Activated', count: 38, pct: 79 },
  { stage: 'First Campaign', count: 31, pct: 65 },
  { stage: 'Connected Email', count: 28, pct: 58 },
  { stage: 'Ran GTM Pipeline', count: 22, pct: 46 },
  { stage: 'Converted to Paid', count: 26, pct: 54 },
]

const geoData = [
  { country: 'United States', clients: 12, revenue: 18400 },
  { country: 'United Kingdom', clients: 4, revenue: 6200 },
  { country: 'India', clients: 4, revenue: 3800 },
  { country: 'Germany', clients: 3, revenue: 1800 },
  { country: 'Canada', clients: 2, revenue: 1600 },
  { country: 'Australia', clients: 1, revenue: 600 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m')

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
          { label: 'Total Clients', value: '26', delta: '+5 this month', up: true, icon: Building2 },
          { label: 'Active Users', value: '384', delta: '+72 this month', up: true, icon: Users },
          { label: 'MoM Growth', value: '20.2%', delta: 'vs 18.1% last mo.', up: true, icon: TrendingUp },
          { label: 'Churn Rate', value: '2.1%', delta: '-0.4% vs last mo.', up: false, icon: TrendingDown },
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
          <p className="text-[13px] font-semibold text-white mb-1">Client & User Growth</p>
          <p className="text-[11px] text-white/30 mb-5">Total clients and active users over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="clients" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} name="Clients" />
              <Line yAxisId="right" type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 4 }} name="Users" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            {[{ color: 'bg-violet-500', label: 'Clients' }, { color: 'bg-cyan-500', label: 'Users' }].map(l => (
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
          <p className="text-[11px] text-white/30 mb-4">Client distribution by vertical</p>
          <div className="flex justify-center mb-3">
            <PieChart width={120} height={120}>
              <Pie data={industryData} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                {industryData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-1.5">
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
        </div>
      </div>

      {/* Retention + Funnel */}
      <div className="grid grid-cols-2 gap-4">
        {/* Retention */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Monthly Retention Rate</p>
          <p className="text-[11px] text-white/30 mb-5">% of clients retained month over month</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={retentionData}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Retention']} />
              <Area type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={2} fill="url(#retGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between text-center">
            <div>
              <p className="text-[18px] font-bold text-emerald-400">97.9%</p>
              <p className="text-[10px] text-white/30">Current</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-white">2.1%</p>
              <p className="text-[10px] text-white/30">Churn rate</p>
            </div>
            <div>
              <p className="text-[18px] font-bold text-white">47.6 mo</p>
              <p className="text-[10px] text-white/30">Avg LTV</p>
            </div>
          </div>
        </div>

        {/* Activation funnel */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Activation Funnel</p>
          <p className="text-[11px] text-white/30 mb-4">All-time signups to paid conversion</p>
          <div className="space-y-2">
            {activationFunnel.map((stage, i) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-white/60">{stage.stage}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/40">{stage.count}</span>
                    <span className="text-[11px] font-semibold text-white w-8 text-right">{stage.pct}%</span>
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
        <div className="grid grid-cols-3 gap-4">
          {geoData.map(g => (
            <div key={g.country} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-white/25" />
                <span className="text-[12px] text-white/70">{g.country}</span>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold text-white">{g.clients} clients</p>
                <p className="text-[10px] text-white/30">${g.revenue.toLocaleString()}/mo</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
