<template>
  <div class="stack">
    <p v-if="exercise.passage" class="card passage" lang="fr">{{ exercise.passage }}</p>
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
        <span v-if="exercise.explain" class="explain-text">{{ exercise.explain }}</span>
      </div>
      <div v-if="accentSlip" class="accent-note small">
        ⚠️ Right word, wrong accents — it's <em>{{ exercise.answer[0] }}</em>. Accents change the sound; this counts against your Spelling stat.
      </div>
      <button class="btn tts-btn" @click="tts.speak(exercise.answer[0]!, progress.settings.ttsRate)">
        🔊 Hear it
      </button>
      <button class="btn tts-btn" @click="explainIt">
        {{ explained ? '✓ Copied — paste into a Claude chat' : '🤔 Explain this to me (AI)' }}
      </button>
      <button class="btn btn-primary btn-block" @click="finish">Continue</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { matchAnswer, normalizeFr } from '~/utils/grading'
import { buildExplainPrompt } from '~/utils/reviewPrompt'
import { copyText } from '~/utils/clipboard'
import { cardsById } from '~/content'
import WordBank from './WordBank.vue'

const props = defineProps<{
  exercise: { type: 'type'; prompt: string; answer: string[]; hint?: string; passage?: string; explain?: string }
}>()
const emit = defineEmits<{ done: [correct: boolean, meta?: { skill: string; skillCorrect: boolean }] }>()

const progress = useProgress()
const tts = useTts()
const input = ref('')
const submitted = ref(false)
const correct = ref(false)
const strictCorrect = ref(false)
const accentSlip = ref(false)
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
  const lenient = matchAnswer(input.value, props.exercise.answer, { strictAccents: false })
  strictCorrect.value = matchAnswer(input.value, props.exercise.answer, { strictAccents: true })
  correct.value = progress.settings.strictAccents ? strictCorrect.value : lenient
  // keyboard-typed answers are real spelling tests — surface accent slips
  accentSlip.value = !bankMode.value && lenient && !strictCorrect.value
  if (accentSlip.value) {
    progress.logMistakes([{ q: `Accents: ${props.exercise.prompt}`, a: props.exercise.answer[0]! }])
  }
  submitted.value = true
}

const explained = ref(false)
async function explainIt() {
  await copyText(buildExplainPrompt(props.exercise.prompt, props.exercise.answer[0]!, input.value))
  explained.value = true
  setTimeout(() => { explained.value = false }, 3500)
}

function finish() {
  emit('done', correct.value, {
    skill: bankMode.value ? 'type' : 'spelling',
    skillCorrect: bankMode.value ? correct.value : strictCorrect.value,
  })
}

function onEnter() {
  if (!submitted.value) submit()
  else finish()
}
</script>

<style scoped>
.passage { font-size: 1.05rem; line-height: 1.7; white-space: pre-line; }
.mode-toggle,
.tts-btn {
  min-height: 38px;
  padding: 6px 12px;
  align-self: flex-start;
  font-size: 0.85rem;
  color: var(--muted);
}
.explain-text { display: block; margin-top: 4px; font-size: 0.85rem; }
.accent-note { background: var(--warn-soft); color: var(--warn); border-radius: 12px; padding: 10px 14px; }
</style>
