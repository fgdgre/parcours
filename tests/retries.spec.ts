import { describe, expect, it } from 'vitest'
import type { MistakeEntry } from '../app/utils/retries'
import { applyRetry, isDue, nextDue, withDueRetries, retryExercise } from '../app/utils/retries'

const base: MistakeEntry = { q: 'Say: “I want to eat.”', a: 'je veux manger', date: '2026-07-18' }

describe('retry scheduling', () => {
  it('first retry is due 2 days after the miss', () => {
    expect(nextDue(base)).toBe('2026-07-20')
    expect(isDue(base, '2026-07-19')).toBe(false)
    expect(isDue(base, '2026-07-20')).toBe(true)
  })

  it('second retry is due 5 days after the first clean one', () => {
    const afterR1 = applyRetry(base, true, '2026-07-20')
    expect(afterR1.r1?.ok).toBe(true)
    expect(afterR1.closed).toBeFalsy()
    expect(nextDue(afterR1)).toBe('2026-07-25')
  })

  it('closes after two clean retries', () => {
    const afterR1 = applyRetry(base, true, '2026-07-20')
    const afterR2 = applyRetry(afterR1, true, '2026-07-25')
    expect(afterR2.closed).toBe(true)
    expect(nextDue(afterR2)).toBeNull()
    expect(isDue(afterR2, '2026-08-01')).toBe(false)
  })

  it('a failed retry resets everything', () => {
    const afterR1 = applyRetry(base, true, '2026-07-20')
    const failed = applyRetry(afterR1, false, '2026-07-25')
    expect(failed.r1).toBeUndefined()
    expect(failed.closed).toBe(false)
    expect(nextDue(failed)).toBe('2026-07-27')
  })
})

describe('retryExercise', () => {
  it('replays the original exercise when snapshotted', () => {
    const withEx: MistakeEntry = {
      ...base,
      ex: { type: 'mc', prompt: 'x', options: ['a', 'b'], answer: 0 },
    }
    expect(retryExercise(withEx).type).toBe('mc')
  })
  it('falls back to a typed drill', () => {
    const ex = retryExercise(base)
    expect(ex.type).toBe('type')
    if (ex.type === 'type') expect(ex.answer).toEqual(['je veux manger'])
  })

  it('legacy dictation mistakes retry as real dictations with audio', () => {
    const ex = retryExercise({ q: 'Dictation (writing what you hear)', a: 'Bonjour, ça va ?', date: '2026-07-18' })
    expect(ex.type).toBe('dictation')
    if (ex.type === 'dictation') expect(ex.ttsText).toBe('Bonjour, ça va ?')
  })

  it('legacy speaking mistakes retry as speak exercises', () => {
    const ex = retryExercise({ q: 'Say aloud: I want a coffee.', a: 'Je veux un café.', date: '2026-07-18' })
    expect(ex.type).toBe('speak')
    if (ex.type === 'speak') expect(ex.target).toBe('Je veux un café.')
  })
})

describe('withDueRetries', () => {
  const own = [
    { type: 'mc' as const, prompt: 'Own question', options: ['a', 'b'], answer: 0 },
  ]
  const due = { q: 'Say: “I want it.”', a: 'je le veux', date: '2026-07-01', closed: false }
  const notDue = { q: 'Other', a: 'x', date: '2026-08-01', closed: false }
  const duplicate = { q: 'Own question', a: 'a', date: '2026-07-01', closed: false }

  it('appends due retries after own items with a parallel retryOf map', () => {
    const s = withDueRetries(own, [due, notDue], '2026-08-02', 3)
    expect(s.items).toHaveLength(2)
    expect(s.retryOf[0]).toBeNull()
    expect(s.retryOf[1]).toBe(due)
    expect(s.items[1]!.type).toBe('type')
  })

  it('never injects a retry that duplicates an own question', () => {
    const s = withDueRetries(own, [duplicate], '2026-08-02', 3)
    expect(s.items).toHaveLength(1)
  })

  it('respects the max cap', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ q: `Q${i}`, a: `a${i}`, date: '2026-07-01', closed: false }))
    const s = withDueRetries(own, many, '2026-08-02', 3)
    expect(s.items).toHaveLength(4)
  })

  it('does not mutate prompts with tags', () => {
    const s = withDueRetries([], [due], '2026-08-02', 3)
    const item = s.items[0]!
    expect('prompt' in item ? (item as { prompt: string }).prompt : '').not.toContain('🔁')
  })
})
