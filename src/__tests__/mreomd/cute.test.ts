import { babyTalk, correctMessage, doubleLastWord, stretch, wrongMessage } from '@/app/mreomd/lib/cute'

describe('cute messages', () => {
  it('stretches the last vowel', () => {
    expect(stretch('верю')).toBe('верююю')
    expect(stretch('ура', 5)).toBe('урааааа')
  })

  it('talks like a baby', () => {
    expect(babyTalk('ты умница')).toBe('тиии умница')
    expect(babyTalk('я в тебя верю')).toBe('я в тибя верю')
    expect(babyTalk('мы')).toBe('ми')
  })

  it('doubles the last word', () => {
    expect(doubleLastWord('нихуя себе')).toBe('нихуя себе себе')
    expect(doubleLastWord('ура!')).toBe('ура ура!')
  })

  it('builds non-empty messages', () => {
    for (let i = 0; i < 50; i++) {
      expect(correctMessage().length).toBeGreaterThan(0)
      expect(wrongMessage().length).toBeGreaterThan(0)
    }
  })
})
