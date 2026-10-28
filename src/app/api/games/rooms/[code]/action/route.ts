import type { NextRequest } from 'next/server'
import { act, viewFor } from '@/app/games/lib/online/rules'
import { normalizeCode } from '@/app/games/lib/online/types'
import { body, fail, json, notConfigured, parseAction, tokenOf } from '@/lib/games/http'
import { getRoomStore, mutateRoom, seatOf } from '@/lib/games/rooms'

const NOT_A_PLAYER = 'Ты не участвуешь в этой игре'

/** A move by one of the two players: a secret, a guess, or "next round". */
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const store = getRoomStore()
  if (!store) return notConfigured()

  const action = parseAction((await body(req)).action)
  if (!action) return fail('Непонятный ход', 400)

  const token = tokenOf(req)
  const result = await mutateRoom(store, normalizeCode((await params).code), async (room) => {
    const seat = seatOf(room, token)
    return seat === null ? NOT_A_PLAYER : act(room, seat, action)
  })
  if (!result.ok) return fail(result.error, result.error === NOT_A_PLAYER ? 403 : result.status)
  return json({ room: viewFor(result.room, result.version, seatOf(result.room, token)) })
}
