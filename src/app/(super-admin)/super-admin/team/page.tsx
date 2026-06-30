'use client'

import { useState } from 'react'
import { Users, Plus, Shield, Edit2, Trash2, CheckCircle2, XCircle, Mail } from 'lucide-react'

const teamMembers = [
  { id: 1, name: 'Krishna S.', email: 'krishna@magnivo.ai', role: 'super_admin', department: 'Engineering', status: 'active', lastLogin: '2 min ago', permissions: 'all' },
  { id: 2, name: 'Priya Menon', email: 'priya@magnivo.ai', role: 'admin', department: 'Success', status: 'active', lastLogin: '1 hr ago', permissions: 'clients,support,billing' },
  { id: 3, name: 'Rohan Nair', email: 'rohan@magnivo.ai', role: 'support', department: 'Support', status: 'active', lastLogin: '30 min ago', permissions: 'support,clients_view' },
  { id: 4, name: 'Divya Pillai', email: 'divya@magnivo.ai', role: 'billing', department: 'Finance', status: 'active', lastLogin: '3 hr ago', permissions: 'billing,analytics' },
  { id: 5, name: 'Arun Kumar', email: 'arun@magnivo.ai', role: 'engineer', department: 'Engineering', status: 'active', lastLogin: '5 hr ago', permissions: 'system,clients_view' },
  { id: 6, name: 'Sneha Raj', email: 'sneha@magnivo.ai', role: 'viewer', department: 'Marketing', status: 'invited', lastLogin: '—', permissions: 'analytics' },
]

const internalRoles = [
  {
    name: 'super_admin', label: 'Super Admin', description: 'Full access to everything',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
    permissions: ['clients_full', 'billing_full', 'users_full', 'system_full', 'analytics_full', 'support_full', 'team_full'],
  },
  {
    name: 'admin', label: 'Admin', description: 'Full access except team management',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    permissions: ['clients_full', 'billing_full', 'analytics_full', 'support_full'],
  },
  {
    name: 'support', label: 'Support', description: 'View clients, manage tickets',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    permissions: ['clients_view', 'support_full'],
  },
  {
    name: 'billing', label: 'Billing', description: 'Billing and analytics access',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    permissions: ['billing_full', 'analytics_full'],
  },
  {
    name: 'engineer', label: 'Engineer', description: 'System health and client view',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    permissions: ['system_full', 'clients_view'],
  },
  {
    name: 'viewer', label: 'Viewer', description: 'Read-only analytics access',
    color: 'text-white/40 bg-white/[0.04] border-white/[0.1]',
    permissions: ['analytics_view'],
  },
]

const allPermissions = [
  { key: 'clients_full', label: 'Clients (Full)' },
  { key: 'clients_view', label: 'Clients (View only)' },
  { key: 'billing_full', label: 'Billing (Full)' },
  { key: 'billing_view', label: 'Billing (View only)' },
  { key: 'support_full', label: 'Support (Full)' },
  { key: 'analytics_full', label: 'Analytics (Full)' },
  { key: 'analytics_view', label: 'Analytics (View)' },
  { key: 'system_full', label: 'System Health' },
  { key: 'team_full', label: 'Team Management' },
  { key: 'users_full', label: 'User Management' },
]

const roleConfig: Record<string, { color: string; label: string }> = {
  super_admin: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Super Admin' },
  admin: { color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Admin' },
  support: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Support' },
  billing: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Billing' },
  engineer: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Engineer' },
  viewer: { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]', label: 'Viewer' },
}

export default function TeamPage() {
  const [tab, setTab] = useState<'members' | 'roles'>('members')
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Internal Team</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{teamMembers.length} team members · Magnavo AI internal staff</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0d0d14] border border-white/[0.06] rounded-xl p-1 w-fit">
        {(['members', 'roles'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[12px] font-medium capitalize transition-all ${
              tab === t ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30' : 'text-white/40 hover:text-white/70'
            }`}>
            {t === 'roles' ? 'Roles & Permissions' : 'Team Members'}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <div className="bg-[#111118] border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Member', 'Role', 'Department', 'Permissions', 'Status', 'Last Login', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map(m => {
                const r = roleConfig[m.role]
                return (
                  <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white/80">{m.name}</p>
                          <p className="text-[11px] text-white/30">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${r.color}`}>{r.label}</span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-white/50">{m.department}</td>
                    <td className="px-5 py-3 text-[11px] text-white/40 max-w-[180px] truncate">{m.permissions}</td>
                    <td className="px-5 py-3">
                      <div className={`inline-flex items-center gap-1.5 text-[11px] ${m.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {m.status}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-white/30">{m.lastLogin}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.1] transition-colors">
                          <Edit2 className="w-3 h-3 text-white/50" />
                        </button>
                        {m.role !== 'super_admin' && (
                          <button className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/15 transition-colors">
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
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

      {tab === 'roles' && (
        <div className="space-y-4">
          <p className="text-[12px] text-white/30">Define what each internal role can access in the super admin panel.</p>
          <div className="grid grid-cols-2 gap-4">
            {internalRoles.map(role => (
              <div key={role.name} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-white/30" />
                      <span className={`text-[12px] font-semibold px-2 py-0.5 rounded border ${role.color}`}>{role.label}</span>
                    </div>
                    <p className="text-[11px] text-white/40">{role.description}</p>
                  </div>
                  <button className="text-[11px] text-violet-400 hover:text-violet-300">Edit</button>
                </div>
                <div className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                  {allPermissions.map(p => {
                    const has = role.permissions.includes(p.key)
                    return (
                      <div key={p.key} className="flex items-center justify-between">
                        <span className="text-[11px] text-white/40">{p.label}</span>
                        {has
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <XCircle className="w-3.5 h-3.5 text-white/15" />
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-[16px] font-semibold text-white mb-1">Invite Team Member</h2>
            <p className="text-[12px] text-white/40 mb-5">Send an invite to a Magnavo AI team member.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Full Name</label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Email</label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="jane@magnivo.ai" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Role</label>
                <select className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none">
                  {internalRoles.filter(r => r.name !== 'super_admin').map(r => (
                    <option key={r.name} value={r.name}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Department</label>
                <input className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="Engineering" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors flex items-center justify-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
