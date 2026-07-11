import { getAllClients } from '@/app/actions/super-admin'
import ClientsTable from './ClientsTable'

export default async function ClientsPage() {
  const clients = await getAllClients()
  return <ClientsTable clients={clients} />
}
