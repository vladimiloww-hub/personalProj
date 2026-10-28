import type { NextRequest } from 'next/server'
import { startGame, viewFor } from '@/app/games/lib/online/rules'
import { normalizeCode } from '@/app/games/lib/online/types'
import { DEFAULT_NAMES, cleanName } from '@/app/games/lib/names'
import { body, fail, json, notConfigured, tokenOf } from '@/lib/games/http'
import { getRoomStore, mutateRoom, newToken, seatOf } from '@/lib/games/rooms'

/** Takes the free seat and starts the game; rejoining with your token is a no-op. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const store = getRoomStore()
  if (!store) return notConfigured()

  const code = normalizeCode((await params).code)
  const name = cleanName((await body(req)).name, DEFAULT_NAMES[1])
  const given = tokenOf(req)
  const fresh = newToken()

  const result = await mutateRoom(store, code, async (room) => {
    if (seatOf(room, given) !== null) return room
    if (room.players[1]) return 'В этой комнате уже двое'
    return startGame({ ...room, players: [room.players[0], { name, token: fresh }] })
  })
  if (!result.ok) return fail(result.error, result.status)

  const token = seatOf(result.room, given) !== null ? given : fresh
  const seat = seatOf(result.room, token)
  return json({ token, room: viewFor(result.room, result.version, seat) })
}
