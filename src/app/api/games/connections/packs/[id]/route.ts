import { NextResponse, type NextRequest } from 'next/server'
import { bad, forbidden, isAdmin, noStore } from '@/lib/games/admin'
import { firstOpenDate, packFields, summary } from '@/lib/games/connections/packs'
import { getConnectionsStore } from '@/lib/games/connections/store'

type Ctx = { params: Promise<{ id: string }> }

/** Public: what the pack page needs (no answers). */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const store = getConnectionsStore()
  if (!store) return noStore()
  const [pack, days] = await Promise.all([store.getPack((await params).id), store.listDays()])
  if (!pack) return bad('Пак не найден', 404)
  return NextResponse.json(summary(pack, days), { headers: { 'Cache-Control': 'no-store' } })
}

/** Admin: replace the pack's title, description, visibility and puzzles. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const pack = await store.getPack((await params).id)
  if (!pack) return bad('Пак не найден', 404)
  const fields = packFields(await req.json().catch(() => null))
  if (typeof fields === 'string') return bad(fields)
  const next = { ...pack, ...fields, updatedAt: new Date().toISOString() }
  await store.savePack(next)
  return NextResponse.json({ pack: next })
}

/** Admin: delete the pack; its days still to come go back to the built-in puzzles. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const id = (await params).id
  const open = firstOpenDate()
  const days = await store.listDays()
  await store.deleteDays(days.filter((d) => d.packId === id && d.date >= open).map((d) => d.date))
  await store.deletePack(id)
  return NextResponse.json({ ok: true })
}
