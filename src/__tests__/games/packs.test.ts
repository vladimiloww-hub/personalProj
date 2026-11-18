import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as daily } from '@/app/api/games/connections/route'
import { GET as listPacks, POST as createPack } from '@/app/api/games/connections/packs/route'
import { GET as readPack, PUT as updatePack, DELETE as deletePack } from '@/app/api/games/connections/packs/[id]/route'
import { GET as packPuzzle } from '@/app/api/games/connections/packs/[id]/[n]/route'
import { GET as readSchedule, POST as plan, DELETE as unplan } from '@/app/api/games/connections/schedule/route'
import { addDays, packToText, parsePackJson, parsePackText, puzzleProblems, type ConnPuzzle } from '@/app/games/lib/connections'
import { builtinFor } from '@/lib/games/connections'
import { firstOpenDate } from '@/lib/games/connections/packs'

const session = vi.hoisted(() => ({ isAdmin: false }))
vi.mock('@/lib/session', () => ({ getSession: vi.fn(async () => session) }))

const req = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
const ctx = <T extends object>(params: T) => ({ params: Promise.resolve(params) })

const puzzle = (tag: string) => ({
  groups: [
    { title: 'Ягоды', words: ['малина', 'брусника', 'клюква', `черника${tag}`] },
    { title: 'Города', words: ['казань', 'саратов', 'тверь', 'ярославль'] },
    { title: 'Богини', words: ['диана', 'юнона', 'минерва', 'венера'] },
    { title: 'Лада', words: ['калина', 'нива', 'веста', 'самара'] },
  ],
})

beforeEach(() => {
  session.isAdmin = false
})

describe('pack text and json', () => {
  it('reads the hand-written format and writes it back', () => {
    const text = `# Свой набор\n\nЯгоды: малина, брусника, клюква, черника\nГорода: казань; саратов, тверь, ярославль\nБогини: диана, юнона, минерва, венера\nЛада: калина, нива, веста, самара\n`
    const parsed = parsePackText(text)
    expect(parsed.errors).toEqual([])
    expect(parsed.title).toBe('Свой набор')
    expect(parsed.puzzles[0].groups[1].words).toEqual(['КАЗАНЬ', 'САРАТОВ', 'ТВЕРЬ', 'ЯРОСЛАВЛЬ'])
    expect(parsePackText(packToText('Свой набор', parsed.puzzles))).toEqual(parsed)
  })

  it('explains what is wrong', () => {
    const { puzzles, errors } = parsePackText('Ягоды: малина, брусника, клюква\nГорода казань\n\nА: а, б, в, г\nБ: д, е, ж, з\nВ: и, й, к, л\nГ: м, н, о, а')
    expect(puzzles).toEqual([])
    expect(errors[0]).toMatch(/нужно 4 строки/)
    expect(errors[1]).toMatch(/«А» встречается 2 раза/)
    expect(puzzleProblems({ groups: puzzle('').groups.slice(0, 3) })).toEqual(['Нужно ровно 4 группы'])
    expect(parsePackJson('{"title":"x","puzzles":[{"groups":[]}]}').errors[0]).toMatch(/Нужно ровно 4 группы/)
    expect(parsePackJson('nope').errors).toEqual(['Это не JSON'])
  })
})

