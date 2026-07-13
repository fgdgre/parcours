import { describe, expect, it } from 'vitest'
import type { Card } from '../app/types/content'
import { dailySentences } from '../app/utils/sentenceGen'

const cards: Card[] = [
  { id: 'a', fr: 'manger', en: 'to eat', tags: ['verbs'] },
  { id: 'b', fr: 'parler', en: 'to speak', tags: ['verbs'] },
  { id: 'c', fr: 'le café', en: 'the coffee; the café', tags: ['food'] },
  { id: 'd', fr: 'la maison', en: 'the house, home', tags: ['nouns'] },
  { id: 'e', fr: 'demain', en: 'tomorrow', tags: ['time'] },
  { id: 'f', fr: "l'eau", en: 'the water', tags: ['food'] },
]

describe('dailySentences', () => {
  it('is deterministic for the same seed', () => {
    const a = dailySentences(cards, '2026-07-13', 5)
    const b = dailySentences(cards, '2026-07-13', 5)
    expect(a).toEqual(b)
  })

  it('differs across seeds', () => {
    const a = dailySentences(cards, '2026-07-13', 5)
    const b = dailySentences(cards, '2026-07-14', 5)
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(b))
  })

  it('only uses learned material and produces valid patterns', () => {
    const out = dailySentences(cards, 'seed', 10)
    expect(out.length).toBeGreaterThan(0)
    for (const s of out) {
      expect(s.answer.length).toBeGreaterThan(0)
      expect(s.answer[0]).toMatch(/^(je |j'|tu |il n'y a pas de )/)
      expect(s.prompt.length).toBeGreaterThan(10)
    }
  })

  it('never builds pas-de sentences from vowel-initial nouns', () => {
    const out = dailySentences(cards, 'x', 20)
    for (const s of out) {
      expect(s.answer[0]).not.toContain("pas de eau")
    }
  })

  it('returns empty when nothing is learned', () => {
    expect(dailySentences([], 'seed', 5)).toEqual([])
  })

  it('never produces past tense unless unlocked', () => {
    const base = dailySentences(cards, 'p', 30)
    for (const s of base) expect(s.answer[0]).not.toMatch(/j'ai \w+é/)
  })

  it('produces past tense with regular participles when unlocked', () => {
    const out = dailySentences(cards, 'p', 40, { pastTense: true })
    const past = out.filter(s => s.answer[0]!.startsWith("j'ai ") || s.answer[0]!.includes("n'ai pas"))
    expect(past.length).toBeGreaterThan(0)
    for (const s of past) {
      expect(s.answer[0]).toMatch(/(mangé|parlé)/)
    }
  })

  it('object pronoun template picks le/la by the noun gender', () => {
    const out = dailySentences(cards, 'q', 40, { objectPronouns: true })
    const pron = out.filter(s => s.prompt.includes('I want it'))
    for (const s of pron) {
      if (s.prompt.includes('le café')) expect(s.answer[0]).toBe('je le veux')
      if (s.prompt.includes('la maison')) expect(s.answer[0]).toBe('je la veux')
    }
  })
})
