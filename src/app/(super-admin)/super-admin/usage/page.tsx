'use client'

import { useState } from 'react'
import { Zap, DollarSign, TrendingUp, BarChart2, Filter, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const dailyUsage = [
  { date: 'Jun 24', tokens: 4.8, cost: 9.60, gpt4o: 2.1, gpt35: 1.8, gemini: 0.9 },
  { date: 'Jun 25', tokens: 5.2, cost: 10.40, gpt4o: 2.4, gpt35: 2.0, gemini: 0.8 },
  { date: 'Jun 26', tokens: 3.9, cost: 7.80, gpt4o: 1.8, gpt35: 1.5, gemini: 0.6 },
  { date: 'Jun 27', tokens: 6.1, cost: 12.20, gpt4o: 2.8, gpt35: 2.3, gemini: 1.0 },
  { date: 'Jun 28', tokens: 5.8, cost: 11.60, gpt4o: 2.6, gpt35: 2.2, gemini: 1.0 },
  { date: 'Jun 29', tokens: 2.4, cost: 4.80, gpt4o: 1.0, gpt35: 1.0, gemini: 0.4 },
  { date: 'Jun 30', tokens: 1.8, cost: 3.60, gpt4o: 0.8, gpt35: 0.7, gemini: 0.3 },
]

const modelBreakdown = [
  { name: 'GPT-4o', tokens: 38.2, cost: 76.40, color: '#8b5cf6', pct: 56 },
  { name: 'GPT-3.5-turbo', tokens: 21.4, cost: 10.70, color: '#6366f1', pct: 32 },
  { name: 'Gemini Pro', tokens: 8.1, cost: 8.10, color: '#a78bfa', pct: 12 },
]

const clientUsage = [
  { name: 'Acme Corp', tokens: '48.2M', cost: 96.40, model: 'GPT-4o', pct: 34 },
  { name: 'TechVentures', tokens: '21.4M', cost: 42.80, model: 'GPT-4o', pct: 15 },
  { name: 'DataSync Pro', tokens: '14.8M', cost: 29.60, model: 'GPT-3.5', pct: 10 },
  { name: 'SalesGenius', tokens: '12.1M', cost: 24.20, model: 'GPT-4o', pct: 9 },
  { name: 'CloudScale', tokens: '8.4M', cost: 16.80, model: 'Gemini', pct: 6 },
  { name: 'GrowthLab', tokens: '6.3M', cost: 12.60, model: 'GPT-3.5', pct: 4 },
  { name: 'Others', tokens: '31.0M', cost: 62.00, model: '—', pct: 22 },
]

const featureUsage = [
  { feature: 'GTM Pipeline (Find)', calls: 4820, tokens: '32.1M', avgTokens: 6659 },
  { feature: 'Email AI Draft', calls: 12440, tokens: '18.4M', avgTokens: 1479 },
  { feature: 'Lead Scoring', calls: 28100, tokens: '24.2M', avgTokens: 861 },
  { feature: 'Account Intelligence', calls: 1820, tokens: '21.8M', avgTokens: 11978 },
  { feature: 'Personalization', calls: 9240, tokens: '16.3M', avgTokens: 1764 },
  { feature: 'AI Search', calls: 3140, tokens: '12.4M', avgTokens: 3949 },
  { feature: 'Workflow AI', calls: 6820, tokens: '8.1M', avgTokens: 1188 },
  { feature: 'Signal Detection', calls: 18400, tokens: '8.9M', avgTokens: 484 },
]

export default function UsagePage() {
  const [period, setPeriod] = useState('30d')

  const totalTokens = '142.0M'
  const totalCost = 284.60
  const avgPerClient = (totalCost / 26).toFixed(2)

  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Token & LLM Usage</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Monitor AI consumption, costs, and model breakdown across all clients</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 text-[12px] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tokens Used', value: totalTokens, sub: 'This month', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Total LLM Cost', value: `$${totalCost.toFixed(2)}`, sub: 'Platform cost', icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Avg Cost / Client', value: `$${avgPerClient}`, sub: 'Per month', icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Most Used Model', value: 'GPT-4o', sub: '56% of all calls', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
            <p className="text-[11px] text-white/25">{sub}</p>
          </div>
        ))}
      </div>

      {/* Daily usage chart */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <p className="text-[13px] font-semibold text-white mb-1">Daily Token Consumption by Model</p>
        <p className="text-[11px] text-white/30 mb-5">Millions of tokens · last 7 days</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyUsage}>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}M`]} />
            <Bar dataKey="gpt4o" stackId="a" fill="#8b5cf6" name="GPT-4o" />
            <Bar dataKey="gpt35" stackId="a" fill="#6366f1" name="GPT-3.5" />
            <Bar dataKey="gemini" stackId="a" fill="#a78bfa" name="Gemini" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-3">
          {modelBreakdown.map(m => (
            <div key={m.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: m.color }} />
              <span className="text-[11px] text-white/40">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model breakdown + Client usage side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Model breakdown */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-4">Model Breakdown</p>
          <div className="space-y-3">
            {modelBreakdown.map(m => (
              <div key={m.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                    <span className="text-[12px] text-white/70">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-white/40">{m.tokens}M tokens</span>
                    <span className="text-[12px] font-semibold text-white">${m.cost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
                <p className="text-[10px] text-white/25 text-right">{m.pct}% of usage</p>
              </div>
            ))}
          </div>
        </div>

        {/* Client usage */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-4">Usage by Client</p>
          <div className="space-y-2">
            {clientUsage.map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="w-24 text-[11px] text-white/60 truncate">{c.name}</div>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${c.pct}%` }} />
                </div>
                <div className="w-20 text-right">
                  <span className="text-[11px] text-white/50">{c.tokens}</span>
                </div>
                <div className="w-16 text-right">
                  <span className="text-[11px] font-semibold text-white">${c.cost.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature usage table */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[13px] font-semibold text-white">Usage by Feature</p>
          <p className="text-[11px] text-white/30 mt-0.5">Which parts of Magnivo AI consume the most tokens</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Feature', 'API Calls', 'Total Tokens', 'Avg Tokens/Call', 'Share'].map(h => (
                <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureUsage.map(f => (
              <tr key={f.feature} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[12px] font-medium text-white/80">{f.feature}</td>
                <td className="px-5 py-3 text-[12px] text-white/50">{f.calls.toLocaleString()}</td>
                <td className="px-5 py-3 text-[12px] text-white/70">{f.tokens}</td>
                <td className="px-5 py-3 text-[12px] text-white/50">{f.avgTokens.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(parseFloat(f.tokens) / 142) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-white/40">{((parseFloat(f.tokens) / 142) * 100).toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
