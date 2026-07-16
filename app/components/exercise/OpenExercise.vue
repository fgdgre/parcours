<template>
  <div class="stack">
    <h2>{{ exercise.prompt }}</h2>
    <p v-if="exercise.hint" class="muted small">{{ exercise.hint }}</p>
    <textarea
      v-model="text"
      class="input area"
      lang="fr"
      rows="5"
      autocapitalize="sentences"
      autocorrect="off"
      spellcheck="false"
      placeholder="Write in French…"
    />
    <p class="muted small">
      {{ wordCount }} / {{ minWords }} words
      <template v-if="wordCount >= minWords"> ✓</template>
    </p>

    <button class="btn btn-block" :disabled="wordCount === 0" @click="copyForReview">
      {{ copied ? '✓ Copied — paste it into a new Claude chat' : '📋 Copy to check (AI review)' }}
    </button>
    <p class="muted small">
      Writing isn't graded here. The copy button packs your text with a tutor briefing —
      paste it into any AI chat to get corrections and keep the conversation going in French.
      The AI ends with a strict <strong>RATING: NN/100</strong> — record it below.
    </p>

    <div v-if="hasCopied" class="stack rating-block">
      <input
        v-model="note"
        class="input"
        type="text"
        :disabled="ratingSaved"
        placeholder="AI's main feedback in one line (optional)"
      >
    </div>
    <div v-if="hasCopied" class="rating row">
      <label class="small muted" for="ai-rating">AI rating:</label>
      <input
        id="ai-rating"
        v-model.number="rating"
        class="input rating-input"
        type="number"
        inputmode="numeric"
        min="0"
        max="100"
        placeholder="NN"
        :disabled="ratingSaved"
      >
      <span class="small muted">/100</span>
      <button class="btn rating-save" :disabled="!ratingValid || ratingSaved" @click="saveRating">
        {{ ratingSaved ? '✓ Saved' : 'Save' }}
      </button>
    </div>

    <button
      class="btn btn-primary btn-block"
      :disabled="wordCount < minWords"
      @click="finish"
    >
      Done writing
    </button>
  </div>
</template>

<script setup lang="ts">
import { buildReviewPrompt } from '~/utils/reviewPrompt'

const props = defineProps<{
  exercise: { type: 'open'; prompt: string; minWords?: number; hint?: string }
}>()
const emit = defineEmits<{ done: [correct: boolean] }>()

const progress = useProgress()
const text = ref('')
const copied = ref(false)
const hasCopied = ref(false)
const rating = ref<number | null>(null)
const ratingSaved = ref(false)
const minWords = computed(() => props.exercise.minWords ?? 10)
const wordCount = computed(() => text.value.trim().split(/\s+/).filter(Boolean).length)
const ratingValid = computed(() =>
  typeof rating.value === 'number' && rating.value >= 0 && rating.value <= 100,
)

const stored = ref(false)
const note = ref('')

function saveRating() {
  if (!ratingValid.value) return
  progress.addWriting(props.exercise.prompt, text.value.trim(), rating.value!, note.value.trim())
  ratingSaved.value = true
  stored.value = true
}

function finish() {
  // keep the text for analytics even when no rating was recorded
  if (!stored.value && text.value.trim().length > 0) {
    progress.addWriting(props.exercise.prompt, text.value.trim(), null, note.value.trim())
    stored.value = true
  }
  emit('done', true)
}

async function copyForReview() {
  const payload = buildReviewPrompt(props.exercise.prompt, text.value.trim())
  hasCopied.value = true
  try {
    await navigator.clipboard.writeText(payload)
    copied.value = true
    setTimeout(() => { copied.value = false }, 4000)
  } catch {
    // clipboard API blocked — fall back to a hidden textarea
    const ta = document.createElement('textarea')
    ta.value = payload
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 4000)
  }
}
</script>

<style scoped>
.area { min-height: 130px; resize: vertical; line-height: 1.5; }
.rating { gap: 8px; }
.rating-input { width: 76px; min-height: 40px; text-align: center; }
.rating-save { min-height: 40px; padding: 6px 14px; }
</style>
