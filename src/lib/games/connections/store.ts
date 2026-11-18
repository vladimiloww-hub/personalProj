import type { SupabaseClient } from '@supabase/supabase-js'
import type { PuzzleSpec } from '@/app/games/lib/connections'
import { supabaseAdmin } from '../supabase'

/**
 * Custom «Связи» packs and the days they were scheduled into the daily
 * feed. Supabase tables in production (supabase/games.sql), memory in dev.
 */

export interface Pack {
  id: string
  title: string
  author: string
  description: string
  /** Shown on the public list of packs; unlisted packs open by link only. */
  listed: boolean
  puzzles: PuzzleSpec[]
  createdAt: string
  updatedAt: string
}

/** A day of the daily feed given to a custom puzzle (a copy, so later edits don't rewrite history). */
export interface ScheduledDay {
  date: string
  packId: string
  packIndex: number
  puzzle: PuzzleSpec
}

export interface ConnectionsStore {
  listPacks(): Promise<Pack[]>
  getPack(id: string): Promise<Pack | null>
  savePack(pack: Pack): Promise<void>
  deletePack(id: string): Promise<void>
  /** Every scheduled day, oldest first. */
  listDays(): Promise<ScheduledDay[]>
  addDays(days: ScheduledDay[]): Promise<void>
  deleteDays(dates: string[]): Promise<void>
}

const PACKS = 'connections_packs'
const DAYS = 'connections_days'

function supabaseStore(db: SupabaseClient): ConnectionsStore {
  const check = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }
  return {
    async listPacks() {
      const { data, error } = await db.from(PACKS).select('data').order('created_at')
      check(error)
      return (data ?? []).map((r) => r.data as Pack)
    },
    async getPack(id) {
      const { data, error } = await db.from(PACKS).select('data').eq('id', id).maybeSingle()
      check(error)
      return data ? (data.data as Pack) : null
    },
    async savePack(pack) {
      const { error } = await db.from(PACKS).upsert({ id: pack.id, data: pack, updated_at: pack.updatedAt })
      check(error)
    },
    async deletePack(id) {
      const { error } = await db.from(PACKS).delete().eq('id', id)
      check(error)
    },
    async listDays() {
      const { data, error } = await db.from(DAYS).select('date, pack_id, pack_index, puzzle').order('date')
      check(error)
      return (data ?? []).map((r) => ({
        date: r.date as string,
        packId: r.pack_id as string,
        packIndex: r.pack_index as number,
        puzzle: r.puzzle as PuzzleSpec,
      }))
    },
    async addDays(days) {
      const rows = days.map((d) => ({ date: d.date, pack_id: d.packId, pack_index: d.packIndex, puzzle: d.puzzle }))
      const { error } = await db.from(DAYS).insert(rows)
      check(error)
    },
    async deleteDays(dates) {
      if (!dates.length) return
      const { error } = await db.from(DAYS).delete().in('date', dates)
      check(error)
    },
  }
}

function memoryStore(): ConnectionsStore {
  const g = globalThis as unknown as { __connPacks?: Map<string, Pack>; __connDays?: Map<string, ScheduledDay> }
  const packs = (g.__connPacks ??= new Map())
  const days = (g.__connDays ??= new Map())
  return {
    async listPacks() {
      return [...packs.values()].map((p) => structuredClone(p)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    },
    async getPack(id) {
      const p = packs.get(id)
      return p ? structuredClone(p) : null
    },
    async savePack(pack) {
      packs.set(pack.id, structuredClone(pack))
    },
    async deletePack(id) {
      packs.delete(id)
    },
    async listDays() {
      return [...days.values()].map((d) => structuredClone(d)).sort((a, b) => a.date.localeCompare(b.date))
    },
    async addDays(list) {
      if (list.some((d) => days.has(d.date))) throw new Error('date taken')
      list.forEach((d) => days.set(d.date, structuredClone(d)))
    },
    async deleteDays(dates) {
      dates.forEach((d) => days.delete(d))
    },
  }
}

let cached: ConnectionsStore | null | undefined

/** The configured store, or null in production without Supabase. */
export function getConnectionsStore(): ConnectionsStore | null {
  if (cached !== undefined) return cached
  const db = supabaseAdmin()
  cached = db ? supabaseStore(db) : process.env.NODE_ENV === 'production' ? null : memoryStore()
  return cached
}
