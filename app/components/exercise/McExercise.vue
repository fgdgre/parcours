<template>
  <div class="stack">
    <p v-if="exercise.passage" class="card passage" lang="fr">{{ exercise.passage }}</p>
    <button v-if="exercise.passage" class="btn tts-btn" @click="tts.speak(exercise.passage!, progress.settings.ttsRate)">
      🔊 Listen to the text
    </button>
    <h2>{{ exercise.prompt }}</h2>
    <button
      v-for="(opt, i) in shuffled"
      :key="i"
      class="btn btn-block option"
      :class="optionClass(i)"
      @click="pick(i)"
    >
      {{ opt.text }}
    </button>
    <template v-if="picked !== null">
      <div :class="correct ? 'feedback-ok' : 'feedback-err'">
        <strong>{{ correct ? 'Correct.' : 'Not quite.' }}</strong>
        <span v-if="exercise.explain">&nbsp;{{ exercise.explain }}</span>
      </div>
      <div class="feedback-actions">
        <button class="btn tts-btn" @click="sayAnswer">🔊 Hear it</button>
        <button class="btn explain-btn" @click="explainIt">
          {{ explained ? '✓ Copied' : '🤔 Explain (AI)' }}
        </button>
        <ExerciseNote :note-key="exercise.prompt" />
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done', correct)">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  exercise: { type: 'mc'; prompt: string; options: string[]; answer: number; explain?: string; passage?: string }
}>()
defineEmits<{ done: [correct: boolean] }>()

const progress = useProgress()
const tts = useTts()

function sayAnswer() {
  tts.speak(props.exercise.options[props.exercise.answer]!, progress.settings.ttsRate)
}

import { buildExplainPrompt } from '~/utils/reviewPrompt'
import { copyText } from '~/utils/clipboard'

const explained = ref(false)
async function explainIt() {
  const correctText = shuffled.value.find(o => o.correct)!.text
  const mine = picked.value !== null ? shuffled.value[picked.value]!.text : undefined
  await copyText(buildExplainPrompt(props.exercise.prompt, correctText, mine))
  explained.value = true
  setTimeout(() => { explained.value = false }, 3500)
}

const shuffled = ref(
  props.exercise.options
    .map((text, i) => ({ text, correct: i === props.exercise.answer, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort),
)
const picked = ref<number | null>(null)
const correct = computed(() => picked.value !== null && shuffled.value[picked.value]!.correct)

function pick(i: number) {
  if (picked.value === null) picked.value = i
}

function optionClass(i: number) {
  if (picked.value === null) return {}
  const opt = shuffled.value[i]!
  return {
    'opt-ok': opt.correct,
    'opt-err': picked.value === i && !opt.correct,
    'opt-dim': picked.value !== i && !opt.correct,
  }
}
</script>

<style scoped>
.passage { font-size: 1.05rem; line-height: 1.7; font-style: normal; white-space: pre-line; }
.explain-btn { min-height: 38px; padding: 6px 12px; align-self: flex-start; font-size: 0.85rem; color: var(--muted); }
.tts-btn { min-height: 38px; padding: 6px 12px; align-self: flex-start; font-size: 0.85rem; color: var(--muted); }
.option { justify-content: flex-start; text-align: left; }
.opt-ok { border-color: var(--ok); background: var(--ok-soft); color: var(--ok); }
.opt-err { border-color: var(--err); background: var(--err-soft); color: var(--err); }
.opt-dim { opacity: 0.55; }
</style>
