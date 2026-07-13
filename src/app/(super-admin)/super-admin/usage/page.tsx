import { getPlatformTokenUsage } from '@/app/actions/super-admin'
import UsageClient from './UsageClient'

export default async function UsagePage() {
  const usageData = await getPlatformTokenUsage(30)

  return <UsageClient initialData={usageData} initialDays={30} />
}
