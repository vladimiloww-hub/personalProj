import { describe, it, expect } from 'vitest'
import { highlightParts, matchSnippet, normalize, scoreQuestion, tokenize } from '@/app/mreomd/lib/search'
import type { Question } from '@/app/mreomd/lib/types'

const q: Question = {
  id: 't1',
  topic: 'pedestrians',
  q: { ru: 'Кому уступить дорогу на переходе?', ro: 'Cui cedați trecerea la trecerea pentru pietoni?' },
  a: [
    { ru: 'Пешеходам', ro: 'Pietonilor' },
    { ru: 'Никому', ro: 'Nimănui' },
  ],
  c: 0,
  e: { ru: 'Пешеход имеет преимущество.', ro: 'Pietonul are prioritate.' },
}

describe('normalize', () => {
  it('folds case, Romanian diacritics and ё', () => {
    expect(normalize('Ștefan ȚARĂ Încă')).toBe('stefan tara inca')
    expect(normalize('Ещё ёлка')).toBe('еще елка')
  })

  it('treats cedilla and comma-below forms alike', () => {
    expect(normalize('ş ţ')).toBe(normalize('ș ț'))
  })
})

describe('scoreQuestion', () => {
  it('requires every token to match', () => {
    expect(scoreQuestion(q, tokenize('переходе пешеходам'))).toBeGreaterThan(0)
    expect(scoreQuestion(q, tokenize('переходе трамвай'))).toBe(0)
  })

  it('matches across languages without diacritics', () => {
    expect(scoreQuestion(q, tokenize('nimanui'))).toBeGreaterThan(0)
  })

  it('ranks question-text hits above explanation hits', () => {
    expect(scoreQuestion(q, tokenize('переходе'))).toBeGreaterThan(scoreQuestion(q, tokenize('преимущество')))
  })

  it('searches the viewer note', () => {
    expect(scoreQuestion(q, tokenize('мнемоника'))).toBe(0)
    expect(scoreQuestion(q, tokenize('мнемоника'), 'моя мнемоника')).toBeGreaterThan(0)
  })
})

describe('highlightParts', () => {
  it('highlights accent-insensitive matches in the original text', () => {
    const parts = highlightParts('Cui cedați trecerea', tokenize('cedati'))
    expect(parts.filter((p) => p.hit).map((p) => p.t)).toEqual(['cedați'])
    expect(parts.map((p) => p.t).join('')).toBe('Cui cedați trecerea')
  })

  it('returns the whole text when nothing matches', () => {
    expect(highlightParts('abc', tokenize('x'))).toEqual([{ t: 'abc', hit: false }])
  })
})

describe('matchSnippet', () => {
  it('explains a match found only in the other language', () => {
    expect(matchSnippet(q, tokenize('pietoni'), 'ru')).toEqual({ label: 'RO', text: q.q.ro })
  })

  it('is empty when the visible question already shows the hit', () => {
    expect(matchSnippet(q, tokenize('переходе'), 'ru')).toBeNull()
  })

  it('falls back to answers and notes', () => {
    expect(matchSnippet(q, tokenize('никому'), 'ru')?.label).toBe('Ответ 2')
    expect(matchSnippet(q, tokenize('зебр'), 'ru', 'помни про зебру')?.label).toBe('Заметка')
  })
})
