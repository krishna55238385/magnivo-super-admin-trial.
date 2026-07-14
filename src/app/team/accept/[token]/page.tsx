import { getTeamInviteDetails } from '@/app/actions/super-admin'
import AcceptInviteClient from './AcceptInviteClient'

const ERROR_COPY: Record<string, string> = {
  invalid: 'This invite link is invalid.',
  used: 'This invite has already been used.',
  expired: 'This invite link has expired. Ask an admin to send a new one.',
}

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await getTeamInviteDetails(token)

  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
        <div className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0d0d14] p-6 text-center">
          <p className="text-[13px] text-white/60">{ERROR_COPY[result.error]}</p>
        </div>
      </div>
    )
  }

  return (
    <AcceptInviteClient
      token={token}
      email={result.member.email}
      fullName={result.member.full_name}
      role={result.member.role}
    />
  )
}
