<template>
  <div class="page stack">
    <h1>Path</h1>

    <PathTabs v-model="tab" :tabs="PATH_TABS" />

    <!-- MAIN — the spine -->
    <section v-show="tab === 'main'" v-for="ch in curriculum" :key="ch.id" class="stack chapter">
      <button
        class="chapter-head"
        :class="{ open: isOpen(ch.id), 'ch-done': isChapterDone(ch) }"
        :aria-expanded="isOpen(ch.id)"
        @click="toggle(ch.id)"
      >
        <span class="head-text">
          <span class="title">{{ ch.title }}</span>
          <span class="muted small">{{ ch.subtitle }}</span>
          <ProgressBar class="head-bar" :value="required(ch).length ? doneIn(ch) / required(ch).length : 0" />
        </span>
        <span class="head-meta">
          <span class="muted small">{{ isChapterDone(ch) ? '✓ done' : `${doneIn(ch)}/${required(ch).length}` }}</span>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
      <template v-if="isOpen(ch.id)">
        <template v-for="(day, di) in daysFor(ch)" :key="`${ch.id}-day-${di}`">
          <button
            :id="day.current ? 'current-day' : undefined"
            class="day-head"
            :class="{ 'day-done': day.done, 'day-current': day.current }"
            @click="toggleDay(day)"
          >
            <span>{{ day.label }} <span v-if="day.done && !isDayOpen(day)" class="collapsed-hint">▸</span></span>
            <span class="muted small">
              {{ day.done ? '✓ done' : `~${day.minutes} min` }}<template v-if="day.score !== undefined"> · {{ day.score }}%</template>
            </span>
          </button>
          <template v-if="isDayOpen(day)">
            <LessonCard v-for="l in day.lessons" :key="l.id" :lesson="l" />
          </template>
        </template>
      </template>
    </section>

    <!-- ORAL — listening ladder + speaking briefs -->
    <template v-if="tab === 'oral'">
      <div class="oral-toggle" role="tablist">
        <button class="ot" :class="{ on: oralSub === 'listening' }" @click="oralSub = 'listening'">Listening</button>
        <button class="ot" :class="{ on: oralSub === 'speaking' }" @click="oralSub = 'speaking'">Speaking</button>
      </div>

      <template v-if="oralSub === 'listening'">
        <p class="muted small">
          The ladder trains <strong>segmentation</strong> — hearing where words split.
          Difficulty rises by speed and fusion, never vocabulary. Minutes matter, scores don't.
        </p>
        <component
          :is="oralState(d) === 'locked' ? 'div' : NuxtLinkC"
          v-for="d in oralLadder"
          :key="d.day"
          :to="oralState(d) === 'locked' ? undefined : `/oral/${d.day}`"
          class="card ladder-row spread"
          :class="[`is-${oralState(d)}`, 'oral-row']"
        >
          <span class="small row-main">
            <strong>Day {{ d.day }}</strong> · {{ kindIcon(d.kind) }} {{ oralDayTitle(d) }}
          </span>
          <span class="small row-side" :class="{ muted: oralState(d) !== 'done' }">
            {{ oralState(d) === 'done' ? '✓' : oralState(d) === 'locked' ? '🔒' : `~${oralDayMinutes(d)} min` }}
          </span>
        </component>
      </template>

      <template v-else>
        <div v-if="!progress.settings.speakingUnlocked" class="card stack">
          <p><strong>🔒 Speaking unlocks a bit later.</strong></p>
          <p class="muted small">
            Speaking too early just rehearses your own errors — listen more than you speak
            until comprehension is steadier (story scores around 70%+). The briefs below are
            ready and waiting.
          </p>
          <button class="btn btn-block" @click="progress.settings.speakingUnlocked = true">
            I understand — unlock anyway
          </button>
        </div>
        <template v-else>
          <p class="muted small">
            ~2× per week, not daily. Copy a brief, open a <strong>voice AI</strong>
            (Claude voice mode works), paste, and speak. The app is the curriculum;
            the voice AI is the practice room.
          </p>
          <div v-for="b in speakingBriefs" :key="b.id" class="card stack brief">
            <div class="spread">
              <strong>{{ b.theme }}</strong>
              <span class="chip">{{ b.level }}</span>
            </div>
            <p class="muted small">{{ b.targetStructures.join(' · ') }}</p>
            <div v-for="(ph, i) in b.usefulPhrases" :key="i" class="small phrase">
              {{ ph.fr }} <span class="muted">— {{ ph.en }}</span>
            </div>
            <button class="btn btn-block" @click="copyBrief(b)">
              {{ copiedBrief === b.id ? '✓ Copied — paste into a voice AI chat' : '📋 Copy speaking brief' }}
            </button>
          </div>
        </template>
      </template>
    </template>

    <!-- GRAMMAR — one pattern a day -->
    <template v-if="tab === 'grammar'">
      <p class="muted small">
        One practical pattern per day, sequenced from <strong>your own past mistakes</strong>.
        Rule in plain words, then you produce eight sentences. No terminology.
      </p>
      <component
        :is="gramState(g) === 'locked' ? 'div' : NuxtLinkC"
        v-for="g in grammarLadder"
        :key="g.day"
        :to="gramState(g) === 'locked' ? undefined : `/grammar/${g.day}`"
        class="card ladder-row spread"
        :class="[`is-${gramState(g)}`, 'gram-row']"
      >
        <span class="small row-main">
          <strong>Day {{ g.day }}</strong> · 📐 {{ g.topic }}
          <span v-if="g.review" class="chip review-chip">review</span>
        </span>
        <span class="small row-side" :class="{ muted: gramState(g) !== 'done' }">
          {{ gramState(g) === 'done' ? (gramScore(g) !== undefined ? `✓ ${gramScore(g)}%` : '✓') : gramState(g) === 'locked' ? '🔒' : '~6 min' }}
        </span>
      </component>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Chapter, Lesson } from '~/types/content'
