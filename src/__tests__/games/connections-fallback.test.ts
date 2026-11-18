import { it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as daily } from '@/app/api/games/connections/route'
import { GET as listPacks } from '@/app/api/games/connections/packs/route'
import { LAUNCH_DATE } from '@/app/games/lib/connections'
import { builtinFor } from '@/lib/games/connections'

// Supabase is configured but the pack tables haven't been created yet.
vi.mock('@/lib/games/connections/store', () => {
  const missing = async () => {
    throw new Error('relation "public.connections_days" does not exist')
  }
  return { getConnectionsStore: () => ({ listDays: missing, listPacks: missing }) }
})
vi.spyOn(console, 'error').mockImplementation(() => {})

it('keeps serving the built-in daily puzzle', async () => {
  const res = await daily(new NextRequest(`http://localhost/api/games/connections?date=${LAUNCH_DATE}`))
  expect(res.status).toBe(200)
  expect((await res.json()).groups).toEqual(builtinFor(LAUNCH_DATE).groups)
})

it('shows an empty list of packs', async () => {
  const res = await listPacks(new NextRequest('http://localhost/api/games/connections/packs'))
  expect(await res.json()).toEqual({ packs: [] })
})
