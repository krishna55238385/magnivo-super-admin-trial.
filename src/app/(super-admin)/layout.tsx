'use client'

import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar'
import { SuperAdminHeader } from '@/components/super-admin/SuperAdminHeader'
import { DebugErrorBoundary } from '@/components/super-admin/DebugErrorBoundary'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <SuperAdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <SuperAdminHeader />
        <main className="flex-1 overflow-y-auto bg-[#0d0d14] px-6 py-6">
          <DebugErrorBoundary>{children}</DebugErrorBoundary>
        </main>
      </div>
    </div>
  )
}
