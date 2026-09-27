import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * /mreomd is reachable only through a secret link: /mreomd?k=<MREOMD_ACCESS_KEY>.
 * Opening it stores a cookie holding a hash of the key; without it every /mreomd page,
 * asset and API answers 404. With no key configured nobody gets in.
 */
export const ACCESS_COOKIE = 'mreomd_access'
export const ACCESS_PARAM = 'k'
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 365

export function accessToken(key: string) {
  return createHash('sha256').update(`mreomd:${key}`).digest('hex')
}

function same(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function isAccessKey(given: string | null | undefined) {
  const key = process.env.MREOMD_ACCESS_KEY
  return Boolean(key && given && same(given, key))
}

export function hasAccess(cookieValue: string | undefined) {
  const key = process.env.MREOMD_ACCESS_KEY
  return Boolean(key && cookieValue && same(cookieValue, accessToken(key)))
}
