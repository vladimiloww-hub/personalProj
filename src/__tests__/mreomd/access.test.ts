import { NextRequest } from 'next/server'
import { ACCESS_COOKIE, accessToken, hasAccess, isAccessKey } from '@/lib/mreomdAccess'
import { proxy } from '@/proxy'

describe('/mreomd secret-link access', () => {
  const saved = process.env.MREOMD_ACCESS_KEY
  afterEach(() => {
    process.env.MREOMD_ACCESS_KEY = saved
  })

  it('denies everyone when no key is configured', () => {
    delete process.env.MREOMD_ACCESS_KEY
    expect(isAccessKey('anything')).toBe(false)
    expect(hasAccess(accessToken(''))).toBe(false)
    expect(proxy(new NextRequest('https://x.test/mreomd?k=')).status).toBe(404)
  })

  it('returns 404 without the link or cookie', () => {
    process.env.MREOMD_ACCESS_KEY = 'secret123'
    expect(proxy(new NextRequest('https://x.test/mreomd')).status).toBe(404)
    expect(proxy(new NextRequest('https://x.test/mreomd?k=wrong')).status).toBe(404)
    expect(proxy(new NextRequest('https://x.test/api/mreomd/prize')).status).toBe(404)
  })

  it('sets the cookie from the link and strips the key from the URL', () => {
    process.env.MREOMD_ACCESS_KEY = 'secret123'
    const res = proxy(new NextRequest('https://x.test/mreomd/practice?k=secret123&mode=random'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://x.test/mreomd/practice?mode=random')
    expect(res.cookies.get(ACCESS_COOKIE)?.value).toBe(accessToken('secret123'))
    expect(res.cookies.get(ACCESS_COOKIE)?.httpOnly).toBe(true)
  })

  it('lets the cookie through', () => {
    process.env.MREOMD_ACCESS_KEY = 'secret123'
    const req = new NextRequest('https://x.test/mreomd', {
      headers: { cookie: `${ACCESS_COOKIE}=${accessToken('secret123')}` },
    })
    const res = proxy(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('x-middleware-next')).toBe('1')
    expect(res.headers.get('x-robots-tag')).toContain('noindex')
  })
})
