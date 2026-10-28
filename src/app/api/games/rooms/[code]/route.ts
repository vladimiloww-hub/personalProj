import type { NextRequest } from 'next/server'
import { viewFor } from '@/app/games/lib/online/rules'
import { normalizeCode } from '@/app/games/lib/online/types'
import { fail, json, notConfigured, tokenOf } from '@/lib/games/http'
import { getRoomStore, seatOf } from '@/lib/games/rooms'

/** The room as the requesting player (or a visitor) is allowed to see it. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const store = getRoomStore()
  if (!store) return notConfigured()

  const stored = await store.get(normalizeCode((await params).code))
  if (!stored) return fail('Комната не найдена', 404)
  return json({ room: viewFor(stored.room, stored.version, seatOf(stored.room, tokenOf(req))) })
}
