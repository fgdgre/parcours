import { describe, expect, it } from 'vitest'
import { addDays, dueCardIds, freshEntry, gradeCard } from '../app/utils/srs'

const TODAY = '2026-07-13'

describe('addDays', () => {
  it('adds calendar days', () => {
    expect(addDays('2026-07-13', 1)).toBe('2026-07-14')
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-12-31', 3)).toBe('2027-01-03')
  })
})

describe('gradeCard', () => {
  it('new card graded good → 1 day', () => {
    const e = gradeCard(undefined, 'good', TODAY)
    expect(e.intervalDays).toBe(1)
    expect(e.due).toBe('2026-07-14')
    expect(e.reps).toBe(1)
  })

  it('second good → 3 days, then interval × ease', () => {
    let e = gradeCard(undefined, 'good', TODAY)
    e = gradeCard(e, 'good', '2026-07-14')
    expect(e.intervalDays).toBe(3)
    e = gradeCard(e, 'good', '2026-07-17')
    expect(e.intervalDays).toBe(Math.round(3 * 2.5))
  })

  it('again → relearn today, lapse counted, ease floored at 1.3', () => {
    let e = gradeCard(undefined, 'good', TODAY)
    e = gradeCard(e, 'again', '2026-07-14')
    expect(e.intervalDays).toBe(0)
    expect(e.due).toBe('2026-07-14')
    expect(e.lapses).toBe(1)
    expect(e.ease).toBe(2.3)
    for (let i = 0; i < 10; i++) e = gradeCard(e, 'again', '2026-07-14')
    expect(e.ease).toBe(1.3)
  })

  it('first again on a brand-new card is not a lapse', () => {
    const e = gradeCard(undefined, 'again', TODAY)
    expect(e.lapses).toBe(0)
  })

  it('easy increases ease and boosts interval', () => {
    let e = gradeCard(undefined, 'easy', TODAY)
    expect(e.ease).toBe(2.65)
    expect(e.intervalDays).toBe(2)
    e = gradeCard(e, 'easy', '2026-07-15')
    expect(e.intervalDays).toBeGreaterThanOrEqual(4)
  })
})

describe('dueCardIds', () => {
  it('returns cards due today or earlier', () => {
    const srs = {
      a: { ...freshEntry('2026-07-10'), due: '2026-07-10' },
      b: { ...freshEntry(TODAY), due: TODAY },
      c: { ...freshEntry(TODAY), due: '2026-07-20' },
    }
    expect(dueCardIds(srs, TODAY).sort()).toEqual(['a', 'b'])
  })
})
