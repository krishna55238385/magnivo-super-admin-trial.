'use client'

import { useState } from 'react'
import {
  FileText, Search, Filter, Download, Building2, User, CreditCard,
  Shield, Settings, Zap, AlertCircle, CheckCircle2, Activity
} from 'lucide-react'

const auditLogs = [
  { id: 1, ts: 'Jun 30, 2026 14:32:18', actor: 'Krishna S.', actorRole: 'super_admin', action: 'client.suspended', target: 'Nexus Digital', targetType: 'client', ip: '103.21.44.12', details: 'Suspended due to failed payment × 3', severity: 'high' },
  { id: 2, ts: 'Jun 30, 2026 13:18:04', actor: 'System', actorRole: 'system', action: 'invoice.payment_failed', target: 'SalesGenius · INV-2845', targetType: 'billing', ip: '—', details: 'Stripe charge failed: card_declined', severity: 'medium' },
  { id: 3, ts: 'Jun 30, 2026 12:44:51', actor: 'Priya Menon', actorRole: 'admin', action: 'ticket.resolved', target: 'TKT-137', targetType: 'support', ip: '49.32.11.200', details: 'CSV export bug fixed and deployed', severity: 'low' },
  { id: 4, ts: 'Jun 30, 2026 11:02:33', actor: 'Krishna S.', actorRole: 'super_admin', action: 'client.plan_changed', target: 'Acme Corp → Enterprise', targetType: 'client', ip: '103.21.44.12', details: 'Upgraded from Pro to Enterprise, $4200/mo', severity: 'medium' },
  { id: 5, ts: 'Jun 30, 2026 10:15:09', actor: 'System', actorRole: 'system', action: 'client.onboarded', target: 'CloudScale', targetType: 'client', ip: '—', details: 'New client onboarded via invite, trial plan', severity: 'low' },
  { id: 6, ts: 'Jun 29, 2026 18:44:20', actor: 'Rohan Nair', actorRole: 'support', action: 'client.impersonated', target: 'TechVentures', targetType: 'client', ip: '192.168.1.45', details: 'Impersonation session for debugging OAuth', severity: 'high' },
  { id: 7, ts: 'Jun 29, 2026 16:30:01', actor: 'System', actorRole: 'system', action: 'invoice.paid', target: 'INV-2847 · Acme Corp', targetType: 'billing', ip: '—', details: 'Payment of $4,200 received via Stripe', severity: 'low' },
  { id: 8, ts: 'Jun 29, 2026 14:22:48', actor: 'Divya Pillai', actorRole: 'billing', action: 'invoice.issued', target: 'TechVentures · INV-2846', targetType: 'billing', ip: '49.32.11.205', details: 'Manual invoice issued for $1,800', severity: 'low' },
  { id: 9, ts: 'Jun 29, 2026 11:15:32', actor: 'Krishna S.', actorRole: 'super_admin', action: 'team.member_invited', target: 'Sneha Raj (viewer)', targetType: 'team', ip: '103.21.44.12', details: 'Invited Sneha Raj as Viewer', severity: 'low' },
  { id: 10, ts: 'Jun 28, 2026 09:08:44', actor: 'System', actorRole: 'system', action: 'token_limit.alert', target: 'DataSync Pro', targetType: 'usage', ip: '—', details: 'Client reached 80% of monthly token limit', severity: 'medium' },
  { id: 11, ts: 'Jun 27, 2026 17:22:11', actor: 'Rohan Nair', actorRole: 'support', action: 'client.feature_toggled', target: 'GrowthLab · dialer=false', targetType: 'client', ip: '192.168.1.45', details: 'Disabled dialer feature per client request', severity: 'medium' },
  { id: 12, ts: 'Jun 27, 2026 14:01:55', actor: 'System', actorRole: 'system', action: 'client.user_deleted', target: 'TechVentures · james@techventures.io', targetType: 'client', ip: '—', details: 'User self-deleted account', severity: 'medium' },
]

