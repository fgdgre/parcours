<template>
  <div class="page stack">
    <h1>Practice</h1>

    <template v-if="!mode">
      <p class="muted small">
        Unlimited extra drills, generated from {{ pool.length }} words
        {{ usingLearned ? "you've already learned" : 'of the starter deck' }}. Every run is different.
      </p>
      <button v-for="m in modes" :key="m.kind" class="card mode spread" @click="start(m.kind)">
        <span>
          <span class="mode-title">{{ m.icon }} {{ m.title }}</span><br>
          <span class="muted small">{{ m.desc }}</span>
        </span>
        <span class="chip">{{ m.kind === 'writing' ? '3 →' : '10 →' }}</span>
      </button>
    </template>

    <template v-else-if="!result">
      <ExerciseRunner :key="runKey" :exercises="items" @finished="onFinished" />
      <button class="btn btn-block quit" @click="mode = null">Quit practice</button>
    </template>

    <div v-else class="card stack">
      <p class="score" :class="{ okline: result.correct === result.total }">
        {{ result.correct }}/{{ result.total }}
      </p>
      <p class="muted small">
        {{ result.correct === result.total ? 'Flawless. One more round?' : 'Every miss just met its future review. Again?' }}
      </p>
      <button class="btn btn-primary btn-block" @click="start(mode!)">Another 10</button>
      <button class="btn btn-block" @click="mode = null">Choose a different drill</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, Exercise } from '~/types/content'
import { cardsById } from '~/content'
import type { DrillKind } from '~/utils/drills'
import { buildDrills } from '~/utils/drills'

const progress = useProgress()

const modes: { kind: DrillKind; icon: string; title: string; desc: string }[] = [
  { kind: 'mixed', icon: '🎲', title: 'Mixed drill', desc: 'Meanings, translations and dictations shuffled together.' },
  { kind: 'mc', icon: '🧠', title: 'Meaning quiz', desc: 'What does this French word mean? Four options.' },
  { kind: 'type', icon: '✍️', title: 'Translate', desc: 'English → French, word bank or keyboard.' },
  { kind: 'dictation', icon: '👂', title: 'Dictation', desc: 'Hear a real example sentence, type what you heard.' },
  { kind: 'writing', icon: '📝', title: 'Writing', desc: 'Compose sentences from your words, then “Copy to check” with AI.' },
]

const allCards = Object.values(cardsById)
const learned = computed<Card[]>(() =>
  Object.keys(progress.srs).map(id => cardsById[id]).filter((c): c is Card => c !== undefined),
)
const usingLearned = computed(() => learned.value.length >= 10)
const pool = computed(() => (usingLearned.value ? learned.value : allCards.slice(0, 30)))

const mode = ref<DrillKind | null>(null)
const items = ref<Exercise[]>([])
const runKey = ref(0)
const result = ref<{ correct: number; total: number } | null>(null)

function start(kind: DrillKind) {
  mode.value = kind
  result.value = null
  items.value = buildDrills(pool.value, allCards, kind, kind === 'writing' ? 3 : 10)
  runKey.value += 1
}

function onFinished(score: { correct: number; total: number }) {
  result.value = score
}
</script>

<style scoped>
.mode { text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mode:active { transform: scale(0.985); border-color: var(--accent); }
.mode-title { font-weight: 650; }
.score { font-size: 1.6rem; font-weight: 700; }
.okline { color: var(--ok); }
.quit { color: var(--muted); border: 0; background: none; }
</style>
