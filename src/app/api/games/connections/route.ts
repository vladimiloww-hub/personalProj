import { NextResponse, type NextRequest } from 'next/server'
import { isDateKey } from '@/app/games/lib/connections'
import { LAUNCH_DATE, latestDate, puzzleFor } from '@/lib/games/connections'

/** One day's «Связи». Future days stay hidden (except in development, for testing). */
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? ''
  if (!isDateKey(date)) return NextResponse.json({ error: 'Непонятная дата' }, { status: 400 })
  if (date < LAUNCH_DATE) return NextResponse.json({ error: 'Тогда «Связей» ещё не было' }, { status: 404 })
  if (process.env.NODE_ENV === 'production' && date > latestDate()) {
    return NextResponse.json({ error: 'Эта головоломка ещё не вышла' }, { status: 404 })
  }
  return NextResponse.json(puzzleFor(date), { headers: { 'Cache-Control': 'public, max-age=600' } })
}
