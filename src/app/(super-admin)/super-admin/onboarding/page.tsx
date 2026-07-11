import { getAllClients, getOnboardingStatus } from '@/app/actions/super-admin'
import OnboardingView, { type OnboardingClient } from './OnboardingView'

export default async function OnboardingPage() {
  const clients = await getAllClients()
  const statuses = await Promise.all(clients.map(c => getOnboardingStatus(c.id)))

  const merged: OnboardingClient[] = clients.map((c, i) => ({
    id: c.id,
    name: c.name,
    plan_name: c.plan_name,
    created_at: c.created_at,
    user_count: c.user_count,
    onboarding_complete: c.onboarding_complete,
    onboarding: statuses[i] ?? {
      nda_status: 'not_sent',
      msa_status: 'not_sent',
      onboarding_form_status: 'not_sent',
      data_auth_status: 'not_sent',
      invoice_status: 'not_issued',
      activated_at: null,
      notes: null,
    },
  }))

  return <OnboardingView clients={merged} />
}
