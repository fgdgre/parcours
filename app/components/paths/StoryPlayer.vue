<template>
  <div class="stack">
    <template v-if="phase === 'listen'">
      <div class="card player stack">
        <p class="muted small center">🎧 Listen — eyes off the screen. Replay as many times as you like.</p>
        <button class="play-btn" :disabled="playing" aria-label="Play the story" @click="playStory">
          {{ playing ? '🔊' : plays > 0 ? '↻' : '▶️' }}
        </button>
        <p class="muted small center">{{ plays === 0 ? 'Play the story' : `Heard ${plays}×` }}</p>
        <p v-if="story.gloss" class="muted small center gloss">New words: {{ story.gloss }}</p>
      </div>
      <button class="btn btn-primary btn-block" :disabled="plays === 0" @click="readyForQuestions">
        I'm ready for the questions
      </button>
    </template>

    <template v-else-if="phase === 'questions'">
      <button class="btn btn-block replay" :disabled="playing" @click="playStory">
        🔊 {{ playing ? 'Playing…' : 'Hear the story again' }}
      </button>
      <ExerciseRunner :exercises="questionItems" @finished="onFinished" />
    </template>

    <template v-else>
      <div class="card stack">
        <p class="score" :class="{ okline: lastScore.correct === lastScore.total }">
          {{ lastScore.correct }}/{{ lastScore.total }} understood
        </p>
        <p class="muted small">
          {{ lastScore.correct === lastScore.total
            ? 'Full comprehension from audio alone — that is the skill.'
            : 'Misses go to your retry queue. Hear the line again below, then read it.' }}
        </p>
      </div>
      <div class="card stack">
        <p class="muted small">The story, line by line:</p>
        <div v-for="(line, i) in story.story" :key="i" class="spread line">
          <span class="small">{{ line }}</span>
          <span class="tts-pair">
            <button class="btn tts" aria-label="Hear it" @click="tts.speak(line, rate)">🔊</button>
            <button class="btn tts" aria-label="Word by word" @click="tts.speakSlow(line, rate)">🐢</button>
          </span>
        </div>
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done')">✓ Mark this day complete</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Exercise, OralStory } from '~/types/content'

const props = defineProps<{
  story: OralStory
  rate?: number
  recordKey: string
}>()

const emit = defineEmits<{ done: []; finished: [{ correct: number; total: number }] }>()

const progress = useProgress()
const tts = useTts()

const phase = ref<'listen' | 'questions' | 'done'>('listen')
const playing = ref(false)
const plays = ref(0)
const lastScore = ref({ correct: 0, total: 0 })

const rate = computed(() => props.rate ?? props.story.rate)

const questionItems = computed<Exercise[]>(() => props.story.questions.map(q => ({
  type: 'mc' as const,
  prompt: `${q.q} — ${q.en}`,
  options: q.options,
  answer: q.answer,
})))

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function playStory() {
  if (playing.value) return
  playing.value = true
  for (const line of props.story.story) {
    if (!playing.value) break
    await tts.speakAsync(line, rate.value)
    await sleep(600)
  }
  if (playing.value) plays.value += 1
  playing.value = false
}

function readyForQuestions() {
  playing.value = false
  tts.stop()
  phase.value = 'questions'
}

function onFinished(result: { correct: number; total: number; missed: { q: string; a: string }[] }) {
  lastScore.value = { correct: result.correct, total: result.total }
  progress.recordLesson(props.recordKey, result.correct, result.total)
  progress.logMistakes(result.missed)
  emit('finished', { correct: result.correct, total: result.total })
  phase.value = 'done'
}

onUnmounted(() => {
  playing.value = false
  tts.stop()
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
}
.play-btn:active { transform: scale(0.95); }
.gloss { font-style: italic; }
.replay { border-color: var(--path-oral); }
.line { align-items: center; }
.tts { min-height: 36px; padding: 4px 10px; flex-shrink: 0; }
.tts-pair { display: flex; gap: 6px; flex-shrink: 0; }
.score { font-size: 1.4rem; font-weight: 700; margin: 0; }
.okline { color: var(--ok); }
</style>
