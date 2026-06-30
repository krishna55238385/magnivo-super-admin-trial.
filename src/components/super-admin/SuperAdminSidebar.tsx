'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, CreditCard, BarChart3,
  Zap, LifeBuoy, Shield, FileText, Activity, Settings,
  ChevronRight, Layers, UserCog, Bell, GitBranch
} from 'lucide-react'

const nav = [
  { label: 'Overview', href: '/super-admin', icon: LayoutDashboard },
  { label: 'Clients', href: '/super-admin/clients', icon: Building2 },
  { label: 'Onboarding', href: '/super-admin/onboarding', icon: GitBranch },
  { label: 'Billing', href: '/super-admin/billing', icon: CreditCard },
  { label: 'Token Usage', href: '/super-admin/usage', icon: Zap },
  { label: 'Analytics', href: '/super-admin/analytics', icon: BarChart3 },
  { label: 'Support', href: '/super-admin/support', icon: LifeBuoy },
  { label: 'Internal Team', href: '/super-admin/team', icon: UserCog },
  { label: 'Audit Logs', href: '/super-admin/audit', icon: FileText },
  { label: 'System Health', href: '/super-admin/system', icon: Activity },
  { label: 'Settings', href: '/super-admin/settings', icon: Settings },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-[#090912] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white leading-none">Magnivo AI</p>
            <p className="text-[10px] text-white/40 mt-0.5 leading-none">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = href === '/super-admin'
            ? pathname === '/super-admin'
            : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-400' : ''}`} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-violet-400/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[11px] font-bold">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/80 truncate">Super Admin</p>
            <p className="text-[10px] text-white/30 truncate">internal@magnivo.ai</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
