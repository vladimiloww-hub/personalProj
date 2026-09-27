import { describe, it, expect } from 'vitest'
import { QUESTIONS, answerOrder, appliesToCategory, pickExamQuestions, questionsFor } from '@/app/mreomd/lib/bank'
import { CATEGORIES, EXAM_FORMATS, TOPIC_BY_ID, normalizeCategory } from '@/app/mreomd/data/meta'
import { SIGN_BY_ID } from '@/app/mreomd/data/signs'
import type { Question } from '@/app/mreomd/lib/types'

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

describe('question bank integrity', () => {
  it('has unique ids and valid answers', () => {
    const ids = new Set<string>()
    for (const q of QUESTIONS) {
      expect(ids.has(q.id), q.id).toBe(false)
      ids.add(q.id)
      expect(q.a.length, q.id).toBeGreaterThanOrEqual(2)
      expect(q.c, q.id).toBeGreaterThanOrEqual(0)
      expect(q.c, q.id).toBeLessThan(q.a.length)
      expect(q.q.ru.trim(), q.id).not.toBe('')
    }
  })

  it('references known topics and signs', () => {
    for (const q of QUESTIONS) {
      expect(TOPIC_BY_ID[q.topic], q.id).toBeDefined()
      if (q.img?.kind === 'sign') expect(SIGN_BY_ID[q.img.id], q.id).toBeDefined()
      if (q.img?.kind === 'signs') q.img.ids.forEach((id) => expect(SIGN_BY_ID[id], q.id).toBeDefined())
    }
  })
})

describe('official exam formats', () => {
  it('match ASP: 24/30 min/22 and 30/38 min/27', () => {
    expect(EXAM_FORMATS.short).toEqual({ questions: 24, minutes: 30, minCorrect: 22 })
    expect(EXAM_FORMATS.long).toEqual({ questions: 30, minutes: 38, minCorrect: 27 })
    const short = CATEGORIES.filter((c) => c.format === 'short').map((c) => c.code)
    expect(short).toEqual(['AB'])
    expect(CATEGORIES.map((c) => c.code)).toEqual(['AB', 'C', 'D', 'E', 'F'])
  })
})

describe('normalizeCategory', () => {
  it('maps codes saved by older versions onto the shared pools', () => {
    for (const c of ['A', 'A1', 'A2', 'AM', 'B', 'B1', 'H', 'AB']) expect(normalizeCategory(c)).toBe('AB')
    expect(normalizeCategory('C1')).toBe('C')
    expect(normalizeCategory('D1')).toBe('D')
    for (const c of ['BE', 'C1E', 'CE', 'D1E']) expect(normalizeCategory(c)).toBe('E')
    expect(normalizeCategory('F')).toBe('F')
    expect(normalizeCategory(undefined)).toBe('AB')
  })
})

describe('appliesToCategory', () => {
  const moto = { id: 'm', topic: 'speed', veh: ['moto'] } as Question
  const car = { id: 'x', topic: 'speed', veh: ['car'] } as Question
  const truck = { id: 't', topic: 'speed', veh: ['truck'] } as Question
  const common = { id: 'y', topic: 'speed' } as Question

  it('keeps common questions everywhere and filters vehicle-specific ones', () => {
    expect(appliesToCategory(common, 'AB')).toBe(true)
    expect(appliesToCategory(common, 'F')).toBe(true)
    expect(appliesToCategory(truck, 'AB')).toBe(false)
    expect(appliesToCategory(truck, 'C')).toBe(true)
    expect(appliesToCategory(car, 'all')).toBe(true)
  })

  it('gives A and B one shared pool', () => {
    expect(appliesToCategory(moto, 'AB')).toBe(true)
    expect(appliesToCategory(car, 'AB')).toBe(true)
  })
})

describe('pickExamQuestions', () => {
  it('returns the requested number of distinct questions', () => {
    const pool = questionsFor('AB')
    const picked = pickExamQuestions(pool, 24, seeded(1))
    expect(picked).toHaveLength(24)
    expect(new Set(picked.map((q) => q.id)).size).toBe(24)
  })

  it('spreads the ticket across topics', () => {
    const pool = questionsFor('AB')
    const topics = new Set(pool.map((q) => q.topic))
    const picked = pickExamQuestions(pool, topics.size, seeded(7))
    expect(new Set(picked.map((q) => q.topic)).size).toBe(topics.size)
  })

  it('never returns more than the pool holds', () => {
    const pool = questionsFor('AB').slice(0, 5)
    expect(pickExamQuestions(pool, 24, seeded(3))).toHaveLength(5)
  })
})

describe('answerOrder', () => {
  const q = QUESTIONS.find((x) => x.a.length >= 3)!

  it('keeps the original order unless shuffling', () => {
    expect(answerOrder(q, false, 42)).toEqual(q.a.map((_, i) => i))
  })

  it('is a stable permutation for the same seed', () => {
    const a = answerOrder(q, true, 42)
    expect(answerOrder(q, true, 42)).toEqual(a)
    expect([...a].sort()).toEqual(q.a.map((_, i) => i))
  })
})
