import { getSupportTickets } from '@/app/actions/super-admin'
import SupportClient from './SupportClient'

export default async function SupportPage() {
  const tickets = await getSupportTickets()

  return <SupportClient tickets={tickets} />
}
