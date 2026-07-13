'use client'

import { useMemo, useState } from 'react'
import { FileText, Search, Download, Building2, User, CreditCard, Activity } from 'lucide-react'

type AuditLog = {
  id: string
  actor_id: string | null
  actor_name: string | null
  actor_role: string | null
  event_code: string
  severity: 'low' | 'medium' | 'high'
  entity_type: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

const severityConfig: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-white/30 bg-white/[0.03] border-white/[0.08]',
}

const entityTypeIcon: Record<string, any> = {
  client: Building2, billing: CreditCard, support: FileText, team: User,
}

function formatTs(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function toCsv(rows: AuditLog[]) {
  const headers = ['id', 'event_code', 'severity', 'actor_name', 'actor_role', 'entity_type', 'entity_name', 'ip_address', 'created_at']
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map(h => escape((r as any)[h])).join(','))
  }
  return lines.join('\n')
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchSearch =
        !search ||
        l.event_code?.toLowerCase().includes(search.toLowerCase()) ||
        (l.entity_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.actor_name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchSeverity = severityFilter === 'all' || l.severity === severityFilter
      const matchType = typeFilter === 'all' || l.entity_type === typeFilter
      return matchSearch && matchSeverity && matchType
    })
  }, [logs, search, severityFilter, typeFilter])

  const totalEvents = logs.length
  const highSeverity = logs.filter(l => l.severity === 'high').length
  const systemEvents = logs.filter(l => l.actor_id === null).length
  const impersonations = logs.filter(l => l.event_code?.toLowerCase().includes('impersonat')).length

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Audit Logs</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Complete activity trail for all super admin actions and system events</p>
        </div>
        <button
          onClick={() => downloadCsv(toCsv(filtered))}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-4 py-2 rounded-lg hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: totalEvents, color: 'text-white' },
          { label: 'High Severity', value: highSeverity, color: 'text-red-400' },
          { label: 'System Events', value: systemEvents, color: 'text-blue-400' },
          { label: 'Impersonations', value: impersonations, color: 'text-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4 text-center">
            <p className={`text-[22px] font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#111118] border border-white/[0.08] rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-[12px] text-white/70 placeholder:text-white/25 outline-none flex-1" placeholder="Search events…" />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none">
          <option value="all">All Severity</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none">
          <option value="all">All Types</option>
          <option value="client">Client</option>
          <option value="billing">Billing</option>
          <option value="support">Support</option>
          <option value="team">Team</option>
        </select>
        <div className="ml-auto text-[12px] text-white/30">{filtered.length} events</div>
      </div>

      {/* Log table */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[12px] text-white/30 text-center py-10">No audit events found</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(log => {
              const TargetIcon = (log.entity_type && entityTypeIcon[log.entity_type]) || Activity
              const isExpanded = expanded === log.id

              return (
                <div key={log.id}>
                  <button
                    className="w-full flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TargetIcon className="w-3.5 h-3.5 text-white/40" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-[11px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{log.event_code}</code>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${severityConfig[log.severity] ?? severityConfig.low}`}>{log.severity}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[12px] text-white/60">
                              <span className="text-white/40">by </span>
                              <span className="font-medium">{log.actor_name ?? 'System'}</span>
                              {log.actor_role && <span className="text-white/25 text-[10px] ml-1">({log.actor_role})</span>}
                            </span>
                            {log.entity_name && (
                              <>
                                <span className="text-white/20">·</span>
                                <span className="text-[11px] text-white/50">{log.entity_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-[11px] text-white/30">{formatTs(log.created_at)}</p>
                          <p className="text-[10px] text-white/20 mt-0.5">{log.ip_address ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 ml-11">
                      <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                        <p className="text-[11px] text-white/30 mb-1 uppercase tracking-wider">Details</p>
                        <pre className="text-[12px] text-white/60 whitespace-pre-wrap break-words">
                          {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details, null, 2) : 'No additional details'}
                        </pre>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.06]">
                          <span className="text-[10px] text-white/25">IP: {log.ip_address ?? '—'}</span>
                          <span className="text-[10px] text-white/25">Timestamp: {formatTs(log.created_at)}</span>
                          <span className="text-[10px] text-white/25">Entity type: {log.entity_type ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
