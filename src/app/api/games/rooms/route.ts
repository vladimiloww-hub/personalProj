import type { NextRequest } from 'next/server'
import { parseRoomData, viewFor } from '@/app/games/lib/online/rules'
import type { Room } from '@/app/games/lib/online/types'
import { DEFAULT_NAMES, cleanName } from '@/app/games/lib/names'
import { body, fail, json, notConfigured } from '@/lib/games/http'
import { getRoomStore, newRoomCode, newToken } from '@/lib/games/rooms'

/** Creates a room; the creator takes seat 0 and waits for someone to join. */
export async function POST(req: NextRequest) {
  const store = getRoomStore()
  if (!store) return notConfigured()

  const input = await body(req)
  const data = parseRoomData(input.game, input.settings)
  if (!data) return fail('Непонятные настройки игры', 400)

  const token = newToken()
  for (let attempt = 0; attempt < 5; attempt++) {
    const room: Room = { ...data, code: newRoomCode(), players: [{ name: cleanName(input.name, DEFAULT_NAMES[0]), token }, null] }
    if (await store.insert(room)) return json({ token, room: viewFor(room, 1, 0) }, 201)
  }
  return fail('Не получилось создать комнату — попробуй ещё раз', 500)
}
