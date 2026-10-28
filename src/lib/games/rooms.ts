import { createClient } from '@supabase/supabase-js'
import { randomBytes, randomUUID } from 'crypto'
import { CODE_ALPHABET, CODE_LENGTH, roomTopic, type Room } from '@/app/games/lib/online/types'
import type { Seat } from '@/app/games/lib/turns'

/**
 * Storage for online game rooms: a Supabase table in production, a plain
 * in-process map in development so the games can be tried without one.
 * See supabase/games.sql for the table.
 */

export interface StoredRoom {
  room: Room
  version: number
}

export interface RoomStore {
  get(code: string): Promise<StoredRoom | null>
  /** False when the code is already taken. */
  insert(room: Room): Promise<boolean>
  /** False when somebody changed the room after `version` was read. */
  update(room: Room, version: number): Promise<boolean>
  /** Tells everyone in the room to fetch it again. */
  notify(code: string, version: number): Promise<void>
}

const TABLE = 'game_rooms'
/** Rooms untouched for this long are deleted when new ones are made. */
const KEEP_MS = 14 * 24 * 60 * 60 * 1000

function supabaseStore(url: string, key: string): RoomStore {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return {
    async get(code) {
      const { data, error } = await db.from(TABLE).select('data, version').eq('code', code).maybeSingle()
      if (error) throw new Error(error.message)
      return data ? { room: data.data as Room, version: data.version as number } : null
    },
    async insert(room) {
      const { error } = await db.from(TABLE).insert({ code: room.code, game: room.game, data: room, version: 1 })
      if (error?.code === '23505') return false
      if (error) throw new Error(error.message)
      await db.from(TABLE).delete().lt('updated_at', new Date(Date.now() - KEEP_MS).toISOString())
      return true
    },
    async update(room, version) {
      const { data, error } = await db
        .from(TABLE)
        .update({ data: room, version: version + 1, updated_at: new Date().toISOString() })
        .eq('code', room.code)
        .eq('version', version)
        .select('code')
      if (error) throw new Error(error.message)
      return data.length === 1
    },
    async notify(code, version) {
      const channel = db.channel(roomTopic(code))
      try {
        const res = await channel.httpSend('update', { version })
        if (!res.success) console.error('games: realtime ping failed', res.status, res.error)
      } finally {
        await db.removeChannel(channel)
      }
    },
  }
}

function memoryStore(): RoomStore {
  const g = globalThis as unknown as { __gameRooms?: Map<string, StoredRoom> }
  const rooms = (g.__gameRooms ??= new Map())
  return {
    async get(code) {
      const stored = rooms.get(code)
      return stored ? structuredClone(stored) : null
    },
    async insert(room) {
      if (rooms.has(room.code)) return false
      rooms.set(room.code, { room: structuredClone(room), version: 1 })
      return true
    },
    async update(room, version) {
      if (rooms.get(room.code)?.version !== version) return false
      rooms.set(room.code, { room: structuredClone(room), version: version + 1 })
      return true
    },
    // Pages fall back to polling when there is no realtime channel.
    async notify() {},
  }
}

let cached: RoomStore | null | undefined

/** The configured store, or null in production without Supabase. */
export function getRoomStore(): RoomStore | null {
  if (cached !== undefined) return cached
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  cached = url && key ? supabaseStore(url, key) : process.env.NODE_ENV === 'production' ? null : memoryStore()
  return cached
}

export function newRoomCode(): string {
  return Array.from(randomBytes(CODE_LENGTH), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

export const newToken = () => randomUUID()

export function seatOf(room: Room, token: string | null): Seat | null {
  if (!token) return null
  if (room.players[0]?.token === token) return 0
  if (room.players[1]?.token === token) return 1
  return null
}

export type Mutation = { ok: true; room: Room; version: number } | { ok: false; error: string; status: number }

/**
 * Reads the room, applies `change` and writes it back, retrying when the
 * other player's move landed in between. `change` returns a refusal message
 * or the same room object when there is nothing to save.
 */
export async function mutateRoom(
  store: RoomStore,
  code: string,
  change: (room: Room) => Promise<Room | string>,
): Promise<Mutation> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await store.get(code)
    if (!current) return { ok: false, error: 'Комната не найдена', status: 404 }
    const next = await change(current.room)
    if (typeof next === 'string') return { ok: false, error: next, status: 400 }
    if (next === current.room) return { ok: true, ...current }
    if (await store.update(next, current.version)) {
      try {
        await store.notify(code, current.version + 1)
      } catch (err) {
        // The move is saved; the other player will catch up on their next poll.
        console.error('games: realtime ping failed', err)
      }
      return { ok: true, room: next, version: current.version + 1 }
    }
  }
  return { ok: false, error: 'Слишком много ходов сразу — попробуй ещё раз', status: 409 }
}
