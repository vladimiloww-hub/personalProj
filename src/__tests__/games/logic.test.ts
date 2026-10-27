import { describe, it, expect } from 'vitest'
import { emojiGrid, evaluateGuess, isSolved, keyStates, makeGuess } from '@/app/games/lib/evaluate'
import { afterGuess } from '@/app/games/lib/turns'
import { isValidCode, randomCode, scoreBulls } from '@/app/games/lib/bulls'
import { plural } from '@/app/games/lib/plural'

describe('evaluateGuess', () => {
  it('marks exact, misplaced and missing letters', () => {
    expect(evaluateGuess('сосна', 'сосна')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
    expect(evaluateGuess('ссора', 'сосна')).toEqual(['correct', 'present', 'present', 'absent', 'correct'])
  })

  it('marks a repeated letter only as often as the answer has it', () => {
    expect(evaluateGuess('papal', 'apple')).toEqual(['present', 'present', 'correct', 'absent', 'present'])
    // Both L's of the answer are taken by exact matches, so the first L gets nothing.
    expect(evaluateGuess('lolly', 'hello')).toEqual(['absent', 'present', 'correct', 'correct', 'absent'])
    expect(evaluateGuess('eeeee', 'crane')).toEqual(['absent', 'absent', 'absent', 'absent', 'correct'])
  })

  it('keeps the best state of each letter for the keyboard', () => {
    const guesses = [makeGuess('crane', 'react'), makeGuess('react', 'react')]
    expect(keyStates([guesses[0]])).toMatchObject({ c: 'present', r: 'present', a: 'correct', n: 'absent', e: 'present' })
    expect(keyStates(guesses)).toMatchObject({ r: 'correct', e: 'correct', a: 'correct', c: 'correct', t: 'correct', n: 'absent' })
  })

  it('reports a solved row and draws the share grid', () => {
    const rows = [makeGuess('crane', 'react'), makeGuess('react', 'react')]
    expect(isSolved(rows[0])).toBe(false)
    expect(isSolved(rows[1])).toBe(true)
    expect(isSolved(undefined)).toBe(false)
    expect(emojiGrid(rows)).toBe('🟨🟨🟩⬜🟨\n🟩🟩🟩🟩🟩')
  })
})

describe('afterGuess', () => {
  it('lets the second player answer within the same round', () => {
    expect(afterGuess([1, 0], [false, false], 0, 6)).toEqual({ over: false, turn: 1 })
    expect(afterGuess([1, 1], [false, false], 0, 6)).toEqual({ over: false, turn: 0 })
    expect(afterGuess([1, 0], [true, false], 0, 6)).toEqual({ over: false, turn: 1 })
    expect(afterGuess([0, 1], [false, false], 1, 6)).toEqual({ over: false, turn: 0 })
  })

  it('decides the game once both have played the round', () => {
    expect(afterGuess([3, 3], [true, false], 0, 6)).toEqual({ over: true, winner: 0 })
    expect(afterGuess([3, 3], [false, true], 0, 6)).toEqual({ over: true, winner: 1 })
    expect(afterGuess([3, 3], [true, true], 1, 6)).toEqual({ over: true, winner: null })
  })

  it('ends in a draw when nobody finds the word in time', () => {
    expect(afterGuess([6, 6], [false, false], 0, 6)).toEqual({ over: true, winner: null })
    expect(afterGuess([40, 40], [false, false], 0, null)).toEqual({ over: false, turn: 0 })
  })
})

describe('bulls and cows', () => {
  it('counts bulls and cows', () => {
    expect(scoreBulls('1356', '1234')).toEqual({ bulls: 1, cows: 1 })
    expect(scoreBulls('4321', '1234')).toEqual({ bulls: 0, cows: 4 })
    expect(scoreBulls('1234', '1234')).toEqual({ bulls: 4, cows: 0 })
    expect(scoreBulls('5678', '1234')).toEqual({ bulls: 0, cows: 0 })
  })

  it('accepts only numbers of distinct digits', () => {
    expect(isValidCode('0123', 4)).toBe(true)
    expect(isValidCode('1123', 4)).toBe(false)
    expect(isValidCode('123', 4)).toBe(false)
    expect(isValidCode('12a4', 4)).toBe(false)
  })

  it('makes random numbers that are valid secrets', () => {
    for (const length of [3, 4, 5]) {
      for (let i = 0; i < 50; i++) expect(isValidCode(randomCode(length), length)).toBe(true)
    }
  })
})

describe('plural', () => {
  it('picks the Russian plural form', () => {
    const forms: [string, string, string] = ['ход', 'хода', 'ходов']
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25, 111].map((n) => plural(n, forms))).toEqual([
      'ход', 'хода', 'хода', 'ходов', 'ходов', 'ходов', 'ход', 'хода', 'ходов', 'ходов',
    ])
  })
})
