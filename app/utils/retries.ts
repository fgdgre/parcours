import type { Exercise } from '~/types/content'
import { addDays } from '~/utils/srs'

/**
 * A logged mistake with its retry state. Cadence (from Dmytro's worksheet
 * convention): first retry due +2 days after the miss, second retry ~a week
 * after the first clean one. CLOSED only after two clean retries; any failed
 * retry resets the clock and reopens the mistake.
 */
export interface MistakeEntry {
  q: string
  a: string
  date: string
  /** snapshot of the original exercise, so retries replay the real thing */
  ex?: Exercise
  r1?: { date: string; ok: boolean }
  r2?: { date: string; ok: boolean }
  closed?: boolean
}

export function nextDue(m: MistakeEntry): string | null {
  if (m.closed) return null
  if (!m.r1) return addDays(m.date, 2)
  return addDays(m.r1.date, 5)
}

export function isDue(m: MistakeEntry, today: string): boolean {
  const due = nextDue(m)
  return due !== null && due <= today
}

export function applyRetry(m: MistakeEntry, ok: boolean, today: string): MistakeEntry {
  if (!ok) {
    // relapse: back to square one, next retry in 2 days
    return { ...m, date: today, r1: undefined, r2: undefined, closed: false }
  }
  if (!m.r1) {
    return { ...m, r1: { date: today, ok: true } }
  }
  return { ...m, r2: { date: today, ok: true }, closed: true }
}

/** Builds the exercise to replay for a mistake — the original when we have it. */
export function retryExercise(m: MistakeEntry): Exercise {
  if (m.ex) return m.ex
  return { type: 'type', prompt: m.q, answer: [m.a] }
}
