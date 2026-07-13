import {
  getAllInvoices,
  getRevenueStats,
  getMRRBreakdown,
  getPlans,
} from '@/app/actions/super-admin'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const [invoices, revenueStats, mrrBreakdown, plans] = await Promise.all([
    getAllInvoices(),
    getRevenueStats(),
    getMRRBreakdown(),
    getPlans(),
  ])

  return (
    <BillingClient
      invoices={invoices}
      revenueStats={revenueStats}
      mrrBreakdown={mrrBreakdown}
      plans={plans}
    />
  )
}
