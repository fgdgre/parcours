<template>
  <div class="page stack">
    <h1>Progress</h1>

    <PathTabs v-model="ptab" :tabs="PROGRESS_TABS" />

    <template v-if="ptab === 'all'">
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

    </template>

    <template v-if="ptab === 'main'">
    <div class="path-scope scope-main stack">
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
        <div v-for="(r, i) in visibleWritings" :key="i" class="spread">
          <span class="muted small rating-task">{{ r.task }}</span>
          <input
            v-if="editingScore === i"
            ref="scoreEl"
            v-model.number="editValue"
            class="input score-input"
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            placeholder="NN"
            @keydown.enter="commitScore(i)"
            @blur="commitScore(i)"
          >
          <button v-else class="score-btn small" :class="{ missing: r.score === null }" @click="startScoreEdit(i, r.score)">
            {{ r.score ?? '＋ add' }}
          </button>
        </div>
        <p class="muted small">Tap a score to add or fix the AI rating from your review chat.</p>
        <button
          v-if="progress.writingRatings.length > 10"
          class="btn btn-block show-all"
          @click="toggleShowAll"
        >
          {{ showAllWritings ? 'Show fewer' : `Show all (${progress.writingRatings.length})` }}
        </button>
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
      <div class="spread">
        <h2>Recent mistakes</h2>
        <NuxtLink to="/mistakes" class="chip">🔁 Retry tab →</NuxtLink>
      </div>
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

    </div>
    </template>

    <template v-if="ptab === 'all'">
    <h2>Backup</h2>
    <div class="card stack">
      <p class="muted small">
        Your progress lives only in this browser. Export a backup file from time to time.
      </p>
      <div class="spread">
        <span class="muted small">Storage used</span>
        <span class="small">{{ storageKb }} KB <span class="muted">of ~5,000 KB</span></span>
      </div>
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
    </template>

    <!-- ORAL -->
    <template v-if="ptab === 'oral'">
    <div class="path-scope scope-oral stack">
      <div class="stats">
        <div class="card stat">
          <span class="num oral-num">{{ listenMinutes7 }}</span>
          <span class="muted small">min listened · 7 days</span>
        </div>
        <div class="card stat">
          <span class="num oral-num">{{ listenMinutesTotal }}</span>
          <span class="muted small">min listened · total</span>
        </div>
      </div>
      <p class="muted small">
        Minutes are the <strong>leading</strong> indicator; the weekly dictation score is the lagging one.
        Segmentation improves in plateaus, then jumps.
      </p>
      <h2>Listening ladder</h2>
      <div class="card stack">
        <div class="spread">
          <span>Days completed</span>
          <strong class="oral-num">{{ oralDone }}/{{ oralLadder.length }}</strong>
        </div>
        <ProgressBar :value="oralLadder.length ? oralDone / oralLadder.length : 0" />
        <div v-for="d in oralStoryScores" :key="d.day" class="spread">
          <span class="muted small">Day {{ d.day }} · {{ d.title }}</span>
          <span class="small" :class="qualityClass(d.pct)">{{ d.pct }}%</span>
        </div>
        <p v-if="oralStoryScores.length === 0" class="muted small">Story scores appear here from Day 7.</p>
      </div>
    </div>
    </template>

    <!-- GRAMMAR -->
    <template v-if="ptab === 'grammar'">
    <div class="path-scope scope-grammar stack">
      <h2>Pattern ladder</h2>
      <div class="card stack">
        <div class="spread">
          <span>Patterns done</span>
          <strong class="gram-num">{{ gramDone }}/{{ grammarLadder.length }}</strong>
        </div>
        <ProgressBar :value="grammarLadder.length ? gramDone / grammarLadder.length : 0" />
        <div class="spread">
          <span>Production accuracy</span>
          <span :class="gramAccuracy !== undefined ? qualityClass(gramAccuracy) : 'muted'">
            {{ gramAccuracy !== undefined ? `${gramAccuracy}%` : '—' }}
          </span>
        </div>
        <div v-for="g in gramScores" :key="g.day" class="spread">
          <span class="muted small">Day {{ g.day }} · {{ g.topic }}</span>
          <span class="small" :class="qualityClass(g.pct)">{{ g.pct }}%</span>
        </div>
      </div>
      <p class="muted small">Misses feed the same retry queue as everything else — grammar closes through 🔁 too.</p>
    </div>
    </template>

    <!-- shared cross-path summary, same All tab -->
    <template v-if="ptab === 'all'">
      <div class="stats">
        <div class="card stat">
          <span class="num">{{ minutes7 }}</span>
          <span class="muted small">min studied · 7 days</span>
        </div>
        <div class="card stat">
          <span class="num oral-num">{{ listenMinutes7 }}</span>
          <span class="muted small">of them listening</span>
        </div>
      </div>
      <h2>The three paths</h2>
      <div class="card stack">
        <div class="spread"><span>🧭 Main · lessons done</span><strong class="main-num">{{ lessonsDone }}</strong></div>
        <div class="spread"><span>🎧 Oral · ladder</span><strong class="oral-num">{{ oralDone }}/{{ oralLadder.length }}</strong></div>
        <div class="spread"><span>📐 Grammar · ladder</span><strong class="gram-num">{{ gramDone }}/{{ grammarLadder.length }}</strong></div>
      </div>
      <template v-if="weakest.length > 0">
        <h2>Where the points are</h2>
        <div class="card stack">
          <div v-for="s2 in weakest" :key="s2.type" class="spread">
            <span class="small">{{ s2.label }}</span>
            <span class="small" :class="qualityClass(s2.pct)">{{ s2.pct }}%</span>
          </div>
          <p class="muted small">Your three lowest skills — the annex paths exist for exactly these.</p>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '~/types/content'
