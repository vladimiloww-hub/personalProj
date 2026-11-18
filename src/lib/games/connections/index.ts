import { buildPuzzle, dayNumber, type ConnPuzzle } from '@/app/games/lib/connections'
import { PUZZLES, type PuzzleData } from './puzzles'
import { getConnectionsStore, type ScheduledDay } from './store'

export { LAUNCH_DATE } from '@/app/games/lib/connections'

export const toSpec = (data: PuzzleData) => ({
  groups: data.map(([title, words]) => ({ title, words: words.split(' ') })),
})

/**
 * The built-in puzzle for a date when no custom one is scheduled. Days given
 * to custom puzzles don't use up built-in ones, so the bank keeps its order
 * (only future dates can be scheduled, so past days never change).
 */
export function builtinFor(date: string, scheduledBefore = 0): ConnPuzzle {
  const number = dayNumber(date)
  const index = (number - 1 - scheduledBefore) % PUZZLES.length
  return buildPuzzle(toSpec(PUZZLES[index]), number, date, number * 7919)
}

export function puzzleOn(date: string, schedule: ScheduledDay[]): ConnPuzzle {
  const custom = schedule.find((d) => d.date === date)
  if (custom) return buildPuzzle(custom.puzzle, dayNumber(date), date, dayNumber(date) * 7919)
  return builtinFor(date, schedule.filter((d) => d.date < date).length)
}

/** The custom days, or none when the store is missing or its tables aren't set up yet. */
export async function scheduledDays(): Promise<ScheduledDay[]> {
  const store = getConnectionsStore()
  if (!store) return []
  try {
    return await store.listDays()
  } catch (err) {
    // The daily puzzle must not break over a missing table: fall back to the built-in bank.
    console.error('connections: schedule unavailable', err)
    return []
  }
}

/** The puzzle for a date (on or after launch), custom schedule included. */
export async function puzzleFor(date: string): Promise<ConnPuzzle> {
  return puzzleOn(date, await scheduledDays())
}

/** The latest date anyone on Earth can have right now (UTC+14). */
export function latestDate(now = new Date()): string {
  return new Date(now.getTime() + 14 * 3_600_000).toISOString().slice(0, 10)
}
