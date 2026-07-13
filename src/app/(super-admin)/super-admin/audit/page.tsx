import { getPlatformAuditLogs } from '@/app/actions/super-admin'
import AuditClient from './AuditClient'

export default async function AuditPage() {
  const logs = await getPlatformAuditLogs({})

  return <AuditClient logs={logs} />
}
