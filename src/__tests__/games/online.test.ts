import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as create } from '@/app/api/games/rooms/route'
import { GET as read } from '@/app/api/games/rooms/[code]/route'
import { POST as join } from '@/app/api/games/rooms/[code]/join/route'
import { POST as move } from '@/app/api/games/rooms/[code]/action/route'
import { act, parseRoomData, startGame, viewFor } from '@/app/games/lib/online/rules'
import type { Room, RoomView } from '@/app/games/lib/online/types'
import { raceResult } from '@/app/games/lib/turns'

const url = (path: string) => `http://localhost/api/games/rooms${path}`
const call = (path: string, token: string | null, payload?: object) =>
  new NextRequest(url(path), {
    method: payload ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-room-token': token } : {}) },
    body: payload ? JSON.stringify(payload) : undefined,
  })
const params = (code: string) => ({ params: Promise.resolve({ code }) })

async function open(game: string, settings: object) {
  const res = await create(call('', null, { game, settings, name: 'Аня' }))
  expect(res.status).toBe(201)
  const { token, room } = (await res.json()) as { token: string; room: RoomView }
  const joined = await join(call(`/${room.code}/join`, null, { name: 'Боря' }), params(room.code))
  expect(joined.status).toBe(200)
  const guest = (await joined.json()) as { token: string; room: RoomView }
  return { code: room.code, host: token, guest: guest.token, joined: guest.room }
}

async function play(code: string, token: string | null, action: object) {
  const res = await move(call(`/${code}/action`, token, { action }), params(code))
  return { status: res.status, ...((await res.json()) as { room?: RoomView; error?: string }) }
}

describe('raceResult', () => {
  it('waits until the outcome is certain', () => {
    expect(raceResult([{ tries: 3, solved: true }, { tries: 2, solved: false }], 6)).toBeUndefined()
    expect(raceResult([{ tries: 3, solved: true }, { tries: 3, solved: false }], 6)).toBe(0)
    expect(raceResult([{ tries: 3, solved: true }, { tries: 3, solved: true }], 6)).toBeNull()
    expect(raceResult([{ tries: 6, solved: false }, { tries: 4, solved: true }], 6)).toBe(1)
    expect(raceResult([{ tries: 6, solved: false }, { tries: 6, solved: false }], 6)).toBeNull()
    expect(raceResult([{ tries: 6, solved: false }, { tries: 2, solved: false }], 6)).toBeUndefined()
  })
})

describe('online duel', () => {
  it('lets each player set a word and race for theirs', async () => {
    const { code, host, guest, joined } = await open('duel', { lang: 'ru', source: 'custom' })
    expect(joined.me).toBe(1)
    expect(joined.names).toEqual(['Аня', 'Боря'])
    expect(joined.state.phase).toBe('secret')

    // Аня's word is for Боря (seat 1) and the other way round.
    expect((await play(code, host, { type: 'secret', value: 'Весна' })).room?.state.phase).toBe('secret')
    const both = await play(code, guest, { type: 'secret', value: 'кошка' })
    expect(both.room?.state.phase).toBe('play')

    const bad = await play(code, host, { type: 'guess', value: 'ыыыыы' })
    expect(bad).toMatchObject({ status: 400, error: 'Такого слова нет в словаре' })
    expect((await play(code, null, { type: 'guess', value: 'кошка' })).status).toBe(403)

    // Боря has already spent a guess when Аня gets hers in one: he can't catch up.
    await play(code, guest, { type: 'guess', value: 'город' })
    const hostSolved = await play(code, host, { type: 'guess', value: 'кошка' })
    expect(hostSolved.room?.state).toMatchObject({ phase: 'over', winner: 0, score: [1, 0], secrets: ['кошка', 'весна'] })
  })

  it('hides the word a player is looking for until the end', async () => {
    const { code, host, guest } = await open('duel', { lang: 'ru', source: 'random' })
    const res = await read(call(`/${code}`, host), params(code))
    const { room } = (await res.json()) as { room: RoomView }
    if (room.game !== 'duel') throw new Error('wrong game')
    expect(room.me).toBe(0)
    expect(room.state.phase).toBe('play')
    expect(room.state.secrets[0]).toBeNull()
    expect(room.state.secrets[1]).toMatch(/^[а-я]{5}$/)

    const visitor = (await (await read(call(`/${code}`, null), params(code))).json()) as { room: RoomView }
    expect(visitor.room.me).toBeNull()
    expect(visitor.room.state.phase).toBe('play')
    if (visitor.room.game === 'duel') expect(visitor.room.state.secrets).toEqual([null, null])
    expect(JSON.stringify(visitor.room)).not.toContain(host)
    expect(JSON.stringify(visitor.room)).not.toContain(guest)
  })

  it('refuses a third player and lets a player rejoin', async () => {
    const { code, guest } = await open('duel', { lang: 'en', source: 'random' })
    const third = await join(call(`/${code}/join`, null, { name: 'Вова' }), params(code))
    expect(third.status).toBe(400)
    const again = await join(call(`/${code}/join`, guest, {}), params(code))
    expect(((await again.json()) as { room: RoomView }).room.me).toBe(1)
  })
})

