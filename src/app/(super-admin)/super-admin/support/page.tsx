'use client'

import { useState } from 'react'
import {
  LifeBuoy, Plus, Search, AlertCircle, CheckCircle2, Clock,
  MessageSquare, Building2, User, Filter, ChevronRight, Tag
} from 'lucide-react'

const tickets = [
  {
    id: 'TKT-142', client: 'SalesGenius', clientId: 'c3', subject: 'GTM Pipeline API returning 500 on /run/find',
    priority: 'urgent', status: 'open', category: 'Bug', assignee: 'Dev Team',
    created: '2 hr ago', lastReply: '1 hr ago', messages: 4,
    description: 'The GTM pipeline FIND endpoint returns HTTP 500 intermittently. Happens 30% of the time under load.',
  },
  {
    id: 'TKT-141', client: 'SalesGenius', clientId: 'c3', subject: 'Payment failed — card declined',
    priority: 'high', status: 'open', category: 'Billing', assignee: 'Billing Team',
    created: '1 day ago', lastReply: '4 hr ago', messages: 2,
    description: 'June invoice payment failed. Card on file was declined. Client needs to update payment method.',
  },
  {
    id: 'TKT-140', client: 'TechVentures', clientId: 'c2', subject: 'Gmail OAuth reconnect after token expiry',
    priority: 'medium', status: 'open', category: 'Integration', assignee: 'Support',
    created: '2 days ago', lastReply: '22 hr ago', messages: 6,
    description: 'Gmail OAuth tokens expired and reconnection flow fails at callback step.',
  },
  {
    id: 'TKT-139', client: 'Nexus Digital', clientId: 'c6', subject: 'Account suspended — appeal request',
    priority: 'medium', status: 'open', category: 'Account', assignee: 'Success Team',
    created: '14 days ago', lastReply: '5 days ago', messages: 3,
    description: 'Account was suspended due to non-payment. Client is appealing and requesting a payment plan.',
  },
  {
    id: 'TKT-138', client: 'CloudScale', clientId: 'c7', subject: 'Onboarding — need help with ICP setup',
    priority: 'low', status: 'open', category: 'Onboarding', assignee: 'Success Team',
    created: '3 days ago', lastReply: '1 day ago', messages: 8,
    description: 'New trial client needs guided setup for their ICP profiles and first GTM run.',
  },
  {
    id: 'TKT-137', client: 'DataSync Pro', clientId: 'c4', subject: 'Export CSV not working for leads list',
    priority: 'low', status: 'resolved', category: 'Bug', assignee: 'Dev Team',
    created: '5 days ago', lastReply: '3 days ago', messages: 5,
    description: 'CSV export on leads list was timing out. Fixed by adding async job queue.',
  },
  {
    id: 'TKT-136', client: 'Acme Corp', clientId: 'c1', subject: 'Add custom field to leads — feature request',
    priority: 'low', status: 'resolved', category: 'Feature Request', assignee: 'Product',
    created: '10 days ago', lastReply: '7 days ago', messages: 3,
    description: 'Client wants additional custom fields on leads. Scheduled for Q3 release.',
  },
]

