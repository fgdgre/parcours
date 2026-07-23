<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
    <h1>Retry mistakes</h1>

    <div v-if="progress.mistakes.length === 0" class="card stack">
      <p class="muted">No mistakes logged yet — they'll collect here as you practice, and come back for retries after 2 days, then a week.</p>
    </div>

    <template v-else-if="mode === 'list'">
      <p class="muted small">
        A mistake closes only after <strong>two clean retries, spaced days apart</strong>.
        Fail a retry and it reopens. Rule links go to the exact grammar page for that gap.
      </p>

      <div v-if="due.length > 0" class="card due-card stack">
        <div class="spread">
          <strong>🔁 {{ due.length }} due for retry</strong>
          <span class="muted small">~{{ Math.ceil(due.length * 0.75) }} min</span>
        </div>
        <button class="btn btn-primary btn-block" @click="startSession">Start retry session</button>
      </div>
      <div v-else class="card">
        <p class="muted small">✓ Nothing due right now. Next retries unlock as their dates arrive.</p>
      </div>

      <template v-if="open.length > 0">
        <h2>Open ({{ open.length }})</h2>
        <div v-for="(m, i) in open" :key="`o-${i}`" class="card mistake stack">
          <p class="small q">{{ m.q }}</p>
          <p class="small a">→ {{ m.a }}</p>
          <div class="row meta">
            <span class="chip" :class="m.r1 ? 'half' : ''">{{ m.r1 ? '◐ 1 of 2 clean' : '○ not retried yet' }}</span>
            <span class="muted small">{{ dueLabel(m) }}</span>
          </div>
          <a v-if="ruleFor(m)" :href="ruleFor(m)!.url" target="_blank" rel="noopener" class="small rule">
            📖 {{ ruleFor(m)!.title }} ↗
          </a>
        </div>
      </template>

      <template v-if="closed.length > 0">
        <button class="btn closed-toggle" @click="showClosed = !showClosed">
          ✅ Closed ({{ closed.length }}) {{ showClosed ? '▲' : '▼' }}
        </button>
        <template v-if="showClosed">
          <div v-for="(m, i) in closed" :key="`c-${i}`" class="card mistake closed-item">
            <p class="small q">{{ m.q }}</p>
            <p class="small a">→ {{ m.a }}</p>
          </div>
        </template>
      </template>
    </template>

    <template v-else-if="mode === 'session'">
      <p class="muted small">Every answer saves immediately — quit any time, nothing is lost.</p>
      <ExerciseRunner
        :key="sessionKey"
        :exercises="sessionExercises"
        @answered="onAnswered"
        @finished="onFinished"
      />
      <button class="btn btn-block quit-btn" @click="endSession">
        End session — progress saved
      </button>
    </template>

    <div v-else class="card stack">
      <p class="score" :class="{ okline: summary.reset === 0 }">
        {{ summary.clean }}/{{ summary.clean + summary.reset }} clean
      </p>
      <p class="muted small">
        {{ summary.reset === 0
          ? 'Every retry clean — those mistakes are one step from closed.'
          : `${summary.reset} reset back to the start — they'll return in 2 days. That's the system working, not failing.` }}
      </p>
      <button class="btn btn-primary btn-block" @click="mode = 'list'">Back to the list</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/content'
import type { MistakeEntry } from '~/utils/retries'
import { isDue, nextDue, retryExercise } from '~/utils/retries'
import { ruleFor } from '~/utils/mistakeRules'
import { todayIso } from '~/utils/srs'

const router = useRouter()
const progress = useProgress()

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/')
}

const today = todayIso()
const due = computed(() => (progress.mistakes as MistakeEntry[]).filter(m => isDue(m, today)))
const open = computed(() => (progress.mistakes as MistakeEntry[]).filter(m => !m.closed))
const closed = computed(() => (progress.mistakes as MistakeEntry[]).filter(m => m.closed))
const showClosed = ref(false)

function dueLabel(m: MistakeEntry): string {
  const d = nextDue(m)
  if (!d) return ''
  return d <= today ? 'due now' : `retry on ${d}`
}

const mode = ref<'list' | 'session' | 'summary'>('list')
const sessionKey = ref(0)
const sessionExercises = ref<Exercise[]>([])
const sessionItems = ref<MistakeEntry[]>([])
const summary = ref({ clean: 0, reset: 0 })

function startSession() {
  sessionItems.value = [...due.value]
  sessionExercises.value = sessionItems.value.map(retryExercise)
  sessionKey.value += 1
  summary.value = { clean: 0, reset: 0 }
  mode.value = 'session'
}

// each answer records the retry the moment it happens — quitting mid-session
// (or the app dying) can no longer lose completed work
function onAnswered(p: { index: number; correct: boolean }) {
  const m = sessionItems.value[p.index]
  if (!m) return
  progress.recordRetry(m.q, p.correct, m.a)
  if (p.correct) summary.value.clean += 1
  else summary.value.reset += 1
}

function endSession() {
  mode.value = summary.value.clean + summary.value.reset > 0 ? 'summary' : 'list'
}

function onFinished() {
  mode.value = 'summary'
}
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background: none;
  border: 0;
  padding: 4px 8px 4px 0;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active { opacity: 0.6; }
.back-btn svg { width: 18px; height: 18px; }
.due-card { border-color: var(--accent); }
.mistake .q { margin: 0; color: var(--muted); }
.mistake .a { margin: 0; font-weight: 600; }
.meta { gap: 8px; }
.chip.half { background: var(--warn-soft); color: var(--warn); }
.rule { align-self: flex-start; }
.closed-toggle { border: 0; background: none; color: var(--muted); align-self: flex-start; padding: 4px 0; }
.closed-item { opacity: 0.55; }
.score { font-size: 1.4rem; font-weight: 700; }
.quit-btn { color: var(--muted); border-style: dashed; }
.okline { color: var(--ok); }
</style>
