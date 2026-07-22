import { defineStore } from 'pinia'
import type { Grade, SrsEntry } from '~/utils/srs'
import { dueCardIds, freshEntry, gradeCard, todayIso } from '~/utils/srs'
import type { MistakeEntry } from '~/utils/retries'
import { applyRetry, isDue } from '~/utils/retries'

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'parcours.v1'

export interface Settings {
  strictAccents: boolean
  ttsRate: number
  preferKeyboard: boolean
  lastBackupAt: string
}

export interface LessonScore {
  correct: number
  total: number
  date: string
}

export type Mistake = MistakeEntry

export interface WritingRating {
  task: string
  score: number | null
  text: string
  note?: string
  date: string
}

export interface ExamAttempt {
  id: string
  pct: number
  seconds: number
  date: string
}

export interface SkillStat {
  correct: number
  total: number
}

export interface DayStat {
  seconds: number
  correct: number
  total: number
}

export interface PersistedState {
  schemaVersion: number
  savedAt: string
  completedLessons: Record<string, string>
  srs: Record<string, SrsEntry>
  introduced: Record<string, string>
  examScores: Record<string, number>
  lessonScores: Record<string, LessonScore>
  mistakes: Mistake[]
  writingRatings: WritingRating[]
  examHistory: ExamAttempt[]
  skillStats: Record<string, SkillStat>
  dayStats: Record<string, DayStat>
  notes: Record<string, string>
  settings: Settings
}

export function defaultSettings(): Settings {
  return { strictAccents: false, ttsRate: 0.95, preferKeyboard: false, lastBackupAt: '' }
}

export function serializeState(
  s: Omit<PersistedState, 'schemaVersion' | 'savedAt'>,
): string {
  const payload: PersistedState = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    completedLessons: s.completedLessons,
    srs: s.srs,
    introduced: s.introduced,
    examScores: s.examScores,
    lessonScores: s.lessonScores,
    mistakes: s.mistakes,
    writingRatings: s.writingRatings,
    examHistory: s.examHistory,
    skillStats: s.skillStats,
    dayStats: s.dayStats,
    notes: s.notes,
    settings: s.settings,
  }
  return JSON.stringify(payload, null, 2)
}

export type BackupValidation =
  | { ok: true; data: PersistedState }
  | { ok: false; error: string }

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function validateBackup(json: string): BackupValidation {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, error: 'Not valid JSON.' }
  }
  if (!isRecord(parsed)) return { ok: false, error: 'Backup must be a JSON object.' }
  if (parsed.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, error: `Unsupported schema version (expected ${SCHEMA_VERSION}).` }
  }
  for (const key of ['completedLessons', 'srs', 'introduced'] as const) {
    if (!isRecord(parsed[key])) return { ok: false, error: `Missing or invalid "${key}".` }
  }
  const settings = { ...defaultSettings(), ...(isRecord(parsed.settings) ? parsed.settings : {}) }
  return {
    ok: true,
    data: {
      schemaVersion: SCHEMA_VERSION,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      completedLessons: parsed.completedLessons as Record<string, string>,
      srs: parsed.srs as Record<string, SrsEntry>,
      introduced: parsed.introduced as Record<string, string>,
      examScores: (isRecord(parsed.examScores) ? parsed.examScores : {}) as Record<string, number>,
      lessonScores: (isRecord(parsed.lessonScores) ? parsed.lessonScores : {}) as Record<string, LessonScore>,
      mistakes: (Array.isArray(parsed.mistakes) ? parsed.mistakes : []) as Mistake[],
      writingRatings: (Array.isArray(parsed.writingRatings) ? parsed.writingRatings : []) as WritingRating[],
      examHistory: (Array.isArray(parsed.examHistory) ? parsed.examHistory : []) as ExamAttempt[],
      skillStats: (isRecord(parsed.skillStats) ? parsed.skillStats : {}) as Record<string, SkillStat>,
      dayStats: (isRecord(parsed.dayStats) ? parsed.dayStats : {}) as Record<string, DayStat>,
      notes: (isRecord(parsed.notes) ? parsed.notes : {}) as Record<string, string>,
      settings: settings as Settings,
    },
  }
}