const priorityConfig: Record<string, { color: string; dot: string }> = {
  urgent: { color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  high: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  medium: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-400' },
  low: { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]', dot: 'bg-white/30' },
}

const statusConfig: Record<string, string> = {
  open: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const categoryColor: Record<string, string> = {
  Bug: 'bg-red-500/10 text-red-400',
  Billing: 'bg-amber-500/10 text-amber-400',
  Integration: 'bg-blue-500/10 text-blue-400',
  Account: 'bg-orange-500/10 text-orange-400',
  Onboarding: 'bg-emerald-500/10 text-emerald-400',
  'Feature Request': 'bg-violet-500/10 text-violet-400',
}

export default function SupportPage() {
  const [selected, setSelected] = useState<(typeof tickets)[0] | null>(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const open = tickets.filter(t => t.status === 'open')
  const urgent = tickets.filter(t => t.priority === 'urgent' && t.status === 'open')

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const filtered = tickets
    .filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter
      const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.client.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Support Tickets</h1>
          <p className="text-[13px] text-white/40 mt-0.5">
            {open.length} open · {urgent.length} urgent
          </p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Open Tickets', value: open.length, color: 'text-violet-400' },
          { label: 'Urgent', value: urgent.length, color: 'text-red-400' },
          { label: 'Avg Response', value: '2.4 hr', color: 'text-white' },
          { label: 'Resolved Today', value: 2, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4 text-center">
            <p className={`text-[22px] font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-4 h-[580px]">
        {/* Ticket list */}
        <div className="w-96 flex-shrink-0 bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="p-3 border-b border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent text-[12px] text-white/70 placeholder:text-white/25 outline-none flex-1" placeholder="Search tickets…" />
            </div>
            <div className="flex gap-1">
              {['open', 'resolved', 'all'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                    statusFilter === s ? 'bg-violet-600/30 text-violet-400' : 'text-white/30 hover:text-white/60'
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          {/* List — auto-sorted by urgency */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-1.5 bg-white/[0.02] border-b border-white/[0.04]">
              <p className="text-[10px] text-white/25">Auto-sorted by urgency · client notified on reply</p>
            </div>
            {filtered.map(t => {
              const p = priorityConfig[t.priority]
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left p-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selected?.id === t.id ? 'bg-violet-600/10 border-l-2 border-l-violet-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-[12px] font-medium text-white/85 leading-tight flex-1">{t.subject}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${p.color}`}>{t.priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor[t.category]}`}>{t.category}</span>
                    <span className="text-[10px] text-white/30">{t.client}</span>
                    <span className="text-[10px] text-white/20 ml-auto">{t.created}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Ticket detail */}
        <div className="flex-1 bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden flex flex-col">
          {selected ? (
            <>
              {/* Detail header */}
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] text-white/30 mb-1">{selected.id}</p>
                    <h3 className="text-[14px] font-semibold text-white">{selected.subject}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${priorityConfig[selected.priority].color}`}>{selected.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusConfig[selected.status]}`}>{selected.status}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor[selected.category]}`}>{selected.category}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-white/30">
                    <p>Client: <span className="text-white/60">{selected.client}</span></p>
                    <p>Assignee: <span className="text-white/60">{selected.assignee}</span></p>
                    <p>Opened: <span className="text-white/60">{selected.created}</span></p>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold">C</div>
                    <span className="text-[12px] font-medium text-white/70">Client</span>
                    <span className="text-[10px] text-white/25">{selected.created}</span>
                  </div>
                  <p className="text-[12px] text-white/60 leading-relaxed">{selected.description}</p>
                </div>

                {selected.messages > 1 && (
                  <div className="bg-violet-600/10 border border-violet-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-[9px] font-bold">SA</div>
                      <span className="text-[12px] font-medium text-violet-400">Support Team</span>
                      <span className="text-[10px] text-white/25">{selected.lastReply}</span>
                    </div>
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      Thanks for reporting this. We're investigating the issue and will provide an update shortly.
                      Can you share the request ID or timestamp when this occurs?
                    </p>
                  </div>
                )}
              </div>

              {/* Reply box */}
              <div className="p-4 border-t border-white/[0.06]">
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your reply…"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 placeholder:text-white/25 outline-none resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[12px] text-white font-medium transition-colors flex items-center gap-1.5">Reply <span className="text-[9px] bg-white/20 px-1 py-0.5 rounded">+ email</span></button>
                    <button className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-400 hover:bg-emerald-500/15 transition-colors">Resolve</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <LifeBuoy className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-[14px] text-white/30 font-medium">Select a ticket</p>
              <p className="text-[12px] text-white/15 mt-1">Click any ticket to view details and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
