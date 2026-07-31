<template>
  <div class="stack">
    <div class="card player stack">
      <p class="muted small center">
        Line {{ idx + 1 }} of {{ items.length }} · pass {{ loop }}
      </p>
      <button class="play-btn" :aria-label="playing ? 'Pause' : 'Play'" @click="togglePlay">
        {{ playing ? '⏸' : '▶️' }}
      </button>
      <p class="center elapsed">
        <strong>{{ minutesLabel }}</strong>
        <span class="muted small"> listened · goal {{ goalMinutes }} min</span>
      </p>
      <ProgressBar :value="Math.min(1, elapsed / (goalMinutes * 60))" />
      <p class="muted small center">
        Ears only — no typing, no score. Let the words separate on their own.
        Keep the screen on: the phone voice stops if it locks.
      </p>
    </div>

    <button class="btn btn-block" @click="revealed = !revealed">
      {{ revealed ? 'Hide the text' : '👀 Peek at the text (optional)' }}
    </button>
    <div v-if="revealed" class="card stack">
      <div v-for="(it, i) in items" :key="i" class="spread line" :class="{ now: i === idx }">
        <span class="small">{{ it.fr }}</span>
        <span class="muted small">{{ it.en }}</span>
      </div>
    </div>

    <button class="btn btn-primary btn-block" :disabled="elapsed < goalMinutes * 60" @click="$emit('done')">
      {{ elapsed >= goalMinutes * 60 ? '✓ Done listening — mark complete' : `Complete unlocks at ${goalMinutes} min` }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { PassiveItem } from '~/types/content'

const props = withDefaults(defineProps<{
  items: PassiveItem[]
  rate?: number
  goalMinutes?: number
}>(), { rate: 0.88, goalMinutes: 10 })

defineEmits<{ done: [] }>()

const progress = useProgress()
const tts = useTts()

const idx = ref(0)
const loop = ref(1)
const playing = ref(false)
const revealed = ref(false)
const elapsed = ref(0)

const minutesLabel = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

let ticker: ReturnType<typeof setInterval> | null = null
let wakeLock: { release: () => Promise<void> } | null = null
// generation token: a stale run() loop (parked in an await across pause/play)
// must die even though `playing` flipped back to true
let runToken = 0
// listen seconds are flushed to the store in batches, not every tick —
// each store write serializes the whole state to localStorage
let unsyncedSeconds = 0

function flushListenTime() {
  if (unsyncedSeconds > 0) {
    progress.addListenTime(unsyncedSeconds)
    unsyncedSeconds = 0
  }
}

function onVisibility() {
  // the OS silently releases wake locks when the app is backgrounded
  if (document.visibilityState === 'visible' && playing.value) grabWakeLock()
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))

async function grabWakeLock() {
  try {
    // keeps the screen (and therefore speechSynthesis) alive while listening
    wakeLock = await (navigator as any).wakeLock?.request('screen') ?? null
  } catch { wakeLock = null }
}
function dropWakeLock() {
  wakeLock?.release().catch(() => {})
  wakeLock = null
}

function togglePlay() {
  if (playing.value) pause()
  else start()
}

function start() {
  if (playing.value || props.items.length === 0) return
  playing.value = true
  grabWakeLock()
  ticker = setInterval(() => {
    elapsed.value += 1
    unsyncedSeconds += 1
    if (unsyncedSeconds >= 15) flushListenTime()
  }, 1000)
  void run(++runToken)
}

function pause() {
  playing.value = false
  runToken += 1
  tts.stop()
  if (ticker) { clearInterval(ticker); ticker = null }
  flushListenTime()
  dropWakeLock()
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function run(token: number) {
  while (playing.value && token === runToken) {
    const item = props.items[idx.value]
    if (!item) break
    await tts.speakAsync(item.fr, props.rate)
    if (!playing.value || token !== runToken) break
    await sleep(1000)
    if (!playing.value || token !== runToken) break
    if (idx.value + 1 < props.items.length) {
      idx.value += 1
    } else {
      idx.value = 0
      loop.value += 1
    }
  }
}

onUnmounted(() => {
  pause()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.player { align-items: center; }
.center { text-align: center; margin: 0; }
.play-btn {
  font-size: 2.6rem;
  background: var(--path-oral-soft);
  border: 2px solid var(--path-oral);
  border-radius: 50%;
  width: 92px;
  height: 92px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  align-self: center;
}
.play-btn:active { transform: scale(0.95); }
.elapsed { font-size: 1.1rem; }
.line { padding: 2px 0; }
.line.now span:first-child { color: var(--path-oral-text); font-weight: 700; }
</style>
