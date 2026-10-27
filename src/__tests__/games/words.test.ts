import { describe, it, expect } from 'vitest'
import { decodeChallenge, encodeChallenge } from '@/app/games/lib/challenge'
import { keyFromEvent, digitFromEvent, LAYOUTS, ENTER, BACK } from '@/app/games/lib/keys'
import { WORD_LENGTH, isWordShape, loadDict, normalizeWord, randomAnswer, type Lang } from '@/app/games/lib/words'

describe('word lists', () => {
  it.each(['ru', 'en'] as Lang[])('%s: answers are valid guesses of the right shape', async (lang) => {
    const dict = await loadDict(lang)
    expect(dict.answers.length).toBeGreaterThan(500)
    expect(new Set(dict.answers).size).toBe(dict.answers.length)
    for (const w of dict.allowed) expect(isWordShape(w, lang), w).toBe(true)
    for (const w of dict.answers) expect(dict.allowed.has(w), w).toBe(true)
  })

  it('every letter of every word is on the keyboard', async () => {
    for (const lang of ['ru', 'en'] as Lang[]) {
      const keys = new Set(LAYOUTS[lang].flat())
      const dict = await loadDict(lang)
      for (const w of dict.allowed) for (const ch of w) expect(keys.has(ch), `${lang}: ${w}`).toBe(true)
    }
  })

  it('folds ё and case', () => {
    expect(normalizeWord(' Ёлка ')).toBe('елка')
    expect(isWordShape('елка', 'ru')).toBe(false)
    expect(isWordShape('ветер', 'ru')).toBe(true)
    expect(isWordShape('ветер', 'en')).toBe(false)
  })

  it('avoids already used answers while it can', async () => {
    const dict = await loadDict('ru')
    const used = dict.answers.slice(1)
    expect(randomAnswer(dict, used)).toBe(dict.answers[0])
    expect(randomAnswer(dict, dict.answers)).toHaveLength(WORD_LENGTH)
  })
})

describe('challenge links', () => {
  it('round-trips a challenge without showing the word', () => {
    const code = encodeChallenge({ lang: 'ru', word: 'весна', from: 'Аня', prev: 4 })
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(code).not.toContain('весна')
    expect(decodeChallenge(code)).toEqual({ lang: 'ru', word: 'весна', from: 'Аня', prev: 4 })
    expect(decodeChallenge(encodeChallenge({ lang: 'en', word: 'crane', from: 'Bob' }))).toEqual({
      lang: 'en',
      word: 'crane',
      from: 'Bob',
    })
  })

  it('rejects broken or forged links', () => {
    const code = encodeChallenge({ lang: 'ru', word: 'весна', from: 'Аня' })
    expect(decodeChallenge(code.slice(0, -4))).toBeNull()
    expect(decodeChallenge('hello')).toBeNull()
    expect(decodeChallenge('')).toBeNull()
    expect(decodeChallenge(encodeChallenge({ lang: 'ru', word: 'crane', from: 'x' }))).toBeNull()
    expect(decodeChallenge(encodeChallenge({ lang: 'en', word: 'cranes', from: 'x' }))).toBeNull()
  })

  it('cleans up the name and drops an impossible score', () => {
    const c = decodeChallenge(encodeChallenge({ lang: 'en', word: 'crane', from: '   ', prev: 9 }))
    expect(c).toEqual({ lang: 'en', word: 'crane', from: 'Друг' })
  })
})

describe('physical keys', () => {
  const key = (k: string, code = '', extra = {}) => ({ key: k, code, ...extra })

  it('reads letters, Enter and Backspace', () => {
    expect(keyFromEvent(key('ж', 'Semicolon'), 'ru')).toBe('ж')
    expect(keyFromEvent(key('Ё', 'Backquote'), 'ru')).toBe('е')
    expect(keyFromEvent(key('Enter', 'Enter'), 'ru')).toBe(ENTER)
    expect(keyFromEvent(key('Backspace', 'Backspace'), 'en')).toBe(BACK)
    expect(keyFromEvent(key('a', 'KeyA', { ctrlKey: true }), 'en')).toBeNull()
  })

  it('maps keys by position when the other layout is on', () => {
    expect(keyFromEvent(key('q', 'KeyQ'), 'ru')).toBe('й')
    expect(keyFromEvent(key(';', 'Semicolon'), 'ru')).toBe('ж')
    expect(keyFromEvent(key('й', 'KeyQ'), 'en')).toBe('q')
    expect(keyFromEvent(key('1', 'Digit1'), 'en')).toBeNull()
  })

  it('reads digits from both rows of keys', () => {
    expect(digitFromEvent(key('7', 'Digit7'))).toBe('7')
    expect(digitFromEvent(key('End', 'Numpad1'))).toBe('1')
    expect(digitFromEvent(key('a', 'KeyA'))).toBeNull()
  })
})
