'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { LifeBuoy, Plus, Search, X } from 'lucide-react'
import { createSupportTicket, resolveTicket, replyToTicket } from '@/app/actions/super-admin'

type Ticket = {
  id: string
  ticket_number: string
  organization_id: string | null
  organization_name: string | null
  subject: string
  description: string | null
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  category: string
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
  message_count: number
}

const SENDER_NAME = 'Support Team'

const priorityConfig: Record<string, { color: string }> = {
  urgent: { color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  high: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  medium: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  low: { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]' },
}

const statusConfig: Record<string, string> = {
  open: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  waiting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-white/[0.04] text-white/40 border-white/[0.1]',
}

const categoryColor: Record<string, string> = {
  Bug: 'bg-red-500/10 text-red-400',
  Billing: 'bg-amber-500/10 text-amber-400',
  Integration: 'bg-blue-500/10 text-blue-400',
  Account: 'bg-orange-500/10 text-orange-400',
  Onboarding: 'bg-emerald-500/10 text-emerald-400',
  'Feature Request': 'bg-violet-500/10 text-violet-400',
  General: 'bg-white/[0.06] text-white/50',
}

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function isToday(iso: string | null) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export default function SupportClient({ tickets }: { tickets: Ticket[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(() => tickets.find(t => t.id === selectedId) ?? null, [tickets, selectedId])

  const open = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed')
  const urgent = open.filter(t => t.priority === 'urgent')
  const resolvedToday = tickets.filter(t => t.status === 'resolved' && isToday(t.resolved_at))

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

  const filtered = tickets
    .filter(t => {
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && t.status !== 'resolved' && t.status !== 'closed') ||
        (statusFilter === 'resolved' && (t.status === 'resolved' || t.status === 'closed'))
      const matchSearch =
        !search ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        (t.organization_name ?? '').toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9))

  useEffect(() => {
    if (selectedId && !tickets.some(t => t.id === selectedId)) setSelectedId(null)
  }, [tickets, selectedId])

  function handleReply() {
    if (!selected || !newMessage.trim()) return
    const content = newMessage.trim()
    setNewMessage('')
    startTransition(async () => {
      await replyToTicket(selected.id, content, SENDER_NAME)
    })
  }

  function handleResolve() {
    if (!selected) return
    startTransition(async () => {
      await resolveTicket(selected.id)
    })
  }

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
        <button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Tickets', value: open.length, color: 'text-violet-400' },
          { label: 'Urgent', value: urgent.length, color: 'text-red-400' },
          { label: 'Resolved Today', value: resolvedToday.length, color: 'text-emerald-400' },
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
            {filtered.length === 0 ? (
              <p className="text-[12px] text-white/30 text-center py-10">No tickets found</p>
            ) : (
              filtered.map(t => {
                const p = priorityConfig[t.priority] ?? priorityConfig.low
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left p-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${selectedId === t.id ? 'bg-violet-600/10 border-l-2 border-l-violet-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[12px] font-medium text-white/85 leading-tight flex-1">{t.subject}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${p.color}`}>{t.priority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor[t.category] ?? categoryColor.General}`}>{t.category}</span>
                      <span className="text-[10px] text-white/30">{t.organization_name ?? 'Unknown'}</span>
                      <span className="text-[10px] text-white/20 ml-auto">{timeAgo(t.created_at)}</span>
                    </div>
                  </button>
                )
              })
            )}
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
                    <p className="text-[10px] text-white/30 mb-1">{selected.ticket_number}</p>
                    <h3 className="text-[14px] font-semibold text-white">{selected.subject}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${(priorityConfig[selected.priority] ?? priorityConfig.low).color}`}>{selected.priority}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusConfig[selected.status] ?? statusConfig.open}`}>{selected.status}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor[selected.category] ?? categoryColor.General}`}>{selected.category}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-white/30">
                    <p>Client: <span className="text-white/60">{selected.organization_name ?? 'Unknown'}</span></p>
                    <p>Assignee: <span className="text-white/60">{selected.assigned_to ?? 'Unassigned'}</span></p>
                    <p>Opened: <span className="text-white/60">{timeAgo(selected.created_at)}</span></p>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold">C</div>
                    <span className="text-[12px] font-medium text-white/70">Client</span>
                    <span className="text-[10px] text-white/25">{timeAgo(selected.created_at)}</span>
                  </div>
                  <p className="text-[12px] text-white/60 leading-relaxed">{selected.description || 'No description provided.'}</p>
                </div>

                {selected.message_count > 0 && (
                  <p className="text-[11px] text-white/30 text-center">
                    {selected.message_count} repl{selected.message_count === 1 ? 'y' : 'ies'} in this thread
                  </p>
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
                    <button
                      onClick={handleReply}
                      disabled={isPending || !newMessage.trim()}
                      className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[12px] text-white font-medium transition-colors"
                    >
                      Reply
                    </button>
                    <button
                      onClick={handleResolve}
                      disabled={isPending || selected.status === 'resolved'}
                      className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[12px] text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {selected.status === 'resolved' ? 'Resolved' : 'Resolve'}
                    </button>
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

      {showNewTicket && <NewTicketModal onClose={() => setShowNewTicket(false)} />}
    </div>
  )
}

function NewTicketModal({ onClose }: { onClose: () => void }) {
  const [orgId, setOrgId] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('General')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!orgId.trim() || !subject.trim()) {
      setError('Organization ID and subject are required')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createSupportTicket({ orgId: orgId.trim(), subject: subject.trim(), description, priority, category })
      if (result?.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111118] border border-white/[0.08] rounded-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-semibold text-white">New Ticket</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 mb-1 block">Organization ID</label>
            <input value={orgId} onChange={e => setOrgId(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none" placeholder="org uuid" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1 block">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none" placeholder="Short summary" />
          </div>
          <div>
            <label className="text-[11px] text-white/40 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none resize-none" placeholder="Details" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-white/40 mb-1 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none">
                {['urgent', 'high', 'medium', 'low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-white/40 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/80 outline-none">
                {['General', 'Bug', 'Billing', 'Integration', 'Account', 'Onboarding', 'Feature Request'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[12px] text-white/50 hover:text-white/80 transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={isPending} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[12px] text-white font-medium transition-colors">
              {isPending ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
