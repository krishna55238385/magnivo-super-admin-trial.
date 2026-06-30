'use client'

import { Bell, Search, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export function SuperAdminHeader() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
    window.location.reload()
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#090912] flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 w-72">
        <Search className="w-3.5 h-3.5 text-white/30" />
        <input
          className="bg-transparent text-[13px] text-white/70 placeholder:text-white/25 outline-none flex-1"
          placeholder="Search clients, users, invoices…"
        />
        <kbd className="text-[10px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded">⌘K</kbd>
      </div>

      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-400 font-medium">All systems operational</span>
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-white/50 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors">
          <Bell className="w-3.5 h-3.5 text-white/50" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 text-[8px] flex items-center justify-center font-bold">3</span>
        </button>
      </div>
    </header>
  )
}
