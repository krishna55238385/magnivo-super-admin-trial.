'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Building2, Users, CreditCard, Zap, Settings,
  AlertCircle, CheckCircle2, ExternalLink, Copy, Shield,
  Globe, Mail, Phone, Calendar, TrendingUp, DollarSign,
  Activity, FileText, Ban, RefreshCw, Edit2, Plus, Trash2,
  LifeBuoy, BarChart2, MessageSquare, Send, Clock, Lock, X
} from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const clientData: Record<string, any> = {
  c1: {
    name: 'Acme Corp', domain: 'acmecorp.com', plan: 'Enterprise', status: 'active',
    adminEmail: 'admin@acmecorp.com', adminName: 'Sarah Chen', phone: '+1 415 555 0198',
    industry: 'SaaS', employees: '200-500', country: 'United States', timezone: 'America/New_York',
    joinedAt: 'January 12, 2026', trialEnd: null, renewalDate: 'July 12, 2026',
    mrr: 4200, totalRevenue: 23100, tokensCurrent: '48.2M', tokenLimit: '100M',
    tokenCostCurrent: 96.40, avgDailyTokens: '1.6M', openAiModel: 'gpt-4o',
    users: [
      { name: 'Sarah Chen', email: 'sarah@acmecorp.com', role: 'admin', lastLogin: '2 min ago', status: 'active' },
      { name: 'Mike Torres', email: 'mike@acmecorp.com', role: 'user', lastLogin: '1 hr ago', status: 'active' },
      { name: 'Lisa Park', email: 'lisa@acmecorp.com', role: 'user', lastLogin: '3 hr ago', status: 'active' },
      { name: 'James Wu', email: 'james@acmecorp.com', role: 'admin', lastLogin: '1 day ago', status: 'active' },
    ],
    invoices: [
      { id: 'INV-2847', date: 'Jun 1, 2026', amount: 4200, status: 'paid' },
      { id: 'INV-2798', date: 'May 1, 2026', amount: 4200, status: 'paid' },
      { id: 'INV-2741', date: 'Apr 1, 2026', amount: 3600, status: 'paid' },
    ],
    tickets: [],
    healthScore: 98,
    healthHistory: [
      { day: 'Jun 1', score: 91 }, { day: 'Jun 3', score: 89 }, { day: 'Jun 5', score: 93 },
      { day: 'Jun 8', score: 90 }, { day: 'Jun 10', score: 94 }, { day: 'Jun 12', score: 96 },
      { day: 'Jun 15', score: 95 }, { day: 'Jun 17', score: 97 }, { day: 'Jun 20', score: 96 },
      { day: 'Jun 22', score: 98 }, { day: 'Jun 25', score: 97 }, { day: 'Jun 28', score: 98 },
      { day: 'Jun 30', score: 98 },
    ],
    usageHistory: [
      { week: 'W1', tokens: 10.2 }, { week: 'W2', tokens: 12.4 },
      { week: 'W3', tokens: 11.8 }, { week: 'W4', tokens: 13.8 },
    ],
    integrations: ['Gmail', 'Google Analytics', 'SerpAPI', 'Interakt'],
    features: { engage: true, dialer: true, gtm: true, workflows: true, ai_search: true },
    internalNotes: [
      { id: 'n1', author: 'Priya Menon', authorInitial: 'P', timestamp: 'Jun 28, 2026 · 2:34 PM', text: 'Had a great sync with Sarah. They want to expand usage to the sales team by Q3. Flag for upsell opportunity.' },
      { id: 'n2', author: 'Raj Kumar', authorInitial: 'R', timestamp: 'Jun 25, 2026 · 11:10 AM', text: 'Renewal confirmed verbally. Contract renewal date is July 12. Follow up 2 weeks before.' },
    ],
  },
}

