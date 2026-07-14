'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { acceptTeamInvite } from '@/app/actions/super-admin'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  billing: 'Billing',
  support: 'Support',
  viewer: 'Viewer',
}

export default function AcceptInviteClient({
  token, email, fullName: initialFullName, role,
}: { token: string; email: string; fullName: string; role: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) { setError('Full name is required'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    const result = await acceptTeamInvite({ token, fullName: fullName.trim(), password })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/super-admin')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Lock className="h-5 w-5 text-violet-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-white">You&apos;ve been invited</h1>
            <p className="text-[13px] text-white/40">Join Magnivo as {ROLE_LABELS[role] ?? role} ({email})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-[#0d0d14] p-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-[12px] font-medium text-white/50">Full Name</label>
            <input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[12px] font-medium text-white/50">Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-[12px] font-medium text-white/50">Confirm Password</label>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••" autoComplete="new-password"
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{error}</div>}
          <button type="submit" disabled={loading}
            className="mt-1 rounded-lg bg-violet-500 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Setting up…' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
