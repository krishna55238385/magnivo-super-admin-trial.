import { getTeamMembers, getRolePermissions } from '@/app/actions/super-admin'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const [members, rolePermissions] = await Promise.all([
    getTeamMembers(),
    getRolePermissions(),
  ])

  // Never forward raw DB rows (e.g. password_hash) to the client bundle
  const team = members.map((m: any) => ({
    id: m.id,
    full_name: m.full_name,
    email: m.email,
    role: m.role,
    department: m.department ?? null,
    status: m.status,
    last_login_at: m.last_login_at ?? null,
    created_at: m.created_at,
  }))

  return <TeamClient team={team} rolePermissions={rolePermissions} />
}
