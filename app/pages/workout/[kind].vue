<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
    <h1>{{ meta.title }}</h1>

    <div v-if="pool.length < 3" class="card stack">
      <p class="muted">Learn a few words on the Path first — daily workouts are built from your vocabulary.</p>
      <NuxtLink to="/path" class="btn btn-block">Go to Path</NuxtLink>
    </div>

    <template v-else-if="!finished">
      <p class="muted small">{{ meta.desc }}</p>
      <ExerciseRunner v-if="items.length > 0" :key="runKey" :exercises="items" @finished="onFinished" />
    </template>

    <div v-else class="card stack">
      <p class="okline">✓ {{ meta.title }} done for today.</p>
      <button class="btn btn-block" @click="again">One more round</button>
      <NuxtLink to="/" class="btn btn-primary btn-block">Back to Today</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, Exercise } from '~/types/content'
import { cardsById } from '~/content'
import type { DrillKind } from '~/utils/drills'
import { buildDrills } from '~/utils/drills'
import { todayIso } from '~/utils/srs'

const route = useRoute()
const router = useRouter()
const progress = useProgress()

const KINDS: Record<string, { title: string; desc: string; drill: DrillKind; count: number }> = {
  quiz: { title: 'Daily quiz', desc: 'Ten quick questions from your words — meanings, translations, listening.', drill: 'mixed', count: 10 },
  writing: { title: 'Daily writing', desc: 'One free-writing task. Use “Copy to check” to review it with AI afterwards.', drill: 'writing', count: 1 },
  speaking: { title: 'Daily speaking', desc: 'Five real sentences to say aloud — the recognizer checks it understood you.', drill: 'speaking', count: 5 },
}

const kind = computed(() => route.params.kind as string)
const meta = computed(() => KINDS[kind.value] ?? KINDS.quiz!)

onMounted(() => {
  if (!KINDS[kind.value]) router.replace('/')
})

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/')
}

const allCards = Object.values(cardsById)
const learned = computed<Card[]>(() =>
  Object.keys(progress.srs).map(id => cardsById[id]).filter((c): c is Card => c !== undefined),
)
const pool = computed(() => (learned.value.length >= 10 ? learned.value : allCards.slice(0, 30)))

const items = ref<Exercise[]>([])
const runKey = ref(0)
const finished = ref(false)

function build() {
  items.value = buildDrills(pool.value, allCards, meta.value.drill, meta.value.count)
  runKey.value += 1
  finished.value = false
}

onMounted(build)
watch(kind, build)

function onFinished() {
  progress.markDone(`workout-${kind.value}-${todayIso()}`)
  finished.value = true
}

function again() {
  build()
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
