<template>
  <div class="stack">
    <div class="dots" aria-hidden="true">
      <span
        v-for="(_, i) in queue"
        :key="i"
        class="dot"
        :class="dotClass(i)"
      />
    </div>
    <p v-if="retryFlag" class="small retry-flag">🔁 Comeback — you missed this one before</p>
    <component
      :is="componentFor(current)"
      v-if="current"
      :key="idx"
      :exercise="current"
      @done="advance"
    />
  </div>
</template>

<script setup lang="ts">
import type { Exercise } from '~/types/content'
import McExercise from './McExercise.vue'
import TypeExercise from './TypeExercise.vue'
import ConjugateExercise from './ConjugateExercise.vue'
import DictationExercise from './DictationExercise.vue'
import SpeakExercise from './SpeakExercise.vue'
import OpenExercise from './OpenExercise.vue'

interface RunResult {
  correct: number
  total: number
  missed: { q: string; a: string; ex?: Exercise }[]
}

const props = defineProps<{
  exercises: Exercise[]
  /** Duolingo-style: a missed question re-enters the queue until answered
   * correctly (max 3 attempts). Scores and stats count first attempts only. */
  repeatMissed?: boolean
  /** items at/after this original index are injected retries — badge them */
  retryStartIndex?: number
}>()
const emit = defineEmits<{
  finished: [result: RunResult]
  answered: [payload: { index: number; q: string; a: string; correct: boolean }]
}>()

const progress = useProgress()
const idx = ref(0)
const queue = ref<Exercise[]>([...props.exercises])
// queue position -> index in props.exercises (repeats map back to their original)
const originOf = ref<number[]>(props.exercises.map((_, i) => i))
const attempts: Record<number, number> = {}

// a long exercise leaves the viewport parked at its Continue button —
// bring the next question into view from its top
watch(idx, () => {
  nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
})
const correctCount = ref(0)
const gradableCount = ref(0)
const missed = ref<{ q: string; a: string; ex?: Exercise }[]>([])
const results = ref<Record<number, 'ok' | 'err' | 'open'>>({})

function dotClass(i: number) {
  const r = results.value[i]
  return {
    'dot-ok': r === 'ok',
    'dot-err': r === 'err',
    'dot-open': r === 'open',
    'dot-repeat': i >= props.exercises.length,
    current: i === idx.value,
  }
}
const perType: Record<string, { correct: number; total: number }> = {}
const current = computed(() => queue.value[idx.value])
const retryFlag = computed(() => {
  if (props.retryStartIndex === undefined) return false
  const orig = originOf.value[idx.value] ?? idx.value
  return orig >= props.retryStartIndex
})

function describe(ex: Exercise): { q: string; a: string } {
  switch (ex.type) {
    case 'mc': return { q: ex.prompt, a: ex.options[ex.answer]! }
    case 'type': return { q: ex.prompt, a: ex.answer[0]! }
    case 'conjugate': return { q: `Conjugate ${ex.verb} with “${ex.pronoun}”`, a: `${ex.pronoun} ${ex.answer[0]}` }
    case 'dictation': return { q: 'Dictation (writing what you hear)', a: ex.ttsText }
    case 'speak': return { q: `Say aloud: ${ex.en}`, a: ex.target }
    case 'open': return { q: ex.prompt, a: '(free writing)' }
  }
}

function componentFor(ex: Exercise) {
  switch (ex.type) {
    case 'mc': return McExercise
    case 'type': return TypeExercise
    case 'conjugate': return ConjugateExercise
    case 'dictation': return DictationExercise
    case 'speak': return SpeakExercise
    case 'open': return OpenExercise
  }
}

function advance(correct?: boolean, meta?: { skill?: string; skillCorrect?: boolean }) {
  const ex = current.value
  const orig = originOf.value[idx.value] ?? idx.value
  const isRepeat = (attempts[orig] ?? 0) > 0
  attempts[orig] = (attempts[orig] ?? 0) + 1
  if (ex) {
    results.value[idx.value] = ex.type === 'open' ? 'open' : (correct ? 'ok' : 'err')
    if (!isRepeat) {
      const d = describe(ex)
      emit('answered', { index: orig, q: d.q, a: d.a, correct: !!correct })
    }
  }
  // 'open' writing is never auto-graded — it neither counts toward the
  // score nor appears in the mistake log. Repeats are pure practice:
  // scores, skill stats and the mistake log all reflect first attempts only.
  if (ex && ex.type !== 'open' && !isRepeat) {
    gradableCount.value += 1
    if (correct) correctCount.value += 1
    else missed.value.push({ ...describe(ex), ex })
    // skill stats may differ from flow grading: keyboard answers count as
    // 'spelling' and are judged with strict accents
    const key = meta?.skill ?? ex.type
    const skillCorrect = meta?.skillCorrect ?? correct
    const t = perType[key] ?? { correct: 0, total: 0 }
    t.total += 1
    if (skillCorrect) t.correct += 1
    perType[key] = t
  }
  // the miss comes back until answered correctly (max 3 tries per item)
  if (ex && ex.type !== 'open' && !correct && props.repeatMissed && (attempts[orig] ?? 0) < 3) {
    queue.value.push({ ...ex })
    originOf.value.push(orig)
  }
  if (idx.value + 1 >= queue.value.length) {
    progress.recordRun(perType)
    emit('finished', {
      correct: correctCount.value,
      total: gradableCount.value,
      missed: missed.value,
    })
  } else {
    idx.value += 1
  }
}
</script>

<style scoped>
.dots { display: flex; gap: 6px; flex-wrap: wrap; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--border);
}
.dot-ok { background: var(--ok); }
.dot-err { background: var(--err); }
.dot-open { background: var(--warn); }
.dot.current { background: var(--accent); }
.dot-repeat { outline: 1px dashed var(--muted); outline-offset: 1px; }
.retry-flag { margin: 0; color: var(--warn); font-weight: 600; }
</style>