describe('online bulls', () => {
  it('scores guesses and starts a rematch only once for two taps', async () => {
    const { code, host, guest } = await open('bulls', { length: 4, source: 'custom' })
    await play(code, host, { type: 'secret', value: '1234' })
    await play(code, guest, { type: 'secret', value: '5678' })
    const first = await play(code, host, { type: 'guess', value: '5687' })
    if (first.room?.game !== 'bulls') throw new Error('wrong game')
    expect(first.room.state.boards[0]).toEqual([{ code: '5687', bulls: 2, cows: 2 }])
    expect((await play(code, host, { type: 'guess', value: '1123' })).error).toBe('Нужно 4 разные цифры')

    // Боря gets it in one, and Аня has already used her first guess: no way back.
    const over = await play(code, guest, { type: 'guess', value: '1234' })
    expect(over.room?.state).toMatchObject({ phase: 'over', winner: 1, score: [0, 1] })
    expect((await play(code, host, { type: 'guess', value: '5678' })).error).toBe('Игра сейчас не идёт')

    const a = await play(code, host, { type: 'next', round: 1 })
    const b = await play(code, guest, { type: 'next', round: 1 })
    expect(a.room?.state).toMatchObject({ phase: 'secret', round: 2 })
    expect(b.room?.state).toMatchObject({ phase: 'secret', round: 2 })
  })
})

describe('online shared board', () => {
  it('keeps turns and the open first letter', async () => {
    const data = parseRoomData('lingo', { lang: 'ru', rounds: 3, firstLetter: true })!
    let room = await startGame({ ...data, code: 'TESTS', players: [{ name: 'Аня', token: 'a' }, { name: 'Боря', token: 'b' }] } as Room)
    if (room.game !== 'lingo') throw new Error('wrong game')
    const answer = room.state.answer

    expect(await act(room, 1, { type: 'guess', value: answer })).toBe('Сейчас ход соперника')
    const wrongStart = answer[0] === 'а' ? 'берег' : 'акула'
    expect(await act(room, 0, { type: 'guess', value: wrongStart })).toMatch(/^Слово должно начинаться/)

    const view = viewFor(room, 2, 1)
    if (view.game !== 'lingo') throw new Error('wrong game')
    expect(view.state.answer).toBeNull()
    expect(view.state.first).toBe(answer[0])

    room = (await act(room, 0, { type: 'guess', value: answer })) as Room
    const after = viewFor(room, 3, 1)
    if (after.game !== 'lingo') throw new Error('wrong game')
    expect(after.state).toMatchObject({ phase: 'round', roundWinner: 0, score: [1, 0], answer })
    expect(after.state.guesses[0].marks.every((m) => m === 'correct')).toBe(true)

    const next = (await act(room, 1, { type: 'next', round: 1 })) as Room
    expect(next.state).toMatchObject({ phase: 'play', round: 2, starter: 1, turn: 1 })
    expect(await act(next, 0, { type: 'next', round: 1 })).toBe(next)
  })
})

describe('room API input', () => {
  it('rejects bad settings, actions and codes', async () => {
    expect((await create(call('', null, { game: 'chess', settings: {} }))).status).toBe(400)
    expect((await create(call('', null, { game: 'duel', settings: { lang: 'de', source: 'random' } }))).status).toBe(400)
    expect((await read(call('/ZZZZZ', null), params('ZZZZZ'))).status).toBe(404)
    const { code, host } = await open('duel', { lang: 'ru', source: 'random' })
    expect((await play(code, host, { type: 'cheat' })).status).toBe(400)
    expect((await play(code, host, { type: 'guess', value: 'x'.repeat(40) })).status).toBe(400)
  })
})
