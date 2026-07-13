import { getSystemHealth } from '@/app/actions/super-admin'
import SystemClient from './SystemClient'

export default async function SystemPage() {
  const services = await getSystemHealth()

  return <SystemClient services={services} />
}
