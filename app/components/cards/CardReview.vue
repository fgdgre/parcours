<template>
  <div v-if="card" class="stack">
    <p class="muted small">{{ queue.length }} card{{ queue.length === 1 ? '' : 's' }} left</p>
    <div class="card word-card" @click="revealed = true">
      <div class="row">
        <span class="fr">{{ card.fr }}</span>
        <button class="btn tts" aria-label="Hear it" @click.stop="hear">🔊</button>
      </div>
      <template v-if="revealed">
        <p v-if="card.ipa" class="muted ipa">{{ card.ipa }}</p>
        <p class="en">{{ card.en }}</p>
        <p v-if="card.exFr" class="ex">
          {{ card.exFr }}<br>
          <span class="muted small">{{ card.exEn }}</span>
        </p>
        <p v-if="card.exFr2" class="ex">
          {{ card.exFr2 }}<br>
          <span class="muted small">{{ card.exEn2 }}</span>
        </p>
      </template>
      <p v-else class="muted small">Tap to reveal</p>
    </div>
    <template v-if="revealed">
      <div class="feedback-actions">
        <ExerciseNote :note-key="`card:${card.id}`" what="word" />
      </div>
      <div class="grades">
        <button class="btn grade again" @click="grade('again')">Again</button>
        <button class="btn grade hard" @click="grade('hard')">Hard</button>
        <button class="btn grade good" @click="grade('good')">Good</button>
        <button class="btn grade easy" @click="grade('easy')">Easy</button>
      </div>
    </template>
    <button v-else class="btn btn-primary btn-block" @click="revealed = true">Reveal</button>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/content'
import type { Grade } from '~/utils/srs'

const props = defineProps<{ cards: Card[] }>()
const emit = defineEmits<{ graded: [id: string, grade: Grade]; finished: [] }>()

const progress = useProgress()
const tts = useTts()
const queue = ref<Card[]>([...props.cards])
const revealed = ref(false)
const card = computed(() => queue.value[0])

function hear() {
  if (card.value) tts.speak(card.value.fr, progress.settings.ttsRate)
}

function grade(g: Grade) {
  const c = queue.value.shift()
  if (!c) return
  emit('graded', c.id, g)
  if (g === 'again') queue.value.push(c)
  revealed.value = false
  if (queue.value.length === 0) emit('finished')
}
</script>

<style scoped>
.word-card { display: flex; flex-direction: column; gap: 6px; min-height: 170px; cursor: pointer; }
.fr { font-size: 1.6rem; font-weight: 700; }
.tts { min-height: 40px; padding: 6px 12px; margin-left: auto; }
.ipa { margin: 0; }
.en { font-size: 1.1rem; margin: 0; }
.ex { margin: 4px 0 0; padding-top: 8px; border-top: 1px solid var(--border); }
.grades { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.grade { padding: 10px 4px; font-size: 0.9rem; }
.again { color: var(--err); border-color: var(--err); }
.hard { color: var(--warn); border-color: var(--warn); }
.good { color: var(--accent); border-color: var(--accent); }
.easy { color: var(--ok); border-color: var(--ok); }
</style>
