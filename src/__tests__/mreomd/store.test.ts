import { describe, it, expect, beforeEach } from 'vitest'
import {
  FAVORITES_ID,
  addManyToList,
  createDefaultState,
  createList,
  deleteList,
  exportState,
  getState,
  importState,
  recordAnswer,
  resetAll,
  sanitizeState,
  setNote,
  toggleInList,
} from '@/app/mreomd/lib/store'
import { hardest, progressFor } from '@/app/mreomd/lib/progress'
import { QUESTIONS } from '@/app/mreomd/lib/bank'

beforeEach(() => {
  window.localStorage.clear()
  resetAll()
})

describe('sanitizeState', () => {
  it('falls back to defaults for garbage', () => {
    expect(sanitizeState(null)).toEqual(createDefaultState())
    expect(sanitizeState('x')).toEqual(createDefaultState())
  })

  it('always keeps the favorites list and drops malformed entries', () => {
    const s = sanitizeState({
      lists: [{ id: 'l1', name: 'Мой', qids: ['a', 'a', 5] }, { nope: true }],
      stats: { a: { seen: 2, correct: 1, wrong: 1, last: 'w', at: 1 }, b: { seen: 0 } },
      settings: { lang: 'ro', theme: 'neon' },
      notes: { a: 'hi', b: '   ' },
    })
    expect(s.lists.map((l) => l.id)).toEqual([FAVORITES_ID, 'l1'])
    expect(s.lists[1].qids).toEqual(['a'])
    expect(Object.keys(s.stats)).toEqual(['a'])
    expect(s.settings.lang).toBe('ro')
    expect(s.settings.theme).toBe('system')
    expect(s.notes).toEqual({ a: 'hi' })
  })
})

describe('actions', () => {
  it('records answers and tracks the latest result', () => {
    recordAnswer('q1', false)
    recordAnswer('q1', true)
    expect(getState().stats.q1).toMatchObject({ seen: 2, correct: 1, wrong: 1, last: 'c' })
  })

  it('persists to localStorage', () => {
    recordAnswer('q1', true)
    expect(JSON.parse(window.localStorage.getItem('mreomd:v1')!).stats.q1.seen).toBe(1)
  })

  it('manages lists', () => {
    toggleInList(FAVORITES_ID, 'q1')
    expect(getState().lists[0].qids).toEqual(['q1'])
    toggleInList(FAVORITES_ID, 'q1')
    expect(getState().lists[0].qids).toEqual([])

    const id = createList('  Знаки  ', '#000')
    addManyToList(id, ['a', 'b', 'a'])
    const list = getState().lists.find((l) => l.id === id)!
    expect(list.name).toBe('Знаки')
    expect(list.qids).toEqual(['a', 'b'])

    deleteList(id)
    deleteList(FAVORITES_ID)
    expect(getState().lists.map((l) => l.id)).toEqual([FAVORITES_ID])
  })

  it('removes empty notes', () => {
    setNote('q1', 'text')
    expect(getState().notes.q1).toBe('text')
    setNote('q1', '  ')
    expect(getState().notes.q1).toBeUndefined()
  })

  it('round-trips through export and import', () => {
    recordAnswer('q1', true)
    setNote('q1', 'заметка')
    const dump = exportState()
    resetAll()
    importState(dump)
    expect(getState().stats.q1.seen).toBe(1)
    expect(getState().notes.q1).toBe('заметка')
  })
})

describe('progress', () => {
  it('counts known, mistakes and accuracy', () => {
    const [a, b, c] = QUESTIONS
    recordAnswer(a.id, true)
    recordAnswer(b.id, false)
    recordAnswer(b.id, false)
    const p = progressFor([a, b, c], getState().stats)
    expect(p).toMatchObject({ total: 3, seen: 2, known: 1, mistakes: 1 })
    expect(p.accuracy).toBeCloseTo(1 / 3)
    expect(hardest([a, b, c], getState().stats).map((q) => q.id)).toEqual([b.id])
  })
})

describe('category migration', () => {
  it('moves progress saved under A/B onto the shared AB pool', () => {
    const s = sanitizeState({
      settings: { cat: 'B' },
      exams: [{ id: 'e1', cat: 'B', passed: true, qids: [], wrong: [] }],
    })
    expect(s.settings.cat).toBe('AB')
    expect(s.exams[0].cat).toBe('AB')
    expect(sanitizeState({ settings: { cat: 'CE' } }).settings.cat).toBe('E')
  })
})
