<template>
  <div v-if="card" class="stack">
    <p class="muted small">New word {{ idx + 1 }} of {{ queue.length }}</p>
    <div class="card word-card">
      <div class="row">
        <span class="fr">{{ card.fr }}</span>
        <button class="btn tts" aria-label="Hear it" @click="hear">🔊</button>
      </div>
      <p v-if="card.ipa" class="muted ipa">{{ card.ipa }}</p>
      <p class="en">{{ card.en }}</p>
      <p v-if="card.exFr" class="ex">
        {{ card.exFr }}<br>
        <span class="muted small">{{ card.exEn }}</span>
      </p>
    </div>
    <button class="btn btn-primary btn-block" @click="next">Got it</button>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/content'

const props = defineProps<{ cards: Card[] }>()
const emit = defineEmits<{ introduced: [id: string]; finished: [] }>()

const progress = useProgress()
const tts = useTts()
// snapshot: props.cards is often a live computed that shrinks as
// cards get introduced — iterating it directly would skip words
const queue = ref([...props.cards])
const idx = ref(0)
const card = computed(() => queue.value[idx.value])

watch(card, c => c && tts.speak(c.fr, progress.settings.ttsRate), { immediate: false })

function hear() {
  if (card.value) tts.speak(card.value.fr, progress.settings.ttsRate)
}

function next() {
  if (!card.value) return
  emit('introduced', card.value.id)
  if (idx.value + 1 >= queue.value.length) emit('finished')
  else idx.value += 1
}
</script>

<style scoped>
.word-card { display: flex; flex-direction: column; gap: 6px; }
.fr { font-size: 1.6rem; font-weight: 700; }
.tts { min-height: 40px; padding: 6px 12px; margin-left: auto; }
.ipa { margin: 0; }
.en { font-size: 1.1rem; margin: 0; }
.ex { margin: 4px 0 0; padding-top: 8px; border-top: 1px solid var(--border); }
</style>
