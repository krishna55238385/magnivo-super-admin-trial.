import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/sign-in',
  '/login',
  '/api/auth/sign-in',
  '/api/engage/gmail/webhook',
  '/api/track/',
  '/api/engage/worker',
  '/api/super-admin/auth/',
  '/landing',
]

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r))
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Super admin routes have their own auth boundary — a valid JWT cookie,
  // independent of the app's sb-mock-auth / bypass flow.
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/super-admin')) {
    if (isPublicRoute(pathname)) return NextResponse.next()

    const hasSuperAdminToken = !!req.cookies.get('magnivo_super_token')?.value
    if (!hasSuperAdminToken) {
      const login = new URL('/login', req.url)
      login.searchParams.set('redirect', pathname)
      return NextResponse.redirect(login)
    }

    return NextResponse.next()
  }

  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return NextResponse.next()

  const isAuthed = req.cookies.get('sb-mock-auth')?.value === 'true'

  if (!isAuthed && !isPublicRoute(pathname)) {
    const signIn = new URL('/sign-in', req.url)
    signIn.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
