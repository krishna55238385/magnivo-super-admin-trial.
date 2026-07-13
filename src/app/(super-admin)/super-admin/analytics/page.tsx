import { getPlatformStats, getAllClients } from '@/app/actions/super-admin'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const [stats, clients] = await Promise.all([
    getPlatformStats('30d'),
    getAllClients(),
  ])

  return <AnalyticsClient stats={stats} clients={clients} />
}
