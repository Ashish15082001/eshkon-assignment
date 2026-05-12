import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-replace-in-production'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: SECRET })
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/studio')) {
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/api/auth/signin'
      url.searchParams.set('callbackUrl', req.nextUrl.href)
      return NextResponse.redirect(url)
    }
    if (token.role === 'viewer') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (pathname.startsWith('/api/publish')) {
    if (!token || token.role !== 'publisher') {
      return NextResponse.json({ error: 'Forbidden: publisher role required' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*', '/api/publish/:path*'],
}
