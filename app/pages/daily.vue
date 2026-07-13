<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
    <h1>Daily sentences</h1>

    <div v-if="learned.length < 15" class="card stack">
      <p class="muted">
        Daily sentences are built from words you've already learned.
        Learn at least 15 words on the Path first — then fresh sentences appear here every day.
      </p>
      <NuxtLink to="/path" class="btn btn-block">Go to Path</NuxtLink>
    </div>

    <template v-else-if="!finished">
      <p class="muted small">
        {{ round === 0 ? 'Five fresh sentences built from your words — new ones every day.' : 'Bonus round.' }}
      </p>
      <ExerciseRunner :key="`${dateSeed}-${round}`" :exercises="exercises" @finished="onFinished" />
    </template>

    <div v-else class="card stack">
      <p class="okline">✓ Done for today.</p>
      <p class="muted small">Come back tomorrow for a new set — or keep going now.</p>
      <button class="btn btn-block" @click="moreRound">More sentences</button>
      <NuxtLink to="/" class="btn btn-primary btn-block">Back to Today</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/content'
import { cardsById } from '~/content'
import { dailySentences } from '~/utils/sentenceGen'
import { todayIso } from '~/utils/srs'

const router = useRouter()
const progress = useProgress()

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/')
}

const dateSeed = todayIso()
const round = ref(0)
const finished = ref(false)

const learned = computed<Card[]>(() =>
  Object.keys(progress.srs).map(id => cardsById[id]).filter((c): c is Card => c !== undefined),
)

const exercises = computed(() =>
  dailySentences(learned.value, round.value === 0 ? dateSeed : `${dateSeed}-${round.value}`, 5),
)

function onFinished() {
  progress.markDone(`daily-${dateSeed}`)
  finished.value = true
}

function moreRound() {
  round.value += 1
  finished.value = false
}
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background: none;
  border: 0;
  padding: 4px 8px 4px 0;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active { opacity: 0.6; }
.back-btn svg { width: 18px; height: 18px; }
.okline { color: var(--ok); font-weight: 600; }
</style>
