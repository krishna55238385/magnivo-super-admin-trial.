'use client'

import { useState, useTransition } from 'react'
import { Plus, Shield, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { inviteTeamMember } from '@/app/actions/super-admin'

type TeamMember = {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  last_login_at: string | null
  created_at: string
}

type RolePermissions = Record<string, string[]>

const roleConfig: Record<string, { color: string; label: string; description: string }> = {
  super_admin: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'Super Admin', description: 'Full access to everything' },
  admin: { color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', label: 'Admin', description: 'Full access except team management' },
  billing: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Billing', description: 'Billing and audit access' },
  support: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'Support', description: 'View clients, manage support tickets' },
  viewer: { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]', label: 'Viewer', description: 'Read-only access' },
}

const PERMISSION_LABELS: Record<string, string> = {
  view_clients: 'View Clients',
  manage_onboarding: 'Manage Onboarding',
  view_billing: 'View Billing',
  manage_billing: 'Manage Billing',
  manage_support: 'Manage Support',
  view_team: 'View Team',
  view_audit: 'View Audit Logs',
}

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function TeamClient({ team, rolePermissions }: { team: TeamMember[]; rolePermissions: RolePermissions }) {
  const [tab, setTab] = useState<'members' | 'roles'>('members')
  const [showInvite, setShowInvite] = useState(false)

  const roleNames = Object.keys(rolePermissions)
  const invitableRoles = roleNames.filter(r => r !== 'super_admin')

  return (
    <div className="space-y-5 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Internal Team</h1>
          <p className="text-[13px] text-white/40 mt-0.5">{team.length} team member{team.length === 1 ? '' : 's'} · Magnavo AI internal staff</p>
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
          {team.length === 0 ? (
            <p className="text-[12px] text-white/30 text-center py-10">No team members yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Member', 'Role', 'Department', 'Status', 'Last Login'].map(h => (
                    <th key={h} className="text-left text-[11px] font-medium text-white/30 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {team.map(m => {
                  const r = roleConfig[m.role] ?? { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]', label: m.role, description: '' }
                  const status = m.last_login_at ? 'active' : 'invited'
                  return (
                    <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold">
                            {m.full_name?.charAt(0) ?? '?'}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white/80">{m.full_name}</p>
                            <p className="text-[11px] text-white/30">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${r.color}`}>{r.label}</span>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-white/50">{m.department ?? '—'}</td>
                      <td className="px-5 py-3">
                        <div className={`inline-flex items-center gap-1.5 text-[11px] ${status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {status}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-white/30">{timeAgo(m.last_login_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-4">
          <p className="text-[12px] text-white/30">Define what each internal role can access in the super admin panel.</p>
          <div className="grid grid-cols-2 gap-4">
            {roleNames.map(name => {
              const cfg = roleConfig[name] ?? { color: 'text-white/40 bg-white/[0.04] border-white/[0.1]', label: name, description: '' }
              const perms = rolePermissions[name] ?? []
              const hasAll = perms.includes('all')
              return (
                <div key={name} className="bg-[#111118] border border-white/[0.07] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-white/30" />
                    <span className={`text-[12px] font-semibold px-2 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-[11px] text-white/40">{cfg.description}</p>
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.06]">
                    {hasAll ? (
                      <p className="text-[11px] text-emerald-400">All permissions granted</p>
                    ) : (
                      Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                        const has = perms.includes(key)
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-[11px] text-white/40">{label}</span>
                            {has
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              : <XCircle className="w-3.5 h-3.5 text-white/15" />
                            }
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && <InviteModal invitableRoles={invitableRoles} onClose={() => setShowInvite(false)} />}
    </div>
  )
}

function InviteModal({ invitableRoles, onClose }: { invitableRoles: string[]; onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(invitableRoles[0] ?? 'viewer')
  const [department, setDepartment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await inviteTeamMember({ email: email.trim(), fullName: fullName.trim(), role, department: department.trim() })
      if (result?.error) {
        setError(result.error)
        return
      }
      setInviteLink(result.inviteLink ?? null)
    })
  }

  async function copyInviteLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111118] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        {!inviteLink ? (
          <>
            <h2 className="text-[16px] font-semibold text-white mb-1">Invite Team Member</h2>
            <p className="text-[12px] text-white/40 mb-5">Send an invite to a Magnavo AI team member.</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="Jane Smith" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="jane@magnivo.ai" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none">
                  {invitableRoles.map(r => (
                    <option key={r} value={r}>{roleConfig[r]?.label ?? r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-white/50 block mb-1">Department</label>
                <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 outline-none focus:border-violet-500/50" placeholder="Engineering" />
              </div>
            </div>
            {error && <p className="text-[11px] text-red-400 mt-3">{error}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-white/[0.08] text-[13px] text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={isPending} className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-[13px] text-white font-medium transition-colors flex items-center justify-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {isPending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-[16px] font-semibold text-white mb-1">Invite Sent</h2>
            <p className="text-[12px] text-white/40 mb-4">
              Share this invite link with {email} — no email has been sent automatically.
            </p>
            <div className="flex items-center gap-2 mb-2">
              <input
                readOnly
                value={inviteLink}
                onFocus={e => e.target.select()}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-white/70 outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="shrink-0 py-2 px-3 rounded-lg border border-white/[0.1] text-[12px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <button onClick={onClose} className="w-full mt-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-[13px] text-white font-medium transition-colors">Done</button>
          </>
        )}
      </div>
    </div>
  )
}
