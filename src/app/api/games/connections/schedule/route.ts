import { NextResponse, type NextRequest } from 'next/server'
import { isDateKey } from '@/app/games/lib/connections'
import { isRecord } from '@/app/games/lib/sanitize'
import { bad, forbidden, isAdmin, noStore } from '@/lib/games/admin'
import { firstOpenDate, planDays } from '@/lib/games/connections/packs'
import { getConnectionsStore } from '@/lib/games/connections/store'

/** Admin: every custom day of the daily feed, and the first date still open for scheduling. */
export async function GET() {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const days = await store.listDays()
  return NextResponse.json(
    { firstOpen: firstOpenDate(), days: days.map(({ date, packId, packIndex, puzzle }) => ({ date, packId, packIndex, titles: puzzle.groups.map((g) => g.title) })) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

/** Admin: put puzzles of a pack into the daily feed, one per free day from `from` on. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const body = await req.json().catch(() => null)
  if (!isRecord(body) || typeof body.packId !== 'string' || typeof body.from !== 'string' || !Array.isArray(body.indices)) {
    return bad('Непонятный запрос')
  }
  const open = firstOpenDate()
  if (!isDateKey(body.from) || body.from < open) return bad(`Можно ставить только с ${open}: более ранние дни уже открыты`)
  const pack = await store.getPack(body.packId)
  if (!pack) return bad('Пак не найден', 404)
  const days = await store.listDays()
  const already = new Set(days.filter((d) => d.packId === pack.id && d.date >= open).map((d) => d.packIndex))
  const indices = [...new Set(body.indices)].filter(
    (i): i is number => Number.isInteger(i) && i >= 0 && i < pack.puzzles.length && !already.has(i as number),
  )
  if (!indices.length) return bad('Нечего ставить: эти головоломки уже в расписании')
  const planned = planDays(pack, indices.sort((a, b) => a - b), body.from, new Set(days.map((d) => d.date)))
  await store.addDays(planned)
  return NextResponse.json({ added: planned.map((d) => d.date) })
}

/** Admin: take a day that hasn't come yet back from the custom schedule. */
export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const date = req.nextUrl.searchParams.get('date') ?? ''
  if (!isDateKey(date) || date < firstOpenDate()) return bad('Этот день уже открыт — убрать его нельзя')
  await store.deleteDays([date])
  return NextResponse.json({ ok: true })
}
