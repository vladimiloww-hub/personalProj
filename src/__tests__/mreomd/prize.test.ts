import { describe, it, expect } from 'vitest'
import { PRIZE_CELLS, cellOpenedBy, prizeExams } from '@/app/mreomd/components/PrizeBoard'
import { QUESTIONS, pickExamQuestions, questionsFor } from '@/app/mreomd/lib/bank'
import { EXAM_FORMATS } from '@/app/mreomd/data/meta'
import type { ExamRecord } from '@/app/mreomd/lib/store'
import type { CategoryCode } from '@/app/mreomd/lib/types'

function exam(i: number, cat: CategoryCode, passed: boolean): ExamRecord {
  return {
    id: `e${i}`, at: 1000 + i, cat, total: 24, correct: passed ? 23 : 10, minCorrect: 22,
    durationSec: 600, passed, timeout: false, qids: [], wrong: [], answers: {},
  }
}

describe('prize picture', () => {
  it('opens fully after 12 passed AB exams', () => {
    expect(PRIZE_CELLS).toBe(12)
    const exams = Array.from({ length: 14 }, (_, i) => exam(i, 'AB', true))
    expect(prizeExams(exams)).toHaveLength(14)
    expect(cellOpenedBy(exams, exams[0])).toBe(1)
    expect(cellOpenedBy(exams, exams[11])).toBe(12)
    expect(cellOpenedBy(exams, exams[12])).toBeNull()
  })

  it('ignores failed exams and other categories', () => {
    const exams = [exam(1, 'AB', false), exam(2, 'C', true), exam(3, 'E', true), exam(4, 'AB', true)]
    expect(prizeExams(exams).map((e) => e.id)).toEqual(['e4'])
    expect(cellOpenedBy(exams, exams[0])).toBeNull()
    expect(cellOpenedBy(exams, exams[1])).toBeNull()
    expect(cellOpenedBy(exams, exams[3])).toBe(1)
  })
})

describe('official bank', () => {
  it('gives every category a full exam ticket', () => {
    for (const cat of ['AB', 'C', 'D', 'E', 'F'] as const) {
      const n = cat === 'AB' ? EXAM_FORMATS.short.questions : EXAM_FORMATS.long.questions
      expect(pickExamQuestions(questionsFor(cat), n), cat).toHaveLength(n)
    }
  })

  it('keeps vehicle-specific questions out of the AB pool', () => {
    const ab = questionsFor('AB')
    expect(ab.some((q) => q.veh)).toBe(false)
    expect(ab.length).toBeGreaterThan(900)
    expect(questionsFor('C').some((q) => q.veh?.includes('truck'))).toBe(true)
    expect(questionsFor('F').some((q) => q.veh?.includes('trolley'))).toBe(true)
  })

  it('has the 24 AB tickets', () => {
    const tickets = new Set(QUESTIONS.map((q) => q.ticket).filter(Boolean))
    expect([...tickets].sort((a, b) => a! - b!)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1))
  })
})