import { allLessons, cardsById, curriculum, isOptional } from '~/content'
import { buildMistakesPrompt, buildProgressReviewPrompt } from '~/utils/reviewPrompt'
import { STORAGE_KEY } from '~/stores/progress'
import { addDays, todayIso } from '~/utils/srs'

const progress = useProgress()

// --- mirrored path tabs ---
import { grammarDayKey, grammarLadder, oralDayKey, oralDayTitle, oralLadder } from '~/content/paths'

const PROGRESS_TABS = [
  { id: 'all', label: 'All', color: 'var(--accent)' },
  { id: 'main', label: 'Main', color: 'var(--path-main-text)' },
  { id: 'oral', label: 'Oral', color: 'var(--path-oral-text)' },
  { id: 'grammar', label: 'Grammar', color: 'var(--path-grammar-text)' },
]
const ptab = ref('all')

const storageKb = ref(0)
function refreshStorageKb() {
  // localStorage strings are UTF-16: 2 bytes per code unit against the ~5MB quota
  storageKb.value = Math.round(((localStorage.getItem(STORAGE_KEY)?.length ?? 0) * 2) / 1024)
}
onMounted(refreshStorageKb)

const listenMinutesTotal = computed(() =>
  Math.round(Object.values(progress.listenStats).reduce((a, b) => a + b, 0) / 60))
const listenMinutes7 = computed(() => {
  const cutoff = addDays(todayIso(), -6)
  return Math.round(Object.entries(progress.listenStats)
    .filter(([d]) => d >= cutoff)
    .reduce((a, [, sec]) => a + sec, 0) / 60)
})
const oralDone = computed(() => oralLadder.filter(d => progress.isDone(oralDayKey(d.day))).length)
const gramDone = computed(() => grammarLadder.filter(g => progress.isDone(grammarDayKey(g.day))).length)
const oralStoryScores = computed(() => oralLadder
  .filter(d => d.kind === 'story' || d.kind === 'rla')
  .map((d) => {
    const sc = progress.lessonScores[oralDayKey(d.day)]
    return sc && sc.total > 0
      ? { day: d.day, title: oralDayTitle(d), pct: Math.round((sc.correct / sc.total) * 100) }
      : null
  })
  .filter((x): x is { day: number; title: string; pct: number } => x !== null))
