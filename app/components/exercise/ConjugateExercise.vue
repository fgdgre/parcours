<template>
  <div class="stack">
    <h2>Conjugate: <span class="chip">{{ exercise.verb }}</span></h2>
    <p class="sentence">{{ exercise.pronoun }} ___ <span class="muted">({{ exercise.verb }}, {{ exercise.tense }})</span></p>
    <p v-if="exercise.hint" class="muted small">{{ exercise.hint }}</p>
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
        <button class="tts-inline" aria-label="Hear it" @click="tts.speak(`${exercise.pronoun} ${exercise.answer[0]}`, progress.settings.ttsRate)">🔊</button>
        <span v-if="exercise.explain" class="explain-text">{{ exercise.explain }}</span>
      </div>
      <button class="btn tts-btn" @click="tts.speak(`${exercise.pronoun} ${exercise.answer[0]}`, progress.settings.ttsRate)">
        🔊 Hear it
      </button>
      <button class="btn explain-btn" @click="explainIt">
        {{ explained ? '✓ Copied — paste into a Claude chat' : '🤔 Explain this to me (AI)' }}
      </button>
      <button class="btn btn-primary btn-block" @click="$emit('done', correct)">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { matchAnswer } from '~/utils/grading'
import { buildExplainPrompt } from '~/utils/reviewPrompt'
import { copyText } from '~/utils/clipboard'

const props = defineProps<{
  exercise: { type: 'conjugate'; verb: string; pronoun: string; tense: string; answer: string[]; hint?: string; explain?: string }
}>()
const emit = defineEmits<{ done: [correct: boolean] }>()

const progress = useProgress()
const tts = useTts()

const explained = ref(false)
async function explainIt() {
  await copyText(buildExplainPrompt(
    `Conjugate ${props.exercise.verb} with "${props.exercise.pronoun}" (${props.exercise.tense})`,
    `${props.exercise.pronoun} ${props.exercise.answer[0]}`,
    input.value,
  ))
  explained.value = true
  setTimeout(() => { explained.value = false }, 3500)
}
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
  else emit('done', correct.value)
}
</script>

<style scoped>
.sentence { font-size: 1.2rem; }
.explain-text { display: block; margin-top: 4px; font-size: 0.85rem; }
.explain-btn { min-height: 38px; padding: 6px 12px; align-self: flex-start; font-size: 0.85rem; color: var(--muted); border: 1px solid var(--border); border-radius: 12px; background: var(--card); }
.tts-inline { background: none; border: 0; cursor: pointer; font-size: 1rem; padding: 0 4px; }
.tts-btn { min-height: 38px; padding: 6px 12px; align-self: flex-start; font-size: 0.85rem; color: var(--muted); }
</style>
