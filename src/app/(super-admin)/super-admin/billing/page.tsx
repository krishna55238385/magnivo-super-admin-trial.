import {
  getAllInvoices,
  getRevenueStats,
  getMRRBreakdown,
  getPlans,
  getAllClients,
} from '@/app/actions/super-admin'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const [invoices, revenueStats, mrrBreakdown, plans, clients] = await Promise.all([
    getAllInvoices(),
    getRevenueStats(),
    getMRRBreakdown(),
    getPlans(),
    getAllClients(),
  ])

  return (
    <BillingClient
      invoices={invoices}
      revenueStats={revenueStats}
      mrrBreakdown={mrrBreakdown}
      plans={plans}
      clients={clients}
    />
  )
}
