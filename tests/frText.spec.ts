import { describe, expect, it } from 'vitest'
import { hearableFrench, isLikelyFrench, speakableParts } from '../app/utils/frText'

const speaks = (text: string) => speakableParts(text).filter(p => p.speak).map(p => p.speak)

describe('isLikelyFrench', () => {
  it('accepts accents, elision and function words', () => {
    expect(isLikelyFrench('être')).toBe(true)
    expect(isLikelyFrench("c'est combien")).toBe(true)
    expect(isLikelyFrench('On y va !')).toBe(true)
  })
  it('rejects plain English including homographs', () => {
    expect(isLikelyFrench('a friend')).toBe(false)
    expect(isLikelyFrench('He has a coffee.')).toBe(false)
    expect(isLikelyFrench('what a comment from my son')).toBe(false)
  })
})

describe('speakableParts', () => {
  it('makes quoted French tappable, quoted English not', () => {
    expect(speaks('“On y va !” means…')).toEqual(['On y va !'])
    expect(speaks('Say: “I want to close the door.”')).toEqual([])
  })
  it('detects unquoted French runs of two or more tokens', () => {
    expect(speaks('Why do il parle vs je parle sound identical?')).toEqual(['il parle', 'je parle'])
  })
  it('lets an accented single token through, blocks a lone ambiguous one', () => {
    expect(speaks('Fill the je-form: je ___ (être, present)')).toEqual(['être'])
    expect(speaks('the word va is short')).toEqual([])
  })
  it('never bridges across blanks or parentheses', () => {
    const found = speaks('je ___ (être, present)')
    expect(found).not.toContain('je ___ (être')
  })
  it('reassembles the original text exactly', () => {
    for (const t of ['“On y va !” means…', 'Why do il parle vs je parle sound identical?', 'plain english']) {
      expect(speakableParts(t).map(p => p.text).join('')).toBe(t)
    }
  })
})

describe('hearableFrench', () => {
  it('prefers prompt French, falls back to a French answer, else null', () => {
    expect(hearableFrench('“On y va !” means…', 'Let’s go!')).toBe('On y va !')
    expect(hearableFrench('Spell: why', 'pourquoi')).toBe('pourquoi')
    expect(hearableFrench('Pick the right option', 'the correct one')).toBeNull()
  })
})
