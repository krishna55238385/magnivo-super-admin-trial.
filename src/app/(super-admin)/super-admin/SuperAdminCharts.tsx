'use client'

import { TrendingUp } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

// No function was requested for daily token usage (would be getPlatformTokenUsage) — kept as placeholder data
const tokenData = [
  { day: 'Mon', tokens: 2.4 },
  { day: 'Tue', tokens: 3.1 },
  { day: 'Wed', tokens: 2.8 },
  { day: 'Thu', tokens: 4.2 },
  { day: 'Fri', tokens: 3.9 },
  { day: 'Sat', tokens: 1.8 },
  { day: 'Sun', tokens: 1.3 },
]

export function MRRChart({ data, momPercent }: { data: { month: string; mrr: number }[]; momPercent: number | null }) {
  return (
    <div className="col-span-2 bg-[#111118] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] font-semibold text-white">Monthly Recurring Revenue</p>
          <p className="text-[11px] text-white/30 mt-0.5">Total platform MRR over time</p>
        </div>
        {momPercent !== null && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            {momPercent >= 0 ? '+' : ''}{momPercent}% MoM
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
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
  )
}

export function PlanBreakdownChart({ data, totalClients }: { data: { name: string; value: number; color: string }[]; totalClients: number }) {
  return (
    <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
      <p className="text-[13px] font-semibold text-white mb-1">Plan Breakdown</p>
      <p className="text-[11px] text-white/30 mb-5">{totalClients} active clients</p>
      <div className="flex justify-center mb-4">
        <PieChart width={140} height={140}>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </div>
      <div className="space-y-2">
        {data.map(p => (
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
  )
}

export function TokenUsageChart({ totalCost }: { totalCost: string }) {
  return (
    <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[13px] font-semibold text-white">Token Usage This Week</p>
          <p className="text-[11px] text-white/30 mt-0.5">Millions of tokens consumed daily across all clients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-white/30">Total cost</p>
            <p className="text-[14px] font-semibold text-amber-400">{totalCost}</p>
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
  )
}