import { curriculum, isOptional, programDays } from '~/content'

const progress = useProgress()

// --- three-path tabs ---
import type { GrammarLesson as GLesson, OralDay } from '~/types/content'
import { grammarDayKey, grammarLadder, oralDayKey, oralDayMinutes, oralDayTitle, oralLadder, speakingBriefs } from '~/content/paths'
import type { SpeakingBrief } from '~/types/content'

const NuxtLinkC = resolveComponent('NuxtLink')

const PATH_TABS = [
  { id: 'main', label: 'Main', color: 'var(--path-main-text)' },
  { id: 'oral', label: 'Oral', color: 'var(--path-oral-text)' },
  { id: 'grammar', label: 'Grammar', color: 'var(--path-grammar-text)' },
]
const tab = ref(typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('parcours.pathTab') ?? 'main') : 'main')
watch(tab, t => sessionStorage.setItem('parcours.pathTab', t))
const oralSub = ref<'listening' | 'speaking'>('listening')

const oralCurrentDay = computed(() => oralLadder.find(d => !progress.isDone(oralDayKey(d.day)))?.day)
function oralState(d: OralDay): 'done' | 'current' | 'locked' {
  if (progress.isDone(oralDayKey(d.day))) return 'done'
  return d.day === oralCurrentDay.value ? 'current' : 'locked'
}
const gramCurrentDay = computed(() => grammarLadder.find(g => !progress.isDone(grammarDayKey(g.day)))?.day)
function gramState(g: GLesson): 'done' | 'current' | 'locked' {
  if (progress.isDone(grammarDayKey(g.day))) return 'done'
  return g.day === gramCurrentDay.value ? 'current' : 'locked'
}
function gramScore(g: GLesson): number | undefined {
  const sc = progress.lessonScores[grammarDayKey(g.day)]
  return sc && sc.total > 0 ? Math.round((sc.correct / sc.total) * 100) : undefined
}
function kindIcon(kind: OralDay['kind']): string {
  return kind === 'passive' ? '🎧' : kind === 'story' ? '📖' : '🎯'
}