const tabs = ['Overview', 'Users', 'Billing', 'Usage', 'Integrations', 'Support', 'Notes', 'Settings', 'Audit']

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState('Overview')
  const client = clientData[id] || clientData['c1']
  const [notes, setNotes] = useState(client.internalNotes || [])
  const [newNote, setNewNote] = useState('')
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [showDangerConfirm, setShowDangerConfirm] = useState<string | null>(null)
  const [dangerInput, setDangerInput] = useState('')

  function addNote() {
    if (!newNote.trim()) return
    setNotes((prev: any[]) => [
      { id: `n${Date.now()}`, author: 'You', authorInitial: 'Y', timestamp: 'Just now', text: newNote.trim() },
      ...prev,
    ])
    setNewNote('')
  }

  const dangerActions: Record<string, { label: string; confirmWord: string; color: string }> = {
    suspend: { label: 'Suspend Organization', confirmWord: 'SUSPEND', color: 'amber' },
    delete: { label: 'Delete Organization', confirmWord: 'DELETE', color: 'red' },
  }

  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Breadcrumb & header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/super-admin/clients" className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[15px] font-bold text-white/70">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{client.name}</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Active</span>
                <span className="text-[11px] px-2 py-0.5 rounded border bg-violet-500/10 text-violet-400 border-violet-500/20 font-medium">{client.plan}</span>
              </div>
              <p className="text-[12px] text-white/40 mt-0.5">{client.domain} · {client.industry} · {client.country}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImpersonateModal(true)}
            className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] text-white/60 text-[12px] px-3 py-2 rounded-lg hover:bg-white/[0.08] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Impersonate
          </button>
          <button
            onClick={() => { setShowDangerConfirm('suspend'); setDangerInput('') }}
            className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[12px] px-3 py-2 rounded-lg hover:bg-amber-500/15 transition-colors"
          >
            <Ban className="w-3.5 h-3.5" /> Suspend
          </button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Monthly Revenue', value: `$${client.mrr.toLocaleString()}`, sub: 'Enterprise plan', icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Users', value: client.users.length, sub: `${client.users.filter((u: any) => u.status === 'active').length} active`, icon: Users, color: 'text-blue-400' },
          { label: 'Tokens This Month', value: client.tokensCurrent, sub: `of ${client.tokenLimit} limit`, icon: Zap, color: 'text-amber-400' },
          { label: 'Health Score', value: `${client.healthScore}%`, sub: 'Trending up ↑', icon: Activity, color: 'text-violet-400' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-white/40">{label}</p>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-[18px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all relative ${
              tab === t
                ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t}
            {t === 'Notes' && notes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 text-[8px] text-white flex items-center justify-center font-bold">
                {notes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {/* Usage chart */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[13px] font-semibold text-white mb-4">Token Usage (Last 4 Weeks)</p>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={client.usageHistory}>
                  <defs>
                    <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}M tokens`]} />
                  <Area type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2} fill="url(#tGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Health score history */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[13px] font-semibold text-white">Health Score History</p>
                  <p className="text-[11px] text-white/30 mt-0.5">Last 30 days · 0–100 scale</p>
                </div>
                <div className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Trending up
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={client.healthHistory}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any) => [`${v}%`, 'Health']}
                  />
                  <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent invoices */}
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[13px] font-semibold text-white mb-4">Recent Invoices</p>
              <div className="space-y-2">
                {client.invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-white/30" />
                      <div>
                        <p className="text-[12px] font-medium text-white/70">{inv.id}</p>
                        <p className="text-[11px] text-white/30">{inv.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-white">${inv.amount.toLocaleString()}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-4">Account Info</p>
              <div className="space-y-3">
                {[
                  { label: 'Admin', value: client.adminName, icon: Shield },
                  { label: 'Email', value: client.adminEmail, icon: Mail },
                  { label: 'Phone', value: client.phone, icon: Phone },
                  { label: 'Joined', value: client.joinedAt, icon: Calendar },
                  { label: 'Renewal', value: client.renewalDate, icon: RefreshCw },
                  { label: 'Timezone', value: client.timezone, icon: Globe },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-white/25">{label}</p>
                      <p className="text-[12px] text-white/70">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-3">Features Enabled</p>
              <div className="space-y-2">
                {Object.entries(client.features).map(([k, v]: any) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[12px] text-white/50 capitalize">{k.replace('_', ' ')}</span>
                    <div className={`w-8 h-4 rounded-full ${v ? 'bg-violet-600' : 'bg-white/[0.08]'} relative transition-colors`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${v ? 'left-4' : 'left-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick note preview */}
            {notes.length > 0 && (
              <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider">Latest Note</p>
                  <button onClick={() => setTab('Notes')} className="text-[10px] text-violet-400 hover:text-violet-300">See all</button>
                </div>
                <p className="text-[12px] text-white/60 line-clamp-3">{notes[0].text}</p>
                <p className="text-[10px] text-white/25 mt-2">{notes[0].author} · {notes[0].timestamp}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'Users' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">{client.users.length} Users</p>
            <button className="flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 text-violet-400 text-[12px] px-3 py-1.5 rounded-lg hover:bg-violet-600/30 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Name', 'Email', 'Role', 'Last Login', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.users.map((u: any) => (
                <tr key={u.email} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-[13px] font-medium text-white/80">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-white/50">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      u.role === 'admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-white/[0.05] text-white/50'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-white/40">{u.lastLogin}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[11px] text-emerald-400">{u.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.15] transition-colors">Edit</button>
                      <button className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Billing' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-white">Invoice History</p>
                <button className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Issue Invoice
                </button>
              </div>
              {client.invoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white/30" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white/80">{inv.id}</p>
                      <p className="text-[11px] text-white/30">{inv.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[14px] font-semibold text-white">${inv.amount.toLocaleString()}</p>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>{inv.status}</span>
                    <button className="text-[11px] text-white/30 hover:text-white/60">Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <p className="text-[12px] font-semibold text-white/60 uppercase tracking-wider mb-4">Current Plan</p>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-[12px] text-white/40">Plan</span><span className="text-[12px] font-semibold text-violet-400">{client.plan}</span></div>
                <div className="flex justify-between"><span className="text-[12px] text-white/40">MRR</span><span className="text-[12px] font-semibold text-white">${client.mrr.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[12px] text-white/40">Total Revenue</span><span className="text-[12px] font-semibold text-white">${client.totalRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-[12px] text-white/40">Next Renewal</span><span className="text-[12px] text-white/70">{client.renewalDate}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                <button className="w-full py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-[12px] text-violet-400 hover:bg-violet-600/30 transition-colors">Upgrade Plan</button>
                <button className="w-full py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-white/40 hover:text-white/60 transition-colors">Apply Discount</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Notes tab */}
      {tab === 'Notes' && (
        <div className="space-y-4">
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 flex items-center gap-3">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-[12px] text-amber-300/70">These notes are internal only — never visible to the client. Use them to flag context, coordinate handoffs, or leave updates for teammates.</p>
          </div>

          {/* Compose */}
          <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-[13px] text-white/80 placeholder:text-white/25 outline-none resize-none"
              placeholder="Add an internal note… (e.g. client mentioned churn risk, or ready for upsell)"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] text-white/25">Visible only to Magnivo team</span>
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[12px] font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Post Note
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="space-y-3">
            {notes.length === 0 && (
              <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
                <MessageSquare className="w-7 h-7 text-white/15 mx-auto mb-3" />
                <p className="text-[13px] text-white/30">No internal notes yet.</p>
              </div>
            )}
            {notes.map((note: any) => (
              <div key={note.id} className="bg-[#111118] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {note.authorInitial}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px] font-semibold text-white/80">{note.author}</span>
                      <span className="text-[10px] text-white/25 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {note.timestamp}
                      </span>
                    </div>
                    <p className="text-[13px] text-white/65 leading-relaxed">{note.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Settings' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: 'Organization Details',
              fields: [
                { label: 'Company Name', value: client.name },
                { label: 'Domain', value: client.domain },
                { label: 'Industry', value: client.industry },
                { label: 'Country', value: client.country },
                { label: 'Timezone', value: client.timezone },
              ]
            },
            {
              title: 'Token Limits',
              fields: [
                { label: 'Monthly Token Limit', value: client.tokenLimit },
                { label: 'Alert Threshold', value: '80%' },
                { label: 'Hard Cap', value: 'Enabled' },
                { label: 'Primary Model', value: client.openAiModel },
              ]
            }
          ].map(section => (
            <div key={section.title} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-white">{section.title}</p>
                <button className="text-[11px] text-violet-400 flex items-center gap-1 hover:text-violet-300">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="space-y-3">
                {section.fields.map(f => (
                  <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-[12px] text-white/40">{f.label}</span>
                    <span className="text-[12px] font-medium text-white/80">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-5">
            <p className="text-[13px] font-semibold text-red-400 mb-1">Danger Zone</p>
            <p className="text-[12px] text-white/40 mb-4">These actions are irreversible. A typed confirmation is required.</p>
            <div className="space-y-2">
              <button
                onClick={() => { setShowDangerConfirm('suspend'); setDangerInput('') }}
                className="w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-400 hover:bg-amber-500/15 transition-colors"
              >
                Suspend Organization
              </button>
              <button
                onClick={() => { setShowDangerConfirm('delete'); setDangerInput('') }}
                className="w-full py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 hover:bg-red-500/15 transition-colors"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'Support' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
          <LifeBuoy className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-[14px] text-white/50 font-medium">No open support tickets</p>
          <p className="text-[12px] text-white/25 mt-1">This client has no active issues.</p>
          <button className="mt-4 px-4 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-[12px] text-violet-400 hover:bg-violet-600/30 transition-colors">
            Create Ticket
          </button>
        </div>
      )}

      {(tab === 'Usage' || tab === 'Integrations' || tab === 'Audit') && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-8 text-center">
          <BarChart2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-[14px] text-white/50 font-medium">{tab} — Coming Soon</p>
          <p className="text-[12px] text-white/25 mt-1">This section is under active development.</p>
        </div>
      )}

      {/* Impersonation modal */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowImpersonateModal(false)}>
          <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <ExternalLink className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-white">Impersonate {client.name}</h2>
                <p className="text-[11px] text-white/40">View the platform exactly as this client sees it</p>
              </div>
            </div>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3 mb-5 space-y-1.5">
              {[
                'Session auto-expires after 30 minutes',
                'Sensitive actions (billing, suspension) are blocked',
                'This entire session will be recorded in the audit log',
              ].map(w => (
                <div key={w} className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-300/70">{w}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowImpersonateModal(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={() => setShowImpersonateModal(false)} className="flex-1 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-[13px] text-white font-medium transition-colors">Start Session</button>
            </div>
          </div>
        </div>
      )}

      {/* Danger action confirm modal */}
      {showDangerConfirm && (() => {
        const action = dangerActions[showDangerConfirm]
        const isRed = action.color === 'red'
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDangerConfirm(null)}>
            <div className="bg-[#111118] border border-white/[0.12] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h2 className={`text-[15px] font-semibold mb-2 ${isRed ? 'text-red-400' : 'text-amber-400'}`}>{action.label}</h2>
              <p className="text-[12px] text-white/40 mb-4">
                Type <span className={`font-mono font-bold ${isRed ? 'text-red-400' : 'text-amber-400'}`}>{action.confirmWord}</span> to confirm this action.
              </p>
              <input
                value={dangerInput}
                onChange={e => setDangerInput(e.target.value)}
                className={`w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-[13px] text-white outline-none mb-4 ${isRed ? 'border-red-500/30 focus:border-red-500/60' : 'border-amber-500/30 focus:border-amber-500/60'}`}
                placeholder={action.confirmWord}
              />
              <div className="flex gap-2">
                <button onClick={() => setShowDangerConfirm(null)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
                <button
                  disabled={dangerInput !== action.confirmWord}
                  className={`flex-1 py-2 rounded-lg text-[13px] text-white font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${isRed ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