const gramScores = computed(() => grammarLadder
  .map((g) => {
    const sc = progress.lessonScores[grammarDayKey(g.day)]
    return sc && sc.total > 0
      ? { day: g.day, topic: g.topic, pct: Math.round((sc.correct / sc.total) * 100) }
      : null
  })
  .filter((x): x is { day: number; topic: string; pct: number } => x !== null))
const gramAccuracy = computed(() => {
  const scs = grammarLadder
    .map(g => progress.lessonScores[grammarDayKey(g.day)])
    .filter((sc): sc is NonNullable<typeof sc> => !!sc && sc.total > 0)
  if (scs.length === 0) return undefined
  const c = scs.reduce((a, sc) => a + sc.correct, 0)
  const t = scs.reduce((a, sc) => a + sc.total, 0)
  return Math.round((c / t) * 100)
})

// tap-to-backfill for AI writing ratings that were never recorded
const showAllWritings = ref(false)
const visibleWritings = computed(() =>
  showAllWritings.value ? progress.writingRatings : progress.writingRatings.slice(0, 10),
)
// iOS never blurs an input that unmounts — commit an open editor before
// the toggle rips its row out of the DOM
function toggleShowAll() {
  if (editingScore.value !== null) commitScore(editingScore.value)
  showAllWritings.value = !showAllWritings.value
}

const editingScore = ref<number | null>(null)
// v-model.number hands back '' when the field is emptied
const editValue = ref<number | '' | null>(null)
const scoreEl = ref<HTMLInputElement[]>([])
function startScoreEdit(i: number, current: number | null) {
  editingScore.value = i
  editValue.value = current
  // focus opens the phone keyboard AND guarantees the blur-commit path exists
  nextTick(() => scoreEl.value[0]?.focus())
}
function commitScore(i: number) {
  if (editingScore.value !== i) return
  if (typeof editValue.value === 'number' && editValue.value >= 0 && editValue.value <= 100) {
    progress.setWritingScore(i, editValue.value)
  }
  editingScore.value = null
}

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
  { type: 'type', label: 'Translation (word bank)' },
  { type: 'spelling', label: 'Spelling (keyboard, strict accents)' },
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

const weakest = computed(() => [...skillRows.value].sort((a, b) => a.pct - b.pct).slice(0, 3))

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
    oralPath: {
      listenSecondsByDay: progress.listenStats,
      listenedMinutesTotal: listenMinutesTotal.value,
      ladderDone: `${oralDone.value}/${oralLadder.length}`,
      storyScores: oralStoryScores.value,
    },
    grammarPath: {
      ladderDone: `${gramDone.value}/${grammarLadder.length}`,
      accuracyPct: gramAccuracy.value ?? null,
      dayScores: gramScores.value,
    },
    myNotes: progress.notes,
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
  setTimeout(refreshStorageKb, 600)
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
  setTimeout(refreshStorageKb, 600)
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const result = progress.importBackup(await file.text())
  ioOk.value = result.ok
  ioMessage.value = result.ok ? 'Backup imported.' : `Import failed: ${result.error}`
  ;(e.target as HTMLInputElement).value = ''
}

function resetAll() {
  setTimeout(refreshStorageKb, 600)
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
.score-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 4px 10px;
  min-height: 32px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.score-btn.missing { color: var(--muted); border-style: dashed; }
.show-all { color: var(--muted); border-style: dashed; }
.score-input { width: 70px; min-height: 36px; text-align: center; padding: 4px; }
.path-scope.scope-main { --accent: var(--path-main-text); }
.path-scope.scope-oral { --accent: var(--path-oral-text); }
.path-scope.scope-grammar { --accent: var(--path-grammar-text); }
.path-scope .num, .path-scope h2 { color: var(--accent); }
.oral-num { color: var(--path-oral-text); }
.gram-num { color: var(--path-grammar-text); }
.main-num { color: var(--path-main-text); }
</style>
