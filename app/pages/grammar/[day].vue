<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>

    <template v-if="lesson && lockedAhead">
      <div class="card stack">
        <p><strong>🔒 Day {{ lesson.day }} is still locked.</strong></p>
        <p class="muted small">The ladder goes in order — finish the earlier days first.</p>
        <NuxtLink to="/path" class="btn btn-block">Back to the Path</NuxtLink>
      </div>
    </template>

    <template v-else-if="lesson">
      <div>
        <p class="path-label">📐 Grammar · Day {{ lesson.day }} of {{ grammarLadder.length }}<span v-if="lesson.review"> · review</span></p>
        <h1>{{ lesson.topic }}</h1>
      </div>

      <div v-if="done && !practicing" class="card stack">
        <p class="okline">✓ This pattern is done.</p>
        <p class="muted small">Run it again any time — reps are free.</p>
      </div>

      <template v-if="!practicing">
        <div class="card rule-card stack">
          <p class="rule">{{ lesson.rule }}</p>
        </div>
        <div class="card stack">
          <p class="muted small">See it in action:</p>
          <div v-for="(ex, i) in lesson.examples" :key="i" class="spread line">
            <span class="small"><strong>{{ ex.fr }}</strong><br><span class="muted">{{ ex.en }}</span></span>
            <span class="tts-pair">
              <button class="btn tts" aria-label="Hear it" @click="tts.speak(ex.fr, progress.settings.ttsRate)">🔊</button>
              <button class="btn tts" aria-label="Word by word" @click="tts.speakSlow(ex.fr, progress.settings.ttsRate)">🐢</button>
            </span>
          </div>
        </div>
        <button class="btn btn-primary btn-block" @click="practicing = true">
          Now produce it — {{ lesson.practice.length }} sentences
        </button>
      </template>

      <template v-else-if="!finishedRun">
        <button class="btn btn-block rule-peek" @click="showRule = !showRule">
          {{ showRule ? 'Hide the rule' : '📐 Peek at the rule' }}
        </button>
        <p v-if="showRule" class="muted small rule-text">{{ lesson.rule }}</p>
        <ExerciseRunner
          :key="lesson.id"
          :exercises="session.items"
          repeat-missed
          :retry-start-index="practiceItems.length"
          @answered="onSessionAnswered"
          @finished="onFinished"
        />
      </template>

      <template v-else>
        <div class="card stack">
          <p class="score" :class="{ okline: lastScore.correct === lastScore.total }">
            {{ lastScore.correct }}/{{ lastScore.total }}
          </p>
          <p class="muted small">
            {{ lastScore.correct === lastScore.total
              ? 'Pattern produced perfectly — it will still come back through retries to prove it sticks.'
              : 'Misses joined your retry queue — the pattern closes there, two clean retries apart.' }}
          </p>
          <NuxtLink to="/path" class="btn btn-primary btn-block">Back to the Path</NuxtLink>
        </div>
      </template>
    </template>

    <div v-else class="card">
      <p class="muted">That grammar day doesn't exist. <NuxtLink to="/path">Back to the Path</NuxtLink>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/content'
import { grammarDayKey, grammarLadder } from '~/content/paths'
import type { MistakeEntry, RetrySession } from '~/utils/retries'
import { withDueRetries } from '~/utils/retries'
import { todayIso } from '~/utils/srs'

const route = useRoute()
const router = useRouter()
const progress = useProgress()
const tts = useTts()

const dayNum = computed(() => Number(route.params.day))
const lesson = computed(() => grammarLadder.find(l => l.day === dayNum.value))
const done = computed(() => lesson.value ? progress.isDone(grammarDayKey(lesson.value.day)) : false)

const practicing = ref(false)
const showRule = ref(false)
const finishedRun = ref(false)
const lastScore = ref({ correct: 0, total: 0 })

const lockedAhead = computed(() => {
  if (!lesson.value || done.value) return false
  const current = grammarLadder.find(g => !progress.isDone(grammarDayKey(g.day)))
  return !!current && lesson.value.day > current.day
})

const practiceItems = computed<Exercise[]>(() =>
  lesson.value?.practice.map(p => ({
    type: 'type' as const,
    prompt: p.prompt,
    answer: p.answer,
    hint: p.hint,
  })) ?? [],
)

const session = ref<RetrySession>({ items: [], retryOf: [] })
const retryStats = ref({ correct: 0, total: 0 })
// route-param navigation reuses this component — reset everything per day
watch(dayNum, () => {
  practicing.value = false
  showRule.value = false
  finishedRun.value = false
  retryStats.value = { correct: 0, total: 0 }
  session.value = withDueRetries(practiceItems.value, progress.mistakes as MistakeEntry[], todayIso())
}, { immediate: true })

function onSessionAnswered(pay: { index: number; correct: boolean }) {
  const m = session.value.retryOf[pay.index]
  if (!m) return
  progress.recordRetry(m.q, pay.correct, m.a)
  retryStats.value.total += 1
  if (pay.correct) retryStats.value.correct += 1
}

function onFinished(result: { correct: number; total: number; missed: { q: string; a: string }[] }) {
  if (!lesson.value) return
  progress.recordLesson(
    grammarDayKey(lesson.value.day),
    result.correct - retryStats.value.correct,
    result.total - retryStats.value.total,
  )
  progress.logMistakes(result.missed)
  progress.markDone(grammarDayKey(lesson.value.day))
  lastScore.value = {
    correct: result.correct - retryStats.value.correct,
    total: result.total - retryStats.value.total,
  }
  finishedRun.value = true
}

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/path')
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
.path-label { color: var(--path-grammar-text); font-weight: 700; font-size: 0.85rem; margin: 0 0 4px; }
.rule-card { border-color: var(--path-grammar); background: var(--path-grammar-soft); }
.rule { margin: 0; line-height: 1.55; font-weight: 500; }
.rule-peek { color: var(--path-grammar-text); border-style: dashed; }
.rule-text { line-height: 1.5; }
.line { align-items: center; }
.tts { min-height: 36px; padding: 4px 10px; flex-shrink: 0; }
.tts-pair { display: flex; gap: 6px; flex-shrink: 0; }
.okline { color: var(--ok); font-weight: 600; margin: 0; }
.score { font-size: 1.4rem; font-weight: 700; margin: 0; }
</style>
