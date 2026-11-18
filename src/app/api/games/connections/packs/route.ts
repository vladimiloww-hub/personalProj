import { NextResponse, type NextRequest } from 'next/server'
import { bad, forbidden, isAdmin, noStore } from '@/lib/games/admin'
import { newPackId, packFields, summary } from '@/lib/games/connections/packs'
import { getConnectionsStore } from '@/lib/games/connections/store'

/** Public: the listed packs. Admin with ?all=1: every pack in full. */
export async function GET(req: NextRequest) {
  const store = getConnectionsStore()
  const all = req.nextUrl.searchParams.get('all') === '1'
  if (all && !(await isAdmin())) return forbidden()
  if (!store) return all ? noStore() : NextResponse.json({ packs: [] })
  try {
    const [packs, days] = await Promise.all([store.listPacks(), store.listDays()])
    if (all) return NextResponse.json({ packs }, { headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ packs: packs.filter((p) => p.listed).map((p) => summary(p, days)) })
  } catch (err) {
    console.error('connections: packs unavailable', err)
    return all ? bad('Таблицы паков не найдены — выполни supabase/games.sql', 503) : NextResponse.json({ packs: [] })
  }
}

/** Admin: a new pack. */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return forbidden()
  const store = getConnectionsStore()
  if (!store) return noStore()
  const fields = packFields(await req.json().catch(() => null))
  if (typeof fields === 'string') return bad(fields)
  const now = new Date().toISOString()
  const pack = { id: newPackId(), ...fields, createdAt: now, updatedAt: now }
  await store.savePack(pack)
  return NextResponse.json({ pack }, { status: 201 })
}