describe('packs API', () => {
  it('lets only the admin change packs', async () => {
    expect((await createPack(req('/api/games/connections/packs', 'POST', { title: 'x' }))).status).toBe(403)
    expect((await listPacks(req('/api/games/connections/packs?all=1'))).status).toBe(403)
  })

  it('creates, lists, edits and deletes a pack', async () => {
    session.isAdmin = true
    const bad = await createPack(req('/api/games/connections/packs', 'POST', { title: 'Плохой', puzzles: [{ groups: [] }] }))
    expect(bad.status).toBe(400)

    const res = await createPack(req('/api/games/connections/packs', 'POST', { title: '  Наш  набор ', puzzles: [puzzle('')], listed: false }))
    expect(res.status).toBe(201)
    const { pack } = await res.json()
    expect(pack.title).toBe('Наш набор')

    session.isAdmin = false
    let listed = (await (await listPacks(req('/api/games/connections/packs'))).json()).packs
    expect(listed.find((p: { id: string }) => p.id === pack.id)).toBeUndefined()
    const summary = await (await readPack(req(''), ctx({ id: pack.id }))).json()
    expect(summary).toMatchObject({ title: 'Наш набор', total: 1, available: [1] })
    expect(JSON.stringify(summary)).not.toContain('МАЛИНА')

    session.isAdmin = true
    const edited = await updatePack(req('', 'PUT', { title: 'Наш набор', listed: true, puzzles: [puzzle(''), puzzle('2')] }), ctx({ id: pack.id }))
    expect((await edited.json()).pack.puzzles).toHaveLength(2)
    listed = (await (await listPacks(req('/api/games/connections/packs'))).json()).packs
    expect(listed.find((p: { id: string }) => p.id === pack.id)).toMatchObject({ total: 2 })

    const p2: ConnPuzzle = await (await packPuzzle(req(''), ctx({ id: pack.id, n: '2' }))).json()
    expect(p2.pack).toMatchObject({ id: pack.id, total: 2 })
    expect(p2.groups[0].words).toContain('ЧЕРНИКА2')
    expect((await packPuzzle(req(''), ctx({ id: pack.id, n: '3' }))).status).toBe(404)

    expect((await deletePack(req('', 'DELETE'), ctx({ id: pack.id }))).status).toBe(200)
    expect((await readPack(req(''), ctx({ id: pack.id }))).status).toBe(404)
  })
})

describe('daily schedule', () => {
  it('puts pack puzzles on future days and hides them until then', async () => {
    session.isAdmin = true
    const { pack } = await (await createPack(req('/api/games/connections/packs', 'POST', { title: 'В ленту', puzzles: [puzzle('a'), puzzle('b')] }))).json()
    const open = firstOpenDate()

    const early = await plan(req('/api/games/connections/schedule', 'POST', { packId: pack.id, from: addDays(open, -1), indices: [0, 1] }))
    expect(early.status).toBe(400)

    // Take the first open day by hand, so the pack has to skip it.
    const other = await (await createPack(req('/api/games/connections/packs', 'POST', { title: 'Другой', puzzles: [puzzle('c')] }))).json()
    await plan(req('/api/games/connections/schedule', 'POST', { packId: other.pack.id, from: open, indices: [0] }))
    const res = await plan(req('/api/games/connections/schedule', 'POST', { packId: pack.id, from: open, indices: [0, 1] }))
    const { added } = await res.json()
    expect(added).toEqual([addDays(open, 1), addDays(open, 2)])
    expect((await plan(req('/api/games/connections/schedule', 'POST', { packId: pack.id, from: open, indices: [0, 1] }))).status).toBe(400)

    // The daily feed shows the custom puzzles on their days…
    const day: ConnPuzzle = await (await daily(req(`/api/games/connections?date=${added[1]}`))).json()
    expect(day.groups[0].words).toContain('ЧЕРНИКАB')
    // …and the built-in bank carries on afterwards without losing a puzzle.
    const after: ConnPuzzle = await (await daily(req(`/api/games/connections?date=${addDays(open, 3)}`))).json()
    expect(after.groups).toEqual(builtinFor(addDays(open, 3), 3).groups)

    // Until their day they're hidden in the pack.
    session.isAdmin = false
    expect((await (await readPack(req(''), ctx({ id: pack.id }))).json()).available).toEqual([])
    expect((await packPuzzle(req(''), ctx({ id: pack.id, n: '1' }))).status).toBe(404)

    session.isAdmin = true
    const schedule = await (await readSchedule()).json()
    expect(schedule.firstOpen).toBe(open)
    expect(schedule.days.map((d: { date: string }) => d.date)).toEqual([open, ...added])
    expect((await unplan(req(`/api/games/connections/schedule?date=${addDays(open, -1)}`, 'DELETE'))).status).toBe(400)
    expect((await unplan(req(`/api/games/connections/schedule?date=${added[0]}`, 'DELETE'))).status).toBe(200)

    // Deleting a pack frees its days still to come.
    await deletePack(req('', 'DELETE'), ctx({ id: pack.id }))
    const left = await (await readSchedule()).json()
    expect(left.days.map((d: { date: string }) => d.date)).toEqual([open])
  })
})
