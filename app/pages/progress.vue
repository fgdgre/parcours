<template>
  <div class="page stack">
    <h1>Progress</h1>

    <NuxtLink to="/guide" class="card spread">
      <span>📖 How to run this program</span>
      <span class="chip">Guide →</span>
    </NuxtLink>

    <div class="card stack review-card">
      <div class="spread">
        <span><strong>🧭 Check my progress</strong></span>
      </div>
      <p class="muted small">
        Copies your complete learning data (scores, mistakes, writing samples, study time) with a
        coach briefing. Paste into a new Claude chat for an honest level assessment, weak-side
        analysis, and an adaptive plan — including a spec for an extra focus chapter if you need one.
      </p>
      <button class="btn btn-primary btn-block" @click="copyProgressReview">
        {{ reviewCopied ? '✓ Copied — paste into a new Claude chat' : '📋 Copy for AI deep review' }}
      </button>
    </div>

    <div class="stats">
      <div class="card stat">
        <span class="num">{{ progress.wordsSeen }}</span>
        <span class="muted small">words seen</span>
      </div>
      <div class="card stat">
        <span class="num">{{ progress.wordsLearned }}</span>
        <span class="muted small">words learned</span>
      </div>
      <div class="card stat">
        <span class="num">{{ lessonsDone }}</span>
        <span class="muted small">lessons done</span>
      </div>
      <div class="card stat">
        <span class="num">{{ minutesDone }}</span>
        <span class="muted small">minutes studied</span>
      </div>
    </div>

    <h2>Insights</h2>
    <div class="card stack">
      <div class="spread">
        <span>⏱ Study time today</span>
        <strong>{{ minutesToday }} min</strong>
      </div>
      <div class="spread">
        <span class="muted small">Last 7 days</span>
        <span class="muted small">{{ minutes7 }} min</span>
      </div>
      <div class="trend" aria-label="minutes per day, last 14 days">
        <div v-for="x in last14" :key="x.d" class="bar-wrap" :title="`${x.d}: ${x.min} min`">
          <div class="bar" :style="{ height: `${trendMax ? Math.max(4, (x.min / trendMax) * 100) : 4}%` }" />
        </div>
      </div>
      <p class="muted small">Minutes per day, last two weeks.</p>
    </div>

    <template v-if="skillRows.length > 0">
      <h2>Skills</h2>
      <div class="card stack">
        <div v-for="s in skillRows" :key="s.type" class="stack skill">
          <div class="spread">
            <span class="small">{{ s.label }}</span>
            <span class="small" :class="qualityClass(s.pct)">{{ s.pct }}% <span class="muted">({{ s.total }} answered)</span></span>
          </div>
          <ProgressBar :value="s.pct / 100" />
        </div>
        <p class="muted small">Your lowest bar is where the next week's accent belongs.</p>
      </div>
    </template>

    <template v-if="progress.writingRatings.length > 0">
      <h2>Writing ratings</h2>
      <div class="card stack">
        <div class="spread">
          <span>Average (AI-rated, strict)</span>
          <strong :class="qualityClass(writingAvg)">{{ writingAvg }}/100</strong>
        </div>
        <div v-for="(r, i) in progress.writingRatings.slice(0, 3)" :key="i" class="spread">
          <span class="muted small rating-task">{{ r.task }}</span>
          <span class="small">{{ r.score ?? '—' }}</span>
        </div>
      </div>
    </template>

    <template v-if="hardestWords.length > 0">
      <h2>Hardest words</h2>
      <div class="card stack">
        <div v-for="w in hardestWords" :key="w.card.id" class="spread">
          <span class="small"><strong>{{ w.card.fr }}</strong> — {{ w.card.en }}</span>
          <span class="muted small">forgot ×{{ w.lapses }}</span>
        </div>
      </div>
    </template>

    <h2>Chapters</h2>
    <div v-for="ch in curriculum" :key="ch.id" class="stack chapter">
      <div class="spread">
        <span>{{ ch.title }}</span>
        <span class="muted small">
          {{ doneIn(ch) }}/{{ required(ch).length }}<template v-if="qualityOf(ch) !== undefined">
            · <span :class="qualityClass(qualityOf(ch)!)">{{ qualityOf(ch) }}% correct</span>
          </template>
        </span>
      </div>
      <ProgressBar :value="required(ch).length ? doneIn(ch) / required(ch).length : 0" />
    </div>

    <template v-if="progress.mistakes.length > 0">
      <h2>Recent mistakes</h2>
      <div class="card stack">
        <div v-for="(m, i) in progress.mistakes.slice(0, 8)" :key="i" class="mistake">
          <p class="small q">{{ m.q }}</p>
          <p class="small a">→ {{ m.a }}</p>
        </div>
        <p v-if="progress.mistakes.length > 8" class="muted small">
          +{{ progress.mistakes.length - 8 }} more in the log (last 100 kept)
        </p>
        <button class="btn btn-block" @click="copyMistakes">
          {{ mistakesCopied ? '✓ Copied — paste into a Claude chat' : '📋 Copy mistakes for AI review' }}
        </button>
        <p class="muted small">Gets your errors grouped into patterns, explained, and turned into a mini-drill.</p>
      </div>
    </template>

    <h2>Backup</h2>
    <div class="card stack">
      <p class="muted small">
        Your progress lives only in this browser. Export a backup file from time to time.
      </p>
      <button class="btn btn-block" @click="exportBackup">Export backup</button>
      <label class="btn btn-block import-label">
        Import backup
        <input type="file" accept="application/json" class="file-input" @change="importBackup">
      </label>
      <p v-if="ioMessage" class="small" :class="ioOk ? 'feedback-ok' : 'feedback-err'">{{ ioMessage }}</p>
    </div>

    <h2>Settings</h2>
    <div class="card stack">
      <label class="spread">
        <span>
          Strict accents
          <span class="muted small block">Typed answers must include é, è, ç…</span>
        </span>
        <input v-model="progress.settings.strictAccents" type="checkbox" class="switch">
      </label>
      <label class="stack rate">
        <span class="spread">
          <span>Speech speed</span>
          <span class="muted small">{{ progress.settings.ttsRate.toFixed(2) }}×</span>
        </span>
        <input v-model.number="progress.settings.ttsRate" type="range" min="0.7" max="1.1" step="0.05">
      </label>
    </div>

    <div class="card stack danger">
      <p class="muted small">Removes all progress, reviews and settings from this browser.</p>
      <button class="btn btn-block reset" @click="resetAll">Reset everything</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '~/types/content'
