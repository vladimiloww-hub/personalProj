import { NextResponse, type NextRequest } from 'next/server'
import { ACCESS_COOKIE, ACCESS_MAX_AGE, ACCESS_PARAM, accessToken, hasAccess, isAccessKey } from './lib/mreomdAccess'

const PRIVATE_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'no-referrer',
}

export function proxy(request: NextRequest) {
  const given = request.nextUrl.searchParams.get(ACCESS_PARAM)
  if (given !== null && isAccessKey(given)) {
    const url = request.nextUrl.clone()
    url.searchParams.delete(ACCESS_PARAM)
    const res = NextResponse.redirect(url)
    res.cookies.set(ACCESS_COOKIE, accessToken(given), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_MAX_AGE,
    })
    for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v)
    return res
  }

  if (hasAccess(request.cookies.get(ACCESS_COOKIE)?.value)) {
    const res = NextResponse.next()
    for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v)
    return res
  }

  return new NextResponse('Not found', { status: 404, headers: PRIVATE_HEADERS })
}

export const config = {
  matcher: ['/mreomd', '/mreomd/:path*', '/api/mreomd/:path*'],
}
