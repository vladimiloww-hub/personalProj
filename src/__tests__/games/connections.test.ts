import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/games/connections/route'
import {
  LAUNCH_DATE,
  addDays,
  dayNumber,
  emojiRows,
  isDateKey,
  judge,
  replay,
  type ConnPuzzle,
} from '@/app/games/lib/connections'
import { builtinFor, latestDate } from '@/lib/games/connections'
import { PUZZLES } from '@/lib/games/connections/puzzles'

describe('puzzle bank', () => {
  it('has sixty well-formed puzzles', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(60)
    const seen = new Set<string>()
    PUZZLES.forEach((puzzle, i) => {
      const words = puzzle.flatMap(([title, list]) => {
        expect(title.trim(), `#${i + 1}`).not.toBe('')
        const ws = list.split(' ')
        expect(ws, `#${i + 1} ${title}`).toHaveLength(4)
        return ws
      })
      expect(new Set(words).size, `#${i + 1}`).toBe(16)
      for (const w of words) expect(w, `#${i + 1}`).toMatch(/^[А-ЯЁ]{2,12}$/)
      const key = [...words].sort().join(' ')
      expect(seen.has(key), `#${i + 1} repeats`).toBe(false)
      seen.add(key)
    })
  })
})

describe('days', () => {
  it('numbers days from launch and validates dates', () => {
    expect(dayNumber(LAUNCH_DATE)).toBe(1)
    expect(dayNumber(addDays(LAUNCH_DATE, 30))).toBe(31)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(isDateKey('2026-11-18')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('18.11.2026')).toBe(false)
  })

  it('gives everyone the same layout and goes round the bank', () => {
    const a = builtinFor(LAUNCH_DATE)
    expect(a.number).toBe(1)
    expect(a.groups.map((g) => g.level)).toEqual([0, 1, 2, 3])
    expect([...a.order].sort()).toEqual(a.groups.flatMap((g) => g.words).sort())
    expect(builtinFor(LAUNCH_DATE).order).toEqual(a.order)
    const again = builtinFor(addDays(LAUNCH_DATE, PUZZLES.length))
    expect(again.groups).toEqual(a.groups)
    expect(again.order).not.toEqual(a.order)
  })

  it('allows dates up to the earliest time zone, not beyond', () => {
    expect(latestDate(new Date('2026-11-18T09:00:00Z'))).toBe('2026-11-18')
    expect(latestDate(new Date('2026-11-18T11:00:00Z'))).toBe('2026-11-19')
  })
})

describe('guessing', () => {
  const puzzle: ConnPuzzle = builtinFor(LAUNCH_DATE)
  const [masti, chess, farm, tricky] = puzzle.groups.map((g) => g.words)

  it('tells a hit, a near miss, a miss and a repeat apart', () => {
    expect(judge(puzzle, [], masti)).toEqual({ kind: 'correct', group: puzzle.groups[0] })
    const near = [...chess.slice(0, 3), masti[0]]
    expect(judge(puzzle, [], near).kind).toBe('one-away')
    expect(judge(puzzle, [], [masti[0], masti[1], chess[0], chess[1]]).kind).toBe('wrong')
    expect(judge(puzzle, [near], [...near].reverse()).kind).toBe('repeat')
  })

  it('replays a won game, ignoring repeats', () => {
    const near = [...chess.slice(0, 3), farm[0]]
    const p = replay(puzzle, [masti, near, [...near].reverse(), chess, farm, tricky])
    expect(p).toMatchObject({ mistakes: 1, won: true, over: true })
    expect(p.solved.map((g) => g.level)).toEqual([0, 1, 2, 3])
    expect(emojiRows(puzzle, p.counted).split('\n')).toEqual(['🟨🟨🟨🟨', '🟩🟩🟩🟦', '🟩🟩🟩🟩', '🟦🟦🟦🟦', '🟪🟪🟪🟪'])
  })

  it('ends after four mistakes', () => {
    const misses = [0, 1, 2, 3].map((i) => [masti[i], chess[i], farm[i], tricky[i]])
    const p = replay(puzzle, [...misses, masti])
    expect(p).toMatchObject({ mistakes: 4, won: false, over: true, solved: [] })
  })
})

describe('GET /api/games/connections', () => {
  afterEach(() => vi.unstubAllEnvs())
  const get = (date: string) => GET(new NextRequest(`http://localhost/api/games/connections?date=${date}`))

  it('serves a day', async () => {
    const res = await get(LAUNCH_DATE)
    expect(res.status).toBe(200)
    expect(((await res.json()) as ConnPuzzle).number).toBe(1)
  })

  it('refuses bad, early and (in production) future dates', async () => {
    expect((await get('nope')).status).toBe(400)
    expect((await get('2026-11-17')).status).toBe(404)
    vi.stubEnv('NODE_ENV', 'production')
    expect((await get('2099-01-01')).status).toBe(404)
  })
})