const actionConfig: Record<string, { icon: any; color: string }> = {
  'client.suspended': { icon: Shield, color: 'text-red-400' },
  'invoice.payment_failed': { icon: CreditCard, color: 'text-amber-400' },
  'ticket.resolved': { icon: CheckCircle2, color: 'text-emerald-400' },
  'client.plan_changed': { icon: Zap, color: 'text-violet-400' },
  'client.onboarded': { icon: Building2, color: 'text-blue-400' },
  'client.impersonated': { icon: User, color: 'text-red-400' },
  'invoice.paid': { icon: CreditCard, color: 'text-emerald-400' },
  'invoice.issued': { icon: FileText, color: 'text-white/50' },
  'team.member_invited': { icon: User, color: 'text-violet-400' },
  'token_limit.alert': { icon: AlertCircle, color: 'text-amber-400' },
  'client.feature_toggled': { icon: Settings, color: 'text-blue-400' },
  'client.user_deleted': { icon: User, color: 'text-amber-400' },
}

const severityConfig: Record<string, string> = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-white/30 bg-white/[0.03] border-white/[0.08]',
}

const targetTypeIcon: Record<string, any> = {
  client: Building2, billing: CreditCard, support: FileText, team: User, usage: Activity,
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [targetFilter, setTargetFilter] = useState('all')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = auditLogs.filter(l => {
    const matchSearch = !search || l.action.includes(search.toLowerCase()) || l.target.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase())
    const matchSeverity = severityFilter === 'all' || l.severity === severityFilter
    const matchTarget = targetFilter === 'all' || l.targetType === targetFilter
    return matchSearch && matchSeverity && matchTarget
  })

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Audit Logs</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Complete activity trail for all super admin actions and system events</p>
        </div>
        <button className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-4 py-2 rounded-lg hover:bg-white/[0.08] transition-colors">
          <Download className="w-4 h-4" /> Export Logs
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events (30d)', value: '1,284', color: 'text-white' },
          { label: 'High Severity', value: auditLogs.filter(l => l.severity === 'high').length, color: 'text-red-400' },
          { label: 'System Events', value: auditLogs.filter(l => l.actor === 'System').length, color: 'text-blue-400' },
          { label: 'Impersonations', value: auditLogs.filter(l => l.action === 'client.impersonated').length, color: 'text-amber-400' },
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
        <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)} className="bg-[#111118] border border-white/[0.08] text-white/60 text-[12px] rounded-lg px-3 py-2 outline-none">
          <option value="all">All Types</option>
          <option value="client">Client</option>
          <option value="billing">Billing</option>
          <option value="support">Support</option>
          <option value="team">Team</option>
          <option value="usage">Usage</option>
        </select>
        <div className="ml-auto text-[12px] text-white/30">{filtered.length} events</div>
      </div>

      {/* Log table */}
      <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="divide-y divide-white/[0.04]">
          {filtered.map(log => {
            const a = actionConfig[log.action] || { icon: Activity, color: 'text-white/40' }
            const Icon = a.icon
            const TargetIcon = targetTypeIcon[log.targetType] || FileText
            const isExpanded = expanded === log.id

            return (
              <div key={log.id}>
                <button
                  className="w-full flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                >
                  {/* Icon */}
                  <div className={`w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${a.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-[11px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{log.action}</code>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${severityConfig[log.severity]}`}>{log.severity}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[12px] text-white/60">
                            <span className="text-white/40">by </span>
                            <span className="font-medium">{log.actor}</span>
                            <span className="text-white/25 text-[10px] ml-1">({log.actorRole})</span>
                          </span>
                          <span className="text-white/20">·</span>
                          <div className="flex items-center gap-1">
                            <TargetIcon className="w-3 h-3 text-white/25" />
                            <span className="text-[11px] text-white/50">{log.target}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] text-white/30">{log.ts}</p>
                        <p className="text-[10px] text-white/20 mt-0.5">{log.ip}</p>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 ml-11">
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                      <p className="text-[11px] text-white/30 mb-1 uppercase tracking-wider">Details</p>
                      <p className="text-[12px] text-white/60">{log.details}</p>
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-[10px] text-white/25">IP: {log.ip}</span>
                        <span className="text-[10px] text-white/25">Timestamp: {log.ts}</span>
                        <span className="text-[10px] text-white/25">Target type: {log.targetType}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
