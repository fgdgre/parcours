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

/** Builds the exercise to replay for a mistake — the original when we have it.
 * Legacy entries (no snapshot) are reconstructed from the question shape so a
 * dictation retry actually plays audio and a speaking retry uses the mic. */
export function retryExercise(m: MistakeEntry): Exercise {
  if (m.ex) return m.ex
  if (/^dictation/i.test(m.q)) {
    return { type: 'dictation', ttsText: m.a, answer: [m.a] }
  }
  const say = m.q.match(/^Say aloud: (.+)$/)
  if (say) {
    return { type: 'speak', target: m.a, en: say[1]! }
  }
  return { type: 'type', prompt: m.q, answer: [m.a] }
}

export interface RetrySession {
  items: Exercise[]
  /** parallel to items: the mistake behind each injected exercise, or null for own items */
  retryOf: (MistakeEntry | null)[]
}

/** Appends up to `max` due retries to a session — Duolingo-style interleaving
 * that drains the retry backlog inside normal study instead of a separate chore. */
export function withDueRetries(
  own: Exercise[],
  mistakes: MistakeEntry[],
  today: string,
  max = 3,
): RetrySession {
  // never inject a retry whose question is already one of the session's own
  // items — the miss/retry records would fight over the same entry
  const ownPrompts = new Set(own.map(o => ('prompt' in o ? o.prompt : null)).filter(Boolean))
  const due = mistakes
    .filter(m => isDue(m, today) && !ownPrompts.has(m.q))
    .slice(0, max)
  return {
    items: [...own, ...due.map(retryExercise)],
    retryOf: [...own.map(() => null), ...due],
  }
}
