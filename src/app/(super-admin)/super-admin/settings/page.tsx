import { getPlatformSettings } from '@/app/actions/super-admin'
import SettingsClient from './SettingsClient'

export default async function SuperAdminSettingsPage() {
  const settings = await getPlatformSettings()

  return <SettingsClient settings={settings} />
}
