import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function LoginPage() {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') redirect('/home')
    const cookieStore = await cookies()
    if (cookieStore.get('sb-mock-auth')?.value === 'true') redirect('/home')
    redirect('/sign-in')
}
