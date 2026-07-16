import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getClientDetail,
  getSupportTicketsForClient,
  getAuditLogsForClient,
  getNotesForClient,
  getPlans,
} from '@/app/actions/super-admin'
import ClientDetailView from './ClientDetailView'

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const [detail, tickets, auditLogs, notesResult, plans] = await Promise.all([
    getClientDetail(id),
    getSupportTicketsForClient(id),
    getAuditLogsForClient(id),
    getNotesForClient(id),
    getPlans(),
  ])

  if (!detail.org) {
    return (
      <div className="max-w-[1300px] py-16 text-center">
        <p className="text-[14px] text-white/50 mb-3">Client not found.</p>
        <Link href="/super-admin/clients" className="inline-flex items-center gap-1.5 text-[12px] text-violet-400 hover:text-violet-300">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <ClientDetailView
      org={detail.org}
      users={detail.users}
      invoices={detail.invoices}
      usageSummary={detail.usageSummary}
      status={detail.status}
      plan={detail.plan}
      tickets={tickets}
      auditLogs={auditLogs}
      notes={notesResult.notes}
      plans={plans}
      userLimit={detail.userLimit}
      planMaxUsers={detail.planMaxUsers}
    />
  )
}
