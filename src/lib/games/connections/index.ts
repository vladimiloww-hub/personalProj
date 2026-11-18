import { LAUNCH_DATE, dayNumber, type ConnPuzzle, type Level } from '@/app/games/lib/connections'
import { PUZZLES } from './puzzles'

/** A small seeded generator, so every player gets the same starting layout. */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The puzzle for a date (on or after launch); the bank goes round again when it runs out. */
export function puzzleFor(date: string): ConnPuzzle {
  const number = dayNumber(date)
  const data = PUZZLES[(number - 1) % PUZZLES.length]
  const groups = data.map(([title, words], level) => ({ level: level as Level, title, words: words.split(' ') }))
  const order = groups.flatMap((g) => g.words)
  const random = seeded(number * 7919)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { number, date, groups, order }
}

/** The latest date anyone on Earth can have right now (UTC+14). */
export function latestDate(now = new Date()): string {
  return new Date(now.getTime() + 14 * 3_600_000).toISOString().slice(0, 10)
}

export { LAUNCH_DATE }
