import { describe, expect, it } from 'vitest'
import {
  SCHEMA_VERSION,
  defaultSettings,
  serializeState,
  validateBackup,
} from '../app/stores/progress'

const sample = {
  completedLessons: { 'ch1-lt-01': '2026-07-13' },
  srs: { 'v1-01': { ease: 2.5, intervalDays: 1, due: '2026-07-14', reps: 1, lapses: 0 } },
  introduced: { 'v1-01': '2026-07-13' },
  examScores: { 'exam-ch1': 92 },
  lessonScores: { 'quiz-lt-01-02': { correct: 5, total: 6, date: '2026-07-13' } },
  mistakes: [{ q: '“Vous voulez” means…', a: 'you want (formal or plural)', date: '2026-07-13' }],
  writingRatings: [{ task: 'Introduce yourself', score: 72, date: '2026-07-13' }],
  skillStats: { mc: { correct: 12, total: 15 } },
  dayStats: { '2026-07-13': { seconds: 1200, correct: 17, total: 21 } },
  settings: defaultSettings(),
}

describe('backup round-trip', () => {
  it('serialize → validate returns the same data', () => {
    const json = serializeState(sample)
    const v = validateBackup(json)
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.data.schemaVersion).toBe(SCHEMA_VERSION)
      expect(v.data.completedLessons).toEqual(sample.completedLessons)
      expect(v.data.srs).toEqual(sample.srs)
      expect(v.data.settings).toEqual(sample.settings)
    }
  })
})

describe('validateBackup rejections', () => {
  it('rejects malformed JSON', () => {
    const v = validateBackup('{not json')
    expect(v.ok).toBe(false)
  })
  it('rejects wrong schema version', () => {
    const bad = JSON.stringify({ ...JSON.parse(serializeState(sample)), schemaVersion: 99 })
    const v = validateBackup(bad)
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.error).toContain('schema')
  })
  it('rejects missing maps', () => {
    const v = validateBackup(JSON.stringify({ schemaVersion: SCHEMA_VERSION }))
    expect(v.ok).toBe(false)
  })
  it('fills missing settings with defaults', () => {
    const parsed = JSON.parse(serializeState(sample))
    delete parsed.settings
    const v = validateBackup(JSON.stringify(parsed))
    expect(v.ok).toBe(true)
    if (v.ok) expect(v.data.settings).toEqual(defaultSettings())
  })
})
