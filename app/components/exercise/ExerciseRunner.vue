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

const props = defineProps<{ exercises: Exercise[] }>()
const emit = defineEmits<{ finished: [score: { correct: number; total: number }] }>()

const idx = ref(0)
const correctCount = ref(0)
const current = computed(() => props.exercises[idx.value]!)

function componentFor(ex: Exercise) {
  switch (ex.type) {
    case 'mc': return McExercise
    case 'type': return TypeExercise
    case 'conjugate': return ConjugateExercise
    case 'dictation': return DictationExercise
    case 'speak': return SpeakExercise
  }
}

function advance(correct?: boolean) {
  if (correct) correctCount.value += 1
  if (idx.value + 1 >= props.exercises.length) {
    emit('finished', { correct: correctCount.value, total: props.exercises.length })
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
