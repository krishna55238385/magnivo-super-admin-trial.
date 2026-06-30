'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

export function UserMenu({ userName }: { userName?: string | null }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    router.push('/sign-in')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50">
          {userName && (
            <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-600 truncate">{userName}</span>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
