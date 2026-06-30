'use client'

import { useState } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, AlertCircle, Plus,
  FileText, Download, CheckCircle2, XCircle, Clock, ChevronRight,
  BarChart2, ArrowUpRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const mrrHistory = [
  { month: 'Jan', mrr: 12400, new: 2800, churn: 600 },
  { month: 'Feb', mrr: 15800, new: 4200, churn: 800 },
  { month: 'Mar', mrr: 18200, new: 3100, churn: 700 },
  { month: 'Apr', mrr: 22600, new: 5200, churn: 800 },
  { month: 'May', mrr: 26100, new: 4300, churn: 800 },
  { month: 'Jun', mrr: 31400, new: 6100, churn: 800 },
]

const invoices = [
  { id: 'INV-2847', client: 'Acme Corp', plan: 'Enterprise', amount: 4200, date: 'Jun 1, 2026', status: 'paid', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2846', client: 'TechVentures', plan: 'Pro', amount: 1800, date: 'Jun 1, 2026', status: 'paid', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2845', client: 'SalesGenius', plan: 'Pro', amount: 1800, date: 'Jun 1, 2026', status: 'overdue', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2844', client: 'DataSync Pro', plan: 'Growth', amount: 1200, date: 'Jun 1, 2026', status: 'paid', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2843', client: 'GrowthLab', plan: 'Starter', amount: 490, date: 'Jun 1, 2026', status: 'paid', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2842', client: 'Nexus Digital', plan: 'Growth', amount: 1200, date: 'Jun 1, 2026', status: 'failed', dueDate: 'Jun 1, 2026' },
  { id: 'INV-2841', client: 'CloudScale', plan: 'Enterprise', amount: 0, date: 'Jun 25, 2026', status: 'trial', dueDate: '—' },
]

const plans = [
  { name: 'Starter', price: 490, clients: 2, features: ['3 users', '10M tokens/mo', 'CRM + Engage', 'Email support'] },
  { name: 'Growth', price: 1200, clients: 8, features: ['10 users', '30M tokens/mo', 'All Starter +', 'GTM Pipeline', 'Chat support'] },
  { name: 'Pro', price: 1800, clients: 8, features: ['25 users', '60M tokens/mo', 'All Growth +', 'Dialer', 'Priority support'] },
  { name: 'Enterprise', price: 4200, clients: 4, features: ['Unlimited users', '100M tokens/mo', 'All Pro +', 'Custom integrations', 'Dedicated CSM'] },
]

const statusConfig: Record<string, any> = {
  paid: { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  trial: { label: 'Trial', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'plans' | 'revenue'>('invoices')

  const totalMRR = 31400
  const totalARR = totalMRR * 12
  const overdueCount = invoices.filter(i => i.status === 'overdue' || i.status === 'failed').length
  const overdueAmount = invoices.filter(i => i.status === 'overdue' || i.status === 'failed').reduce((a, b) => a + b.amount, 0)

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Billing & Revenue</h1>
          <p className="text-[13px] text-white/40 mt-0.5">Manage invoices, plans, and revenue tracking</p>
        </div>
        <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Issue Invoice
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Monthly Recurring Revenue', value: `$${totalMRR.toLocaleString()}`, sub: '+20% MoM', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Annual Recurring Revenue', value: `$${(totalARR/1000).toFixed(0)}k`, sub: 'Projected', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Overdue / Failed', value: `$${overdueAmount.toLocaleString()}`, sub: `${overdueCount} invoices`, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Avg Revenue / Client', value: '$1,208', sub: 'per month', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
            <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit">
        {(['invoices', 'plans', 'revenue'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all capitalize ${
              activeTab === t ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'revenue' ? 'MRR Trend' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'invoices' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <p className="text-[13px] font-semibold text-white">{invoices.length} Invoices · Jun 2026</p>
            <button className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 border border-white/[0.08] px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Invoice', 'Client', 'Plan', 'Amount', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const s = statusConfig[inv.status]
                const Icon = s.icon
                return (
                  <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-white/30" />
                        <span className="text-[12px] font-medium text-white/70">{inv.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-white/70">{inv.client}</td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{inv.plan}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-white">{inv.amount > 0 ? `$${inv.amount.toLocaleString()}` : '—'}</td>
                    <td className="px-5 py-3 text-[12px] text-white/40">{inv.date}</td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>
                        <Icon className="w-3 h-3" />
                        {s.label}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06]">View</button>
                        <button className="text-[11px] text-white/40 hover:text-white/70 px-2 py-1 rounded border border-white/[0.06]">Download</button>
                        {inv.status !== 'paid' && (
                          <button className="text-[11px] text-violet-400 hover:text-violet-300 px-2 py-1 rounded border border-violet-500/20">Retry</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'plans' && (
        <div className="grid grid-cols-4 gap-4">
          {plans.map(p => (
            <div key={p.name} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[14px] font-semibold text-white">{p.name}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{p.clients} clients</p>
                </div>
                <p className="text-[18px] font-bold text-violet-400">${p.price.toLocaleString()}<span className="text-[11px] text-white/30 font-normal">/mo</span></p>
              </div>
              <div className="flex-1 space-y-2 mb-4">
                {p.features.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="text-[12px] text-white/50">{f}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-white/[0.06]">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-white/30">Revenue</span>
                  <span className="font-semibold text-white">${(p.price * p.clients).toLocaleString()}/mo</span>
                </div>
                <button className="w-full py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 hover:text-white/70 hover:bg-white/[0.07] transition-colors mt-2">
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[13px] font-semibold text-white mb-1">MRR Growth + Net Revenue Movement</p>
          <p className="text-[11px] text-white/30 mb-5">Monthly recurring revenue, new MRR, and churn</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mrrHistory}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: any, name: any) => [`$${v.toLocaleString()}`, name === 'mrr' ? 'MRR' : name === 'new' ? 'New MRR' : 'Churn']}
              />
              <Bar dataKey="mrr" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar dataKey="new" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="churn" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-3">
            {[
              { color: 'bg-violet-500', label: 'Total MRR' },
              { color: 'bg-emerald-500', label: 'New MRR' },
              { color: 'bg-red-500', label: 'Churned MRR' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                <span className="text-[11px] text-white/40">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
