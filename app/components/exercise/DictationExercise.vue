<template>
  <div class="stack">
    <h2>Listen and type what you hear</h2>
    <button class="btn btn-block" @click="play">
      🔊 {{ played ? 'Play again' : 'Play' }}
    </button>
    <input
      v-model="input"
      class="input"
      type="text"
      lang="fr"
      autocapitalize="off"
      autocorrect="off"
      autocomplete="off"
      spellcheck="false"
      :disabled="submitted"
      placeholder="What did you hear?"
      @keydown.enter="onEnter"
    >
    <template v-if="!submitted">
      <button class="btn btn-primary btn-block" :disabled="!input.trim()" @click="submit">Check</button>
    </template>
    <template v-else>
      <div :class="correct ? 'feedback-ok' : 'feedback-err'">
        <strong>{{ correct ? 'Correct.' : 'Not quite.' }}</strong>
        It said: <em>{{ exercise.ttsText }}</em>
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done')">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { matchAnswer } from '~/utils/grading'

const props = defineProps<{
  exercise: { type: 'dictation'; ttsText: string; answer: string[] }
}>()
const emit = defineEmits<{ done: [] }>()

const progress = useProgress()
const tts = useTts()
const input = ref('')
const submitted = ref(false)
const correct = ref(false)
const played = ref(false)

function play() {
  tts.speak(props.exercise.ttsText, progress.settings.ttsRate * 0.9)
  played.value = true
}

function submit() {
  if (!input.value.trim()) return
  const accepted = [...props.exercise.answer, props.exercise.ttsText]
  correct.value = matchAnswer(input.value, accepted, {
    strictAccents: progress.settings.strictAccents,
  })
  submitted.value = true
}

function onEnter() {
  if (!submitted.value) submit()
  else emit('done')
}
</script>
