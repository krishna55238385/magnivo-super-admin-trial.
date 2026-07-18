'use client'

import { useState, useTransition } from 'react'
import { Zap, DollarSign, TrendingUp, BarChart2, Download, Search, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getPlatformTokenUsage } from '@/app/actions/super-admin'

type ModelRow = { model: string; total_tokens: number | string; estimated_cost_usd: number | string; call_count: number }
type ClientRow = { organization_id: string; organization_name?: string | null; total_tokens: number | string; estimated_cost_usd: number | string }
type FeatureRow = { feature: string; total_tokens: number | string; estimated_cost_usd: number | string }
type DailyRow = { date: string; total_tokens: number | string; estimated_cost_usd: number | string }

type UsageData = {
  by_model: ModelRow[]
  by_client: ClientRow[]
  by_feature: FeatureRow[]
  daily: DailyRow[]
  totals: { total_tokens: number | string; total_cost: number | string }
}

type SerpApiUsage =
  | {
      ok: true
      plan_name: string | null
      plan_renewal_date: string | null
      searches_per_month: number
      this_month_usage: number
      plan_searches_left: number
      total_searches_left: number
    }
  | { ok: false; error: string }

const MODEL_COLORS = ['#8b5cf6', '#6366f1', '#a78bfa', '#f59e0b', '#ec4899', '#22c55e', '#38bdf8']

function num(v: number | string | null | undefined) {
  return Number(v) || 0
}