import { allLessons, cardsById, curriculum, isOptional } from '~/content'
import { buildMistakesPrompt, buildProgressReviewPrompt } from '~/utils/reviewPrompt'
import { addDays, todayIso } from '~/utils/srs'

const progress = useProgress()

const required = (ch: Chapter) => ch.lessons.filter(l => !isOptional(l))
const doneIn = (ch: Chapter) => required(ch).filter(l => progress.isDone(l.id)).length
const lessonsDone = computed(() => allLessons.filter(l => progress.isDone(l.id)).length)
const minutesDone = computed(() =>
  allLessons.filter(l => progress.isDone(l.id)).reduce((s, l) => s + l.durationMin, 0),
)

function qualityOf(ch: Chapter): number | undefined {
  const pcts: number[] = []
  for (const l of ch.lessons) {
    const s = progress.lessonScores[l.id]
    if (s && s.total > 0) pcts.push((s.correct / s.total) * 100)
    else if (l.type === 'exam' && progress.examScores[l.id] !== undefined) pcts.push(progress.examScores[l.id]!)
  }
  if (pcts.length === 0) return undefined
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

const qualityClass = (p: number) => (p >= 80 ? 'q-ok' : p >= 60 ? 'q-warn' : 'q-err')

// --- insights ---
const minutesToday = computed(() =>
  Math.round((progress.dayStats[todayIso()]?.seconds ?? 0) / 60),
)
const last14 = computed(() => {
  const out: { d: string; min: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = addDays(todayIso(), -i)
    out.push({ d, min: Math.round((progress.dayStats[d]?.seconds ?? 0) / 60) })
  }
  return out
})
const minutes7 = computed(() => last14.value.slice(7).reduce((s, x) => s + x.min, 0))
const trendMax = computed(() => Math.max(...last14.value.map(x => x.min)))

const SKILLS = [
  { type: 'mc', label: 'Recognition (quiz)' },
  { type: 'type', label: 'Translation (typing)' },
  { type: 'conjugate', label: 'Conjugation' },
  { type: 'dictation', label: 'Listening (dictation)' },
  { type: 'speak', label: 'Speaking' },
]
const skillRows = computed(() =>
  SKILLS.flatMap((s) => {
    const st = progress.skillStats[s.type]
    if (!st || st.total < 5) return []
    return [{ ...s, pct: Math.round((st.correct / st.total) * 100), total: st.total }]
  }),
)

const writingAvg = computed(() => {
  const rated = progress.writingRatings.filter(r => r.score !== null)
  if (rated.length === 0) return 0
  return Math.round(rated.reduce((s, x) => s + (x.score ?? 0), 0) / rated.length)
})

const hardestWords = computed(() =>
  Object.entries(progress.srs)
    .filter(([, e]) => e.lapses > 0)
    .sort((a, b) => b[1].lapses - a[1].lapses)
    .slice(0, 5)
    .flatMap(([id, e]) => {
      const card = cardsById[id]
      return card ? [{ card, lapses: e.lapses }] : []
    }),
)

const reviewCopied = ref(false)

async function copyToClipboard(payload: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(payload)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = payload
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

async function copyProgressReview() {
  const payload = {
    exportedAt: todayIso(),
    chapters: curriculum.map(ch => ({
      id: ch.id,
      title: ch.title,
      lessonsDone: doneIn(ch),
      lessonsTotal: required(ch).length,
      qualityPct: qualityOf(ch) ?? null,
    })),
    vocabulary: {
      wordsSeen: progress.wordsSeen,
      wordsLearned: progress.wordsLearned,
      hardestWords: hardestWords.value.map(w => ({ fr: w.card.fr, en: w.card.en, lapses: w.lapses })),
    },
    skills: Object.fromEntries(
      Object.entries(progress.skillStats).map(([type, s]) => [
        type, { correct: s.correct, total: s.total, pct: Math.round((s.correct / Math.max(1, s.total)) * 100) },
      ]),
    ),
    examHistory: progress.examHistory,
    recentMistakes: progress.mistakes.slice(0, 50),
    writings: progress.writingRatings.slice(0, 30),
    studyTime: progress.dayStats,
    settings: progress.settings,
  }
  await copyToClipboard(buildProgressReviewPrompt(payload))
  reviewCopied.value = true
  setTimeout(() => { reviewCopied.value = false }, 4000)
}

const mistakesCopied = ref(false)
async function copyMistakes() {
  const payload = buildMistakesPrompt(progress.mistakes.slice(0, 30))
  try {
    await navigator.clipboard.writeText(payload)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = payload
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  mistakesCopied.value = true
  setTimeout(() => { mistakesCopied.value = false }, 4000)
}

const ioMessage = ref('')
const ioOk = ref(true)

function exportBackup() {
  const blob = new Blob([progress.exportBackup()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `parcours-backup-${new Date().toLocaleDateString('sv-SE')}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  ioOk.value = true
  ioMessage.value = 'Backup downloaded.'
}

async function importBackup(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const result = progress.importBackup(await file.text())
  ioOk.value = result.ok
  ioMessage.value = result.ok ? 'Backup imported.' : `Import failed: ${result.error}`
  ;(e.target as HTMLInputElement).value = ''
}

function resetAll() {
  if (confirm('Delete ALL progress in this browser? Export a backup first if unsure.')) {
    progress.resetAll()
    ioOk.value = true
    ioMessage.value = 'Everything was reset.'
  }
}
</script>

<style scoped>
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.stat { display: flex; flex-direction: column; align-items: center; padding: 14px 8px; }
.num { font-size: 1.5rem; font-weight: 700; }
.chapter { margin-bottom: 8px; }
.block { display: block; }
.import-label { position: relative; overflow: hidden; }
.file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.switch { width: 22px; height: 22px; accent-color: var(--accent); }
.rate input { width: 100%; accent-color: var(--accent); }
.danger { border-color: var(--err); }
.reset { color: var(--err); border-color: var(--err); }
.q-ok { color: var(--ok); }
.q-warn { color: var(--warn); }
.q-err { color: var(--err); }
.trend { display: flex; align-items: flex-end; gap: 3px; height: 48px; }
.bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.bar { width: 100%; border-radius: 3px 3px 0 0; background: var(--accent); opacity: 0.75; }
.skill { gap: 4px; }
.rating-task { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mistake { padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.mistake .q { margin: 0; color: var(--muted); }
.mistake .a { margin: 2px 0 0; font-weight: 600; }
</style>
