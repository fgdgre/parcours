import { describe, expect, it } from 'vitest'
import { levenshtein, matchAnswer, normalizeFr, wordDiff } from '../app/utils/grading'

describe('normalizeFr', () => {
  it('lowercases, trims, collapses spaces, strips end punctuation', () => {
    expect(normalizeFr("  Je M'appelle  Dmytro. ")).toBe("je m'appelle dmytro")
  })
  it('normalizes curly apostrophes', () => {
    expect(normalizeFr('c’est')).toBe("c'est")
  })
  it('keeps accents by default, strips them on demand', () => {
    expect(normalizeFr('café')).toBe('café')
    expect(normalizeFr('café', { stripAccents: true })).toBe('cafe')
    expect(normalizeFr('sœur', { stripAccents: true })).toBe('soeur')
  })
})

describe('matchAnswer', () => {
  it('accepts case/spacing/punctuation variants', () => {
    expect(matchAnswer("Je M'appelle  Dmytro.", ["je m'appelle dmytro"])).toBe(true)
  })
  it('is accent-lenient by default', () => {
    expect(matchAnswer('cafe', ['café'])).toBe(true)
  })
  it('rejects missing accents in strict mode', () => {
    expect(matchAnswer('cafe', ['café'], { strictAccents: true })).toBe(false)
    expect(matchAnswer('café', ['café'], { strictAccents: true })).toBe(true)
  })
  it('accepts any listed variant', () => {
    expect(matchAnswer('je veux manger', ['je veux manger', 'moi je veux manger'])).toBe(true)
    expect(matchAnswer('tu veux manger', ['je veux manger'])).toBe(false)
  })
})

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('vais', 'vais')).toBe(0)
    expect(levenshtein('vais', 'vas')).toBe(1)
    expect(levenshtein('bonjour', 'bonsoir')).toBe(2)
  })
})

describe('wordDiff', () => {
  it('marks exact, near and missing words', () => {
    expect(wordDiff('je vais bien', 'je vas bien').map(w => w.status)).toEqual(['ok', 'near', 'ok'])
  })
  it('handles missing words', () => {
    expect(wordDiff('je veux un café', 'je café').map(w => w.status)).toEqual(['ok', 'miss', 'miss', 'ok'])
  })
  it('ignores accents and case from the recognizer', () => {
    expect(wordDiff('ça va', 'Ca va').map(w => w.status)).toEqual(['ok', 'ok'])
  })
  it('is position-tolerant for shifted words', () => {
    expect(wordDiff('bonjour madame', 'euh bonjour madame').map(w => w.status)).toEqual(['ok', 'ok'])
  })
})
