<template>
  <div class="stack">
    <div class="dots" aria-hidden="true">
      <span
        v-for="(_, i) in exercises"
        :key="i"
        class="dot"
        :class="{ done: i < idx, current: i === idx }"
      />
    </div>
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

const props = defineProps<{ exercises: Exercise[] }>()
const emit = defineEmits<{ finished: [result: RunResult] }>()

const progress = useProgress()
const idx = ref(0)
const correctCount = ref(0)
const gradableCount = ref(0)
const missed = ref<{ q: string; a: string; ex?: Exercise }[]>([])
const perType: Record<string, { correct: number; total: number }> = {}
const current = computed(() => props.exercises[idx.value])

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
  // 'open' writing is never auto-graded — it neither counts toward the
  // score nor appears in the mistake log.
  if (ex && ex.type !== 'open') {
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
  if (idx.value + 1 >= props.exercises.length) {
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
.dot.done { background: var(--ok); }
.dot.current { background: var(--accent); }
</style>
