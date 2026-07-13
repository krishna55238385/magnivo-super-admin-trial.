'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type ServiceHealth = {
  name: string
  host: string
  latency_ms: number
  status: 'operational' | 'degraded' | 'down'
  uptime: string
}

const latencyHistory = [
  { time: '00:00', crm: 138, gtm: 210, db: 22 },
  { time: '02:00', crm: 142, gtm: 198, db: 20 },
  { time: '04:00', crm: 136, gtm: 215, db: 21 },
  { time: '06:00', crm: 155, gtm: 228, db: 24 },
  { time: '08:00', crm: 248, gtm: 310, db: 38 },
  { time: '10:00', crm: 185, gtm: 260, db: 28 },
  { time: '12:00', crm: 172, gtm: 244, db: 26 },
  { time: '14:00', crm: 142, gtm: 218, db: 24 },
]

const incidents = [
  { id: 'INC-24', title: 'Email Worker latency spike', status: 'investigating', started: '3 hr ago', severity: 'minor', service: 'Email Worker' },
  { id: 'INC-23', title: 'OpenAI rate limit hit — GTM pipeline queued', status: 'resolved', started: '2 days ago', severity: 'minor', service: 'GTM Pipeline' },
  { id: 'INC-22', title: 'Supabase maintenance window', status: 'resolved', started: '5 days ago', severity: 'maintenance', service: 'Database' },
]

const errorRates = [
  { endpoint: 'POST /api/gtm/run-phase-1', rate: 0.8, calls: 4820, errors: 38 },
  { endpoint: 'POST /api/engage/send', rate: 0.3, calls: 12440, errors: 37 },
  { endpoint: 'GET /api/engage/gmail/mailbox', rate: 2.1, calls: 8820, errors: 185 },
  { endpoint: 'POST /api/auth/sign-in', rate: 0.1, calls: 18200, errors: 18 },
  { endpoint: 'POST /api/engage/worker', rate: 4.2, calls: 2840, errors: 119 },
]

const statusConfig: Record<string, { label: string; color: string; icon: any; dot: string }> = {
  operational: { label: 'Operational', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, dot: 'bg-emerald-400' },
  degraded: { label: 'Degraded', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle, dot: 'bg-amber-400 animate-pulse' },
  down: { label: 'Down', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle, dot: 'bg-red-400 animate-pulse' },
}

export default function SystemClient({ services }: { services: ServiceHealth[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const allOperational = services.every(s => s.status === 'operational')
  const unhealthy = services.filter(s => s.status !== 'operational')

  function handleRefresh() {
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">System Health</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Monitor all services, latency, and error rates in real-time</p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-4 py-2 rounded-lg hover:bg-white/[0.08] transition-colors">
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Overall status banner */}
      {services.length === 0 ? (
        <div className="rounded-xl p-4 border border-white/[0.08] bg-white/[0.03] text-[13px] text-white/40">
          Unable to load service health data.
        </div>
      ) : (
        <div className={`rounded-xl p-4 border flex items-center gap-3 ${
          allOperational
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          {allOperational
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <AlertCircle className="w-5 h-5 text-amber-400" />
          }
          <div>
            <p className={`text-[13px] font-semibold ${allOperational ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allOperational ? 'All Systems Operational' : `${unhealthy.length} Service(s) Degraded or Down`}
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">
              {allOperational ? 'No incidents or degradations detected.' : unhealthy.map(s => s.name).join(', ') + ' is experiencing issues.'}
            </p>
          </div>
          <div className="ml-auto text-[11px] text-white/30">Last checked: {new Date().toLocaleTimeString()}</div>
        </div>
      )}

      {/* Services grid */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-[13px] font-semibold text-white">Service Status</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {services.map(s => {
            const sc = statusConfig[s.status] ?? statusConfig.down
            const Icon = sc.icon
            return (
              <div key={s.name} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/80">{s.name}</p>
                  <p className="text-[11px] text-white/30">{s.host}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-white">{s.latency_ms} ms</p>
                    <p className="text-[10px] text-white/30">Latency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-white/40">{s.uptime}</p>
                    <p className="text-[10px] text-white/30">Uptime (placeholder)</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${sc.color}`}>
                    <Icon className="w-3 h-3" />
                    {sc.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Latency chart */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
        <p className="text-[13px] font-semibold text-white mb-1">Latency History (Last 24h)</p>
        <p className="text-[11px] text-white/30 mb-5">Simulated data — no historical latency store yet</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={latencyHistory}>
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}ms`} />
            <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}ms`]} />
            <Line type="monotone" dataKey="crm" stroke="#8b5cf6" strokeWidth={2} dot={false} name="CRM" />
            <Line type="monotone" dataKey="gtm" stroke="#f59e0b" strokeWidth={2} dot={false} name="GTM" />
            <Line type="monotone" dataKey="db" stroke="#10b981" strokeWidth={2} dot={false} name="DB" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3">
          {[{ color: 'bg-violet-500', label: 'CRM' }, { color: 'bg-amber-500', label: 'GTM Pipeline' }, { color: 'bg-emerald-500', label: 'Database' }].map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${l.color}`} />
              <span className="text-[11px] text-white/40">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error rates + Incidents */}
      <div className="grid grid-cols-2 gap-4">
        {/* Error rates */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">API Error Rates (30d)</p>
          <p className="text-[11px] text-white/30 mb-4">Simulated data — no error-rate telemetry store yet</p>
          <div className="space-y-3">
            {errorRates.map(e => (
              <div key={e.endpoint} className="space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-[10px] text-violet-400 truncate max-w-[200px]">{e.endpoint}</code>
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    <span className="text-[10px] text-white/30">{e.errors} errors</span>
                    <span className={`text-[11px] font-semibold ${e.rate >= 2 ? 'text-red-400' : e.rate >= 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>{e.rate}%</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${e.rate >= 2 ? 'bg-red-400' : e.rate >= 0.5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${Math.min(e.rate * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">Recent Incidents</p>
          <p className="text-[11px] text-white/30 mb-4">Simulated data — no incident tracking store yet</p>
          <div className="space-y-3">
            {incidents.map(inc => (
              <div key={inc.id} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                  inc.status === 'investigating' ? 'bg-amber-400 animate-pulse' : 'bg-white/20'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[12px] font-medium text-white/80">{inc.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${inc.status === 'resolved' ? 'bg-white/[0.05] text-white/30' : 'bg-amber-500/10 text-amber-400'}`}>
                      {inc.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/30">
                    <span>{inc.id}</span>
                    <span>·</span>
                    <span>{inc.service}</span>
                    <span>·</span>
                    <span>{inc.started}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/30 hover:text-white/50 transition-colors">
            View Full Incident History
          </button>
        </div>
      </div>
    </div>
  )
}
