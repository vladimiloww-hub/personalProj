import { NextResponse, type NextRequest } from 'next/server'
import { bad, noStore } from '@/lib/games/admin'
import { packPuzzle, upcomingIndices } from '@/lib/games/connections/packs'
import { getConnectionsStore } from '@/lib/games/connections/store'

/** Public: one puzzle of a pack, unless it is still waiting for its day in the daily feed. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; n: string }> }) {
  const store = getConnectionsStore()
  if (!store) return noStore()
  const { id, n } = await params
  const [pack, days] = await Promise.all([store.getPack(id), store.listDays()])
  if (!pack) return bad('Пак не найден', 404)
  const number = Number(n)
  if (!Number.isInteger(number) || number < 1 || number > pack.puzzles.length) return bad('Нет такой головоломки', 404)
  if (upcomingIndices(id, days).has(number - 1)) return bad('Эта головоломка ещё ждёт своего дня', 404)
  return NextResponse.json(packPuzzle(pack, number), { headers: { 'Cache-Control': 'no-store' } })
}
