import { getPlatformTokenUsage, getSerpApiUsage } from '@/app/actions/super-admin'
import UsageClient from './UsageClient'

export default async function UsagePage() {
  const [usageData, serpUsage] = await Promise.all([getPlatformTokenUsage(30), getSerpApiUsage()])

  return <UsageClient initialData={usageData} initialDays={30} serpUsage={serpUsage} />
}