function formatTokens(v: number | string) {
  const n = num(v)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

function formatCost(v: number | string) {
  const n = num(v)
  if (n > 0 && n < 0.01) return `$${n.toFixed(6)}`
  return `$${n.toFixed(2)}`
}

function formatDate(d: string) {
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function UsageClient({
  initialData,
  initialDays,
  serpUsage,
}: {
  initialData: UsageData
  initialDays: number
  serpUsage: SerpApiUsage
}) {
  const [days, setDays] = useState(initialDays)
  const [data, setData] = useState<UsageData>(initialData)
  const [isPending, startTransition] = useTransition()

  function onPeriodChange(newDays: number) {
    setDays(newDays)
    startTransition(async () => {
      const result = await getPlatformTokenUsage(newDays)
      setData(result as UsageData)
    })
  }

  const totalTokens = num(data.totals?.total_tokens)
  const totalCost = num(data.totals?.total_cost)
  const clientCount = data.by_client.length
  const avgPerClient = clientCount > 0 ? totalCost / clientCount : 0
  const topModel = data.by_model[0]
  const topModelPct = topModel && totalTokens > 0 ? (num(topModel.total_tokens) / totalTokens) * 100 : 0

  const modelsWithColor = data.by_model.map((m, i) => ({
    ...m,
    color: MODEL_COLORS[i % MODEL_COLORS.length],
    pct: totalTokens > 0 ? (num(m.total_tokens) / totalTokens) * 100 : 0,
  }))

  const maxClientTokens = Math.max(1, ...data.by_client.map(c => num(c.total_tokens)))
  const maxFeatureTokens = Math.max(1, ...data.by_feature.map(f => num(f.total_tokens)))

  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Token & LLM Usage</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Monitor AI consumption, costs, and model breakdown across all clients</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => onPeriodChange(Number(e.target.value))}
            className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/50 text-[12px] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tokens Used', value: formatTokens(totalTokens), sub: `Last ${days} days`, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Total LLM Cost', value: formatCost(totalCost), sub: 'Platform cost', icon: DollarSign, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Avg Cost / Client', value: formatCost(avgPerClient), sub: `Across ${clientCount} client${clientCount === 1 ? '' : 's'}`, icon: BarChart2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Most Used Model', value: topModel?.model ?? '—', sub: topModel ? `${topModelPct.toFixed(0)}% of all tokens` : 'No data', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
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

      {/* SerpApi usage */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Search className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">SerpApi Usage</p>
            <p className="text-[11px] text-white/30">
              {serpUsage.ok ? `${serpUsage.plan_name ?? 'Unknown plan'} · resets ${serpUsage.plan_renewal_date ?? '—'}` : 'Live search API usage'}
            </p>
          </div>
        </div>

        {!serpUsage.ok ? (
          <div className="flex items-center gap-2 py-4 text-[12px] text-amber-400/80">
            <AlertTriangle className="w-4 h-4" />
            <span>Unable to fetch SerpApi usage</span>
          </div>
        ) : (
          (() => {
            const used = serpUsage.this_month_usage
            const total = serpUsage.searches_per_month
            const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
            const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
            const textColor = pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-white'
            return (
              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <p className={`text-[20px] font-bold ${textColor}`}>
                    {used} <span className="text-[13px] font-normal text-white/40">/ {total} searches</span>
                  </p>
                  <p className="text-[11px] text-white/40">{serpUsage.total_searches_left} remaining</p>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()
        )}
      </div>

      {/* Daily usage chart */}
      <div className={`bg-[#111118] border border-white/[0.07] rounded-xl p-5 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
        <p className="text-[13px] font-semibold text-white mb-1">Daily Token Consumption</p>
        <p className="text-[11px] text-white/30 mb-5">Total tokens per day · last {days} days</p>
        {data.daily.length === 0 ? (
          <p className="text-[12px] text-white/30 py-10 text-center">No usage data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.daily.map(d => ({ date: formatDate(d.date), tokens: num(d.total_tokens), cost: num(d.estimated_cost_usd) }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => formatTokens(v)} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, name?: string) => (name === 'tokens' ? [formatTokens(v), 'Tokens'] : [formatCost(v), 'Cost'])}
              />
              <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="tokens" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Model breakdown + Client usage side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Model breakdown */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-4">Model Breakdown</p>
          {modelsWithColor.length === 0 ? (
            <p className="text-[12px] text-white/30 py-6 text-center">No model usage data</p>
          ) : (
            <div className="space-y-3">
              {modelsWithColor.map(m => (
                <div key={m.model} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      <span className="text-[12px] text-white/70">{m.model}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] text-white/40">{formatTokens(m.total_tokens)} tokens</span>
                      <span className="text-[12px] font-semibold text-white">{formatCost(m.estimated_cost_usd)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                  <p className="text-[10px] text-white/25 text-right">{m.pct.toFixed(0)}% of usage · {m.call_count.toLocaleString()} calls</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client usage */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-4">Usage by Client</p>
          {data.by_client.length === 0 ? (
            <p className="text-[12px] text-white/30 py-6 text-center">No client usage data</p>
          ) : (
            <div className="space-y-2">
              {data.by_client.map(c => (
                <div key={c.organization_id} className="flex items-center gap-3">
                  <div className="w-24 text-[11px] text-white/60 truncate">{c.organization_name || 'Unknown'}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${(num(c.total_tokens) / maxClientTokens) * 100}%` }} />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-[11px] text-white/50">{formatTokens(c.total_tokens)}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-[11px] font-semibold text-white">{formatCost(c.estimated_cost_usd)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature usage table */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[13px] font-semibold text-white">Usage by Feature</p>
          <p className="text-[11px] text-white/30 mt-0.5">Which parts of the platform consume the most tokens</p>
        </div>
        {data.by_feature.length === 0 ? (
          <p className="text-[12px] text-white/30 py-10 text-center">No feature usage data</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Feature', 'Total Tokens', 'Cost', 'Share'].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_feature.map(f => {
                const pct = (num(f.total_tokens) / maxFeatureTokens) * 100
                return (
                  <tr key={f.feature} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-[12px] font-medium text-white/80">{f.feature}</td>
                    <td className="px-5 py-3 text-[12px] text-white/70">{formatTokens(f.total_tokens)}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{formatCost(f.estimated_cost_usd)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-white/40">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
