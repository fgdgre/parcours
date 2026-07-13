<template>
  <div class="stack">
    <h2>{{ exercise.prompt }}</h2>
    <p v-if="exercise.hint" class="muted small">{{ exercise.hint }}</p>

    <WordBank
      v-if="bankMode"
      :key="exercise.prompt"
      v-model="input"
      :words="answerTokens"
      :distractors="distractors"
      :disabled="submitted"
    />
    <input
      v-else
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
      placeholder="Type in French…"
      @keydown.enter="onEnter"
    >

    <button v-if="!submitted" class="btn mode-toggle" type="button" @click="toggleMode">
      {{ bankMode ? '⌨️ Type with keyboard instead' : '🔤 Use word bank instead' }}
    </button>

    <template v-if="!submitted">
      <button class="btn btn-primary btn-block" :disabled="!input.trim()" @click="submit">Check</button>
    </template>
    <template v-else>
      <div :class="correct ? 'feedback-ok' : 'feedback-err'">
        <strong>{{ correct ? 'Correct.' : 'Not quite.' }}</strong>
        Answer: <em>{{ exercise.answer[0] }}</em>
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done')">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { matchAnswer, normalizeFr } from '~/utils/grading'
import { cardsById } from '~/content'
import WordBank from './WordBank.vue'

const props = defineProps<{
  exercise: { type: 'type'; prompt: string; answer: string[]; hint?: string }
}>()
const emit = defineEmits<{ done: [] }>()

const progress = useProgress()
const input = ref('')
const submitted = ref(false)
const correct = ref(false)
const inputEl = ref<HTMLInputElement>()
const bankMode = ref(!progress.settings.preferKeyboard)

const tokenize = (s: string) =>
  s.split(/\s+/).map(w => w.replace(/[.,!?…]/g, '')).filter(Boolean)

const answerTokens = computed(() => tokenize(props.exercise.answer[0]!))

const distractors = computed(() => {
  const taken = new Set(answerTokens.value.map(w => normalizeFr(w, { stripAccents: true })))
  const pool = [...new Set(
    Object.values(cardsById)
      .flatMap(c => tokenize(c.fr))
      .filter(w => w.length > 1 && !taken.has(normalizeFr(w, { stripAccents: true }))),
  )]
  const picked: string[] = []
  while (picked.length < 4 && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!)
  }
  return picked
})

function toggleMode() {
  bankMode.value = !bankMode.value
  progress.settings.preferKeyboard = !bankMode.value
  input.value = ''
  if (!bankMode.value) nextTick(() => inputEl.value?.focus())
}

onMounted(() => {
  if (!bankMode.value) inputEl.value?.focus()
})

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
.mode-toggle {
  min-height: 38px;
  padding: 6px 12px;
  align-self: flex-start;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