const copiedBrief = ref('')
async function copyBrief(b: SpeakingBrief) {
  try {
    await navigator.clipboard.writeText(b.copyBlock)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = b.copyBlock
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copiedBrief.value = b.id
  setTimeout(() => { copiedBrief.value = '' }, 4000)
}

const required = (ch: Chapter) => ch.lessons.filter(l => !isOptional(l))
const doneIn = (ch: Chapter) => required(ch).filter(l => progress.isDone(l.id)).length

interface Day {
  label: string
  lessons: Lesson[]
  minutes: number
  done: boolean
  current: boolean
  score?: number
}

function dayScore(lessons: Lesson[]): number | undefined {
  const pcts: number[] = []
  for (const l of lessons) {
    const s = progress.lessonScores[l.id]
    if (s && s.total > 0) pcts.push((s.correct / s.total) * 100)
    else if (l.type === 'exam' && progress.examScores[l.id] !== undefined) pcts.push(progress.examScores[l.id]!)
  }
  if (pcts.length === 0) return undefined
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

// Chapter days come from the shared program-day model (globally numbered,
// same numbers the Today tab uses).
const globalCurrentDay = computed(() =>
  programDays.find(d => d.lessons.some(l => !isOptional(l) && !progress.isDone(l.id))),
)

function daysFor(ch: Chapter): Day[] {
  return programDays
    .filter(d => d.chapterId === ch.id)
    .map((d) => {
      const req = d.lessons.filter(l => !isOptional(l))
      return {
        label: `Day ${d.number}`,
        lessons: d.lessons,
        minutes: req.reduce((s, l) => s + l.durationMin, 0),
        done: req.every(l => progress.isDone(l.id)),
        current: d === globalCurrentDay.value,
        score: dayScore(d.lessons),
      }
    })
}

const currentChapterId = computed(
  () => curriculum.find(ch => doneIn(ch) < required(ch).length)?.id ?? curriculum[0]?.id,
)

const isChapterDone = (ch: Chapter) => doneIn(ch) >= required(ch).length

// land the user on today's work: the current chapter is expanded by default,
// so its current-day node exists right after mount
onMounted(() => {
  nextTick(() => {
    document.getElementById('current-day')?.scrollIntoView({ block: 'center' })
  })
})

const open = ref<Record<string, boolean>>({})
const isOpen = (id: string) => open.value[id] ?? id === currentChapterId.value
const toggle = (id: string) => { open.value[id] = !isOpen(id) }

// completed days fold into their header; current & future days stay expanded
const dayOpen = ref<Record<string, boolean>>({})
const isDayOpen = (day: Day) => dayOpen.value[day.label] ?? !day.done
const toggleDay = (day: Day) => {
  dayOpen.value[day.label] = !isDayOpen(day)
}
</script>

<style scoped>
.chapter { margin-bottom: 10px; }
.chapter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  color: var(--fg);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, background 0.15s ease;
}
.chapter-head:active { transform: scale(0.985); background: var(--accent-soft); }
.chapter-head.open { border-color: var(--accent); }
.chapter-head.ch-done { opacity: 0.65; }
.head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.head-bar { margin-top: 4px; }
.title { font-size: 1.05rem; font-weight: 650; }
.head-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.chev { width: 20px; height: 20px; color: var(--muted); transition: transform 0.2s ease; }
.chapter-head.open .chev { transform: rotate(90deg); }
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 2px 0;
  padding: 4px 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: none;
  border: 0;
  width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.collapsed-hint { font-weight: 400; }
.day-head.day-current { color: var(--accent); }
.day-head.day-done { opacity: 0.6; }
.oral-toggle {
  display: flex;
  gap: 4px;
  border: 1px solid var(--path-oral);
  border-radius: 10px;
  padding: 3px;
  align-self: stretch;
}
.ot {
  flex: 1;
  background: none;
  border: 0;
  border-radius: 7px;
  padding: 7px;
  color: var(--muted);
  font-weight: 650;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ot.on { background: var(--path-oral-soft); color: var(--path-oral-text); }
.ladder-row { padding: 12px 14px; text-decoration: none; color: var(--fg); }
.ladder-row.is-locked { opacity: 0.45; }
.ladder-row.is-done { opacity: 0.7; }
.oral-row.is-current { border-color: var(--path-oral); }
.gram-row.is-current { border-color: var(--path-grammar); }
.row-main { min-width: 0; }
.row-side { flex-shrink: 0; }
.review-chip { background: var(--path-grammar-soft); color: var(--path-grammar-text); margin-left: 6px; }
.brief .phrase { padding: 2px 0; }

</style>
