<template>
  <div class="stack">
    <!-- Phase 1 · PREVIEW: only the hard-to-segment key phrases. The story stays hidden. -->
    <template v-if="phase === 'preview'">
      <div class="card stack">
        <p class="muted small">
          🔑 Phase 1 · Preview the key phrases — the fused chunks worth hunting for.
          The story itself is <strong>not shown</strong>: its meaning must reach you by ear.
        </p>
        <div v-for="(k, i) in lesson.keyPhrases" :key="i" class="spread line">
          <span class="small"><strong>{{ k.fr }}</strong><br><span class="muted">{{ k.en }}</span></span>
          <span class="tts-pair">
            <button class="btn tts" aria-label="Hear it" @click="tts.speak(k.fr, lesson.rate)">🔊</button>
            <button class="btn tts" aria-label="Word by word" @click="tts.speakSlow(k.fr, lesson.rate)">🐢</button>
          </span>
        </div>
      </div>
      <button class="btn btn-primary btn-block" @click="phase = 'listen'">
        Ready — the whole story, by ear 🎧
      </button>
    </template>

    <!-- Phase 2 · LISTEN: whole story, audio only. Tap phrases as they fly by. -->
    <template v-else-if="phase === 'listen'">
      <div class="card player stack">
        <p class="muted small center">🎧 Phase 2 · Catch the key phrases and piece together what happens.</p>
        <button class="play-btn" :disabled="playing" aria-label="Play the story" @click="play(lesson.rate)">
          {{ playing ? '🔊' : plays > 0 ? '↻' : '▶️' }}
        </button>
        <p class="muted small center">{{ plays === 0 ? 'Play the story' : `Heard ${plays}×` }}</p>
        <button v-if="plays > 0" class="btn natural" :disabled="playing" @click="play(lesson.naturalRate ?? 1)">
          ⚡ Replay at natural speed
        </button>
      </div>
      <div class="card stack">
        <p class="muted small">Tap a phrase when you hear it fly by (optional — attention aid, not a score):</p>
        <div class="chips">
          <button
            v-for="(k, i) in lesson.keyPhrases"
            :key="i"
            class="chip-btn"
            :class="{ caught: caught.has(i) }"
            @click="toggleCaught(i)"
          >
            {{ caught.has(i) ? '✓ ' : '' }}{{ k.fr }}
          </button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" :disabled="plays === 0" @click="toQuestions">
        I'm ready for the questions
      </button>
    </template>

    <!-- Phase 3 · ANSWER: gist by ear, story still hidden -->
    <template v-else-if="phase === 'answer'">
      <button class="btn btn-block replay" :disabled="playing" @click="play(lesson.rate)">
        🔊 {{ playing ? 'Playing…' : 'Hear the story again (text stays hidden)' }}
      </button>
      <ExerciseRunner :exercises="questionItems" @finished="onFinished" />
    </template>

    <!-- Phase 4 · REVEAL: full text at last, with audio, for consolidation -->
    <template v-else>
      <div class="card stack">
        <p class="score" :class="{ okline: lastScore.correct === lastScore.total }">
          {{ lastScore.correct }}/{{ lastScore.total }} by ear
        </p>
        <p class="muted small">
          You marked {{ caught.size }}/{{ lesson.keyPhrases.length }} key phrases caught.
          {{ lastScore.correct === lastScore.total
            ? 'The plot arrived through your ear alone — that is the whole skill.'
            : 'Misses joined the retry queue. Now read WHILE listening — this is the consolidation phase.' }}
        </p>
      </div>
      <div class="card stack">
        <p class="muted small">The story, finally in writing — read along as you replay:</p>
        <div v-for="(line, i) in lesson.story" :key="i" class="spread line">
          <span class="small">{{ line }}</span>
          <span class="tts-pair">
            <button class="btn tts" aria-label="Hear it" @click="tts.speak(line, lesson.rate)">🔊</button>
            <button class="btn tts" aria-label="Word by word" @click="tts.speakSlow(line, lesson.rate)">🐢</button>
          </span>
        </div>
      </div>
      <button class="btn btn-primary btn-block" @click="$emit('done')">✓ Mark this day complete</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Exercise, RlaLesson } from '~/types/content'

const props = defineProps<{
  lesson: RlaLesson
  recordKey: string
}>()

const emit = defineEmits<{ done: []; finished: [{ correct: number; total: number }] }>()

const progress = useProgress()
const tts = useTts()

const phase = ref<'preview' | 'listen' | 'answer' | 'reveal'>('preview')
const playing = ref(false)
const plays = ref(0)
const lastScore = ref({ correct: 0, total: 0 })
const caught = ref(new Set<number>())

const questionItems = computed<Exercise[]>(() => props.lesson.questions.map(q => ({
  type: 'mc' as const,
  prompt: `${q.q} — ${q.en}`,
  options: q.options,
  answer: q.answer,
})))

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function play(rate: number) {
  if (playing.value) return
  playing.value = true
  for (const line of props.lesson.story) {
    if (!playing.value) break
    await tts.speakAsync(line, rate)
    await sleep(600)
  }
  if (playing.value) plays.value += 1
  playing.value = false
}

function toggleCaught(i: number) {
  const next = new Set(caught.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  caught.value = next
}

function toQuestions() {
  playing.value = false
  tts.stop()
  phase.value = 'answer'
}

function onFinished(result: { correct: number; total: number; missed: { q: string; a: string }[] }) {
  lastScore.value = { correct: result.correct, total: result.total }
  progress.recordLesson(props.recordKey, result.correct, result.total)
  progress.logMistakes(result.missed)
  emit('finished', { correct: result.correct, total: result.total })
  phase.value = 'reveal'
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
.natural { align-self: stretch; border-color: var(--path-oral); color: var(--path-oral-text); }
.replay { border-color: var(--path-oral); }
.line { align-items: center; }
.tts { min-height: 36px; padding: 4px 10px; flex-shrink: 0; }
.tts-pair { display: flex; gap: 6px; flex-shrink: 0; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--fg);
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.chip-btn.caught { border-color: var(--path-oral); color: var(--path-oral-text); background: var(--path-oral-soft); }
.score { font-size: 1.4rem; font-weight: 700; margin: 0; }
.okline { color: var(--ok); }
</style>
