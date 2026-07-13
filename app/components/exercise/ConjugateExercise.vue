<template>
  <div class="stack">
    <h2>Conjugate: <span class="chip">{{ exercise.verb }}</span></h2>
    <p class="sentence">{{ exercise.pronoun }} ___ <span class="muted">({{ exercise.verb }}, {{ exercise.tense }})</span></p>
    <input
      ref="inputEl"
      v-model="input"
      class="input"
      type="text"
      lang="fr"
      autocapitalize="off"
      autocorrect="off"
      autocomplete="off"
      spellcheck="false"
      :disabled="submitted"
      placeholder="Verb form…"
      @keydown.enter="onEnter"
    >
    <template v-if="!submitted">
      <button class="btn btn-primary btn-block" :disabled="!input.trim()" @click="submit">Check</button>
    </template>
    <template v-else>
      <div :class="correct ? 'feedback-ok' : 'feedback-err'">
        <strong>{{ correct ? 'Correct.' : 'Not quite.' }}</strong>
        {{ exercise.pronoun }} <em>{{ exercise.answer[0] }}</em>
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done')">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { matchAnswer } from '~/utils/grading'

const props = defineProps<{
  exercise: { type: 'conjugate'; verb: string; pronoun: string; tense: string; answer: string[] }
}>()
const emit = defineEmits<{ done: [] }>()

const progress = useProgress()
const input = ref('')
const submitted = ref(false)
const correct = ref(false)
const inputEl = ref<HTMLInputElement>()

onMounted(() => inputEl.value?.focus())

function submit() {
  if (!input.value.trim()) return
  correct.value = matchAnswer(input.value, props.exercise.answer, {
    strictAccents: progress.settings.strictAccents,
  })
  submitted.value = true
}

function onEnter() {
  if (!submitted.value) submit()
  else emit('done')
}
</script>

<style scoped>
.sentence { font-size: 1.2rem; }
</style>
