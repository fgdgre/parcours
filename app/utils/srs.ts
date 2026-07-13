export interface SrsEntry {
  ease: number
  intervalDays: number
  due: string // YYYY-MM-DD, local date
  reps: number
  lapses: number
}

export type Grade = 'again' | 'hard' | 'good' | 'easy'

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayIso(): string {
  return new Date().toLocaleDateString('sv-SE')
}

export function freshEntry(today: string): SrsEntry {
  return { ease: 2.5, intervalDays: 0, due: today, reps: 0, lapses: 0 }
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function gradeCard(entry: SrsEntry | undefined, grade: Grade, today: string): SrsEntry {
  const cur = entry ?? freshEntry(today)
  let ease = cur.ease
  let lapses = cur.lapses
  let interval: number

  if (grade === 'again') {
    if (cur.reps > 0) lapses += 1
    ease = Math.max(1.3, ease - 0.2)
    interval = 0
  } else if (grade === 'hard') {
    ease = Math.max(1.3, ease - 0.15)
    interval = cur.reps === 0 ? 1 : Math.max(1, Math.round(cur.intervalDays * 1.2))
  } else if (grade === 'good') {
    interval = cur.reps === 0 ? 1 : cur.intervalDays <= 1 ? 3 : Math.round(cur.intervalDays * ease)
  } else {
    ease = ease + 0.15
    interval = cur.reps === 0 ? 2 : Math.max(4, Math.round(cur.intervalDays * ease * 1.3))
  }

  return {
    ease: round2(ease),
    intervalDays: interval,
    due: addDays(today, interval),
    reps: cur.reps + 1,
    lapses,
  }
}

export function dueCardIds(srs: Record<string, SrsEntry>, today: string): string[] {
  return Object.keys(srs).filter(id => srs[id]!.due <= today)
}