export const useProgress = defineStore('progress', () => {
  const completedLessons = ref<Record<string, string>>({})
  const srs = ref<Record<string, SrsEntry>>({})
  const introduced = ref<Record<string, string>>({})
  const examScores = ref<Record<string, number>>({})
  const lessonScores = ref<Record<string, LessonScore>>({})
  const mistakes = ref<Mistake[]>([])
  const writingRatings = ref<WritingRating[]>([])
  const examHistory = ref<ExamAttempt[]>([])
  const skillStats = ref<Record<string, SkillStat>>({})
  const dayStats = ref<Record<string, DayStat>>({})
  const notes = ref<Record<string, string>>({})
  const settings = ref<Settings>(defaultSettings())
  const loaded = ref(false)

  function persistNow() {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, serializeState({
      completedLessons: completedLessons.value,
      srs: srs.value,
      introduced: introduced.value,
      examScores: examScores.value,
      lessonScores: lessonScores.value,
      mistakes: mistakes.value,
      writingRatings: writingRatings.value,
      examHistory: examHistory.value,
      skillStats: skillStats.value,
      dayStats: dayStats.value,
      notes: notes.value,
      settings: settings.value,
    }))
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null
  function persistSoon() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(persistNow, 300)
  }

  function applyData(data: PersistedState) {
    completedLessons.value = data.completedLessons
    srs.value = data.srs
    introduced.value = data.introduced
    examScores.value = data.examScores
    lessonScores.value = data.lessonScores
    mistakes.value = data.mistakes
    writingRatings.value = data.writingRatings
    examHistory.value = data.examHistory
    skillStats.value = data.skillStats
    dayStats.value = data.dayStats
    notes.value = data.notes
    settings.value = data.settings
  }

  function load() {
    if (loaded.value || typeof window === 'undefined') return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const v = validateBackup(raw)
      if (v.ok) applyData(v.data)
    }
    loaded.value = true
    watch(
      [completedLessons, srs, introduced, examScores, lessonScores, mistakes, writingRatings, examHistory, skillStats, dayStats, notes, settings],
      persistSoon,
      { deep: true },
    )
  }

  const isDone = (id: string) => id in completedLessons.value
  function markDone(id: string) {
    completedLessons.value[id] = todayIso()
  }
  function unmarkDone(id: string) {
    delete completedLessons.value[id]
  }

  const isIntroduced = (id: string) => id in srs.value
  function introduceCard(id: string) {
    if (srs.value[id]) return
    const today = todayIso()
    srs.value[id] = freshEntry(today)
    introduced.value[id] = today
  }
  function reviewCard(id: string, grade: Grade) {
    srs.value[id] = gradeCard(srs.value[id], grade, todayIso())
  }

  const dueIds = computed(() => dueCardIds(srs.value, todayIso()))
  const wordsSeen = computed(() => Object.keys(srs.value).length)
  const wordsLearned = computed(
    () => Object.values(srs.value).filter(e => e.intervalDays >= 21).length,
  )

  function recordExam(id: string, percent: number, seconds = 0) {
    const prev = examScores.value[id] ?? 0
    examScores.value[id] = Math.max(prev, percent)
    examHistory.value.unshift({ id, pct: percent, seconds, date: todayIso() })
    if (examHistory.value.length > 50) examHistory.value.length = 50
  }

  function recordLesson(id: string, correct: number, total: number) {
    if (total <= 0) return
    lessonScores.value[id] = { correct, total, date: todayIso() }
  }

  function logMistakes(items: { q: string; a: string; ex?: Mistake['ex'] }[]) {
    if (items.length === 0) return
    const today = todayIso()
    for (const item of items) {
      const i = mistakes.value.findIndex(m => m.q === item.q)
      if (i !== -1) {
        // relapse of a known mistake: reopen it and reset its retry clock
        const prev = mistakes.value[i]!
        mistakes.value.splice(i, 1)
        mistakes.value.unshift({ ...prev, ...item, date: today, r1: undefined, r2: undefined, closed: false })
      } else {
        mistakes.value.unshift({ ...item, date: today })
      }
    }
    if (mistakes.value.length > 100) mistakes.value.length = 100
  }

  function recordRetry(q: string, ok: boolean) {
    const i = mistakes.value.findIndex(m => m.q === q && !m.closed)
    if (i === -1) return
    mistakes.value[i] = applyRetry(mistakes.value[i]!, ok, todayIso())
  }

  const dueRetries = computed(() => mistakes.value.filter(m => isDue(m, todayIso())))

  function addWriting(task: string, text: string, score: number | null, note = '') {
    writingRatings.value.unshift({
      task: task.slice(0, 120),
      text: text.slice(0, 1500),
      score,
      note: note.slice(0, 300) || undefined,
      date: todayIso(),
    })
    if (writingRatings.value.length > 100) writingRatings.value.length = 100
  }

  function recordRun(perType: Record<string, { correct: number; total: number }>) {
    const today = todayIso()
    const day = dayStats.value[today] ?? { seconds: 0, correct: 0, total: 0 }
    for (const [type, t] of Object.entries(perType)) {
      const cur = skillStats.value[type] ?? { correct: 0, total: 0 }
      skillStats.value[type] = { correct: cur.correct + t.correct, total: cur.total + t.total }
      day.correct += t.correct
      day.total += t.total
    }
    dayStats.value[today] = day
  }

  function setNote(key: string, text: string) {
    if (text.trim().length === 0) delete notes.value[key]
    else notes.value[key] = text.trim().slice(0, 500)
  }

  function addTime(seconds: number) {
    const today = todayIso()
    const day = dayStats.value[today] ?? { seconds: 0, correct: 0, total: 0 }
    day.seconds += seconds
    dayStats.value[today] = day
  }

  function exportBackup(): string {
    settings.value.lastBackupAt = todayIso()
    return serializeState({
      completedLessons: completedLessons.value,
      srs: srs.value,
      introduced: introduced.value,
      examScores: examScores.value,
      lessonScores: lessonScores.value,
      mistakes: mistakes.value,
      writingRatings: writingRatings.value,
      examHistory: examHistory.value,
      skillStats: skillStats.value,
      dayStats: dayStats.value,
      notes: notes.value,
      settings: settings.value,
    })
  }

  function importBackup(json: string): { ok: boolean; error?: string } {
    const v = validateBackup(json)
    if (!v.ok) return { ok: false, error: v.error }
    applyData(v.data)
    persistNow()
    return { ok: true }
  }

  function resetAll() {
    completedLessons.value = {}
    srs.value = {}
    introduced.value = {}
    examScores.value = {}
    lessonScores.value = {}
    mistakes.value = []
    writingRatings.value = []
    examHistory.value = []
    skillStats.value = {}
    dayStats.value = {}
    notes.value = {}
    settings.value = defaultSettings()
    persistNow()
  }

  return {
    completedLessons, srs, introduced, examScores, lessonScores, mistakes,
    writingRatings, examHistory, skillStats, dayStats, notes, settings, loaded,
    load, isDone, markDone, unmarkDone,
    isIntroduced, introduceCard, reviewCard, recordExam, recordLesson, logMistakes,
    recordRetry, dueRetries,
    addWriting, recordRun, addTime, setNote,
    dueIds, wordsSeen, wordsLearned,
    exportBackup, importBackup, resetAll,
  }
})
