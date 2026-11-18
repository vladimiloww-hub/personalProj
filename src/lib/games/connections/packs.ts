import { randomBytes } from 'crypto'
import {
  PACK_PUZZLES_MAX,
  PACK_TITLE_MAX,
  addDays,
  buildPuzzle,
  cleanSpec,
  puzzleProblems,
  type ConnPuzzle,
  type PuzzleSpec,
} from '@/app/games/lib/connections'
import { isRecord } from '@/app/games/lib/sanitize'
import { latestDate } from '.'
import type { Pack, ScheduledDay } from './store'

export const newPackId = () => randomBytes(6).toString('base64url')

/** The first date that can still be given to a custom puzzle: nobody has reached it yet. */
export const firstOpenDate = (now = new Date()) => addDays(latestDate(now), 1)

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '')

/** Validates an edit to a pack; a string is the reason it was refused. */
export function packFields(raw: unknown): Pick<Pack, 'title' | 'author' | 'description' | 'listed' | 'puzzles'> | string {
  if (!isRecord(raw)) return 'Непонятные данные'
  const title = text(raw.title, PACK_TITLE_MAX)
  if (!title) return 'У пака должно быть название'
  const list = raw.puzzles ?? []
  if (!Array.isArray(list)) return 'Непонятный список головоломок'
  if (list.length > PACK_PUZZLES_MAX) return `Не больше ${PACK_PUZZLES_MAX} головоломок в паке`
  const puzzles: PuzzleSpec[] = []
  for (const [i, item] of list.entries()) {
    const groups = isRecord(item) ? item.groups : null
    const ok =
      Array.isArray(groups) &&
      groups.every((g) => isRecord(g) && typeof g.title === 'string' && Array.isArray(g.words) && g.words.every((w) => typeof w === 'string'))
    if (!ok) return `Головоломка ${i + 1}: непонятный формат`
    const spec = cleanSpec({ groups: groups as PuzzleSpec['groups'] })
    const problems = puzzleProblems(spec)
    if (problems.length) return `Головоломка ${i + 1}: ${problems.join('; ')}`
    puzzles.push(spec)
  }
  return {
    title,
    author: text(raw.author, 40),
    description: text(raw.description, 300),
    listed: raw.listed === true,
    puzzles,
  }
}

/** Indices of a pack's puzzles waiting for their day in the daily feed: hidden on the pack page until then. */
export function upcomingIndices(packId: string, days: ScheduledDay[], now = new Date()): Set<number> {
  const live = latestDate(now)
  return new Set(days.filter((d) => d.packId === packId && d.date > live).map((d) => d.packIndex))
}

export interface PackSummary {
  id: string
  title: string
  author: string
  description: string
  total: number
  /** 1-based numbers of the puzzles that can be played now. */
  available: number[]
}

export function summary(pack: Pack, days: ScheduledDay[]): PackSummary {
  const hidden = upcomingIndices(pack.id, days)
  return {
    id: pack.id,
    title: pack.title,
    author: pack.author,
    description: pack.description,
    total: pack.puzzles.length,
    available: pack.puzzles.map((_, i) => i).filter((i) => !hidden.has(i)).map((i) => i + 1),
  }
}

function hash(s: string): number {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function packPuzzle(pack: Pack, number: number): ConnPuzzle {
  return {
    ...buildPuzzle(pack.puzzles[number - 1], number, '', hash(pack.id) + number),
    pack: { id: pack.id, title: pack.title, total: pack.puzzles.length },
  }
}

/** Gives `indices` of a pack the free days from `from` on, in order. */
export function planDays(pack: Pack, indices: number[], from: string, taken: Set<string>): ScheduledDay[] {
  const planned: ScheduledDay[] = []
  let date = from
  for (const packIndex of indices) {
    while (taken.has(date)) date = addDays(date, 1)
    planned.push({ date, packId: pack.id, packIndex, puzzle: pack.puzzles[packIndex] })
    taken.add(date)
  }
  return planned
}
