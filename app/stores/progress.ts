import { defineStore } from 'pinia'
import type { Grade, SrsEntry } from '~/utils/srs'
import { dueCardIds, freshEntry, gradeCard, todayIso } from '~/utils/srs'

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = 'parcours.v1'

export interface Settings {
  strictAccents: boolean
  ttsRate: number
  preferKeyboard: boolean
}

export interface PersistedState {
  schemaVersion: number
  savedAt: string
  completedLessons: Record<string, string>
  srs: Record<string, SrsEntry>
  introduced: Record<string, string>
  examScores: Record<string, number>
  settings: Settings
}

export function defaultSettings(): Settings {
  return { strictAccents: false, ttsRate: 0.95, preferKeyboard: false }
}

export function serializeState(
  s: Pick<PersistedState, 'completedLessons' | 'srs' | 'introduced' | 'examScores' | 'settings'>,
): string {
  const payload: PersistedState = {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    completedLessons: s.completedLessons,
    srs: s.srs,
    introduced: s.introduced,
    examScores: s.examScores,
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
      settings: settings as Settings,
    },
  }
}

export const useProgress = defineStore('progress', () => {
  const completedLessons = ref<Record<string, string>>({})
  const srs = ref<Record<string, SrsEntry>>({})
  const introduced = ref<Record<string, string>>({})
  const examScores = ref<Record<string, number>>({})
  const settings = ref<Settings>(defaultSettings())
  const loaded = ref(false)

  function persistNow() {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, serializeState({
      completedLessons: completedLessons.value,
      srs: srs.value,
      introduced: introduced.value,
      examScores: examScores.value,
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
    watch([completedLessons, srs, introduced, examScores, settings], persistSoon, { deep: true })
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

  function recordExam(id: string, percent: number) {
    const prev = examScores.value[id] ?? 0
    examScores.value[id] = Math.max(prev, percent)
  }

  function exportBackup(): string {
    return serializeState({
      completedLessons: completedLessons.value,
      srs: srs.value,
      introduced: introduced.value,
      examScores: examScores.value,
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
    settings.value = defaultSettings()
    persistNow()
  }

  return {
    completedLessons, srs, introduced, examScores, settings, loaded,
    load, isDone, markDone, unmarkDone,
    isIntroduced, introduceCard, reviewCard, recordExam,
    dueIds, wordsSeen, wordsLearned,
    exportBackup, importBackup, resetAll,
  }
})
