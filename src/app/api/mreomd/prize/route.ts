import { createDecipheriv, scryptSync } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cookies } from 'next/headers'
import { ACCESS_COOKIE, hasAccess } from '@/lib/mreomdAccess'

export const dynamic = 'force-dynamic'

/**
 * The prize picture lives in the public repo only as AES-256-GCM ciphertext
 * (private/prize.enc, made by scripts/encrypt-prize.mjs). It is decrypted here with the
 * key derived from the PRIZE_KEY passphrase, and only for visitors who opened the secret
 * /mreomd link.
 */
let cachedKey: { passphrase: string; key: Buffer } | null = null

function prizeKey() {
  const passphrase = process.env.PRIZE_KEY
  if (!passphrase) return null
  if (cachedKey?.passphrase !== passphrase) {
    // Must match scripts/encrypt-prize.mjs.
    cachedKey = { passphrase, key: scryptSync(passphrase, 'mreomd-prize-v1', 32) }
  }
  return cachedKey.key
}

export async function GET() {
  const store = await cookies()
  if (!hasAccess(store.get(ACCESS_COOKIE)?.value)) return new Response('Not found', { status: 404 })

  const key = prizeKey()
  if (!key) return new Response('Not found', { status: 404 })

  let blob: Buffer
  try {
    blob = await readFile(path.join(process.cwd(), 'private', 'prize.enc'))
  } catch {
    return new Response('Not found', { status: 404 })
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, blob.subarray(0, 12))
    decipher.setAuthTag(blob.subarray(12, 28))
    const image = Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()])
    return new Response(new Uint8Array(image), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Robots-Tag': 'noindex, noimageindex',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
