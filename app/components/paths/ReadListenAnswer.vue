<template>
  <div class="stack">
    <!-- Phase 1 · READ: text visible, no audio -->
    <template v-if="phase === 'read'">
      <div class="card stack">
        <p class="muted small">📖 Phase 1 · Read for meaning — after this, the text disappears and your ear takes over. No audio yet.</p>
        <p v-for="(line, i) in lesson.story" :key="i" class="story-line">{{ line }}</p>
      </div>
      <div v-if="lesson.glossary.length > 0" class="card stack">
        <p class="muted small">New words:</p>
        <div v-for="(g, i) in lesson.glossary" :key="i" class="spread">
          <span class="small"><strong>{{ g.fr }}</strong></span>
          <span class="muted small">{{ g.en }}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-block" @click="phase = 'listen'">
        Ready — hide the text and listen 🎧
      </button>
    </template>

    <!-- Phase 2 · LISTEN: text locked away, audio only -->
    <template v-else-if="phase === 'listen'">
      <div class="card player stack">
        <p class="muted small center">🎧 Phase 2 · The text is gone — map the sounds onto what you read.</p>
        <button class="play-btn" :disabled="playing" aria-label="Play the story" @click="play(lesson.rate)">
          {{ playing ? '🔊' : plays > 0 ? '↻' : '▶️' }}
        </button>
        <p class="muted small center">{{ plays === 0 ? 'Play the story' : `Heard ${plays}×` }}</p>
        <button v-if="plays > 0" class="btn natural" :disabled="playing" @click="play(lesson.naturalRate ?? 1)">
          ⚡ Replay at natural speed
        </button>
      </div>
      <button class="btn btn-primary btn-block" :disabled="plays === 0" @click="toQuestions">
        I'm ready for the questions
      </button>
    </template>

    <!-- Phase 3 · ANSWER: still no text, replay allowed -->
    <template v-else-if="phase === 'answer'">
      <button class="btn btn-block replay" :disabled="playing" @click="play(lesson.rate)">
        🔊 {{ playing ? 'Playing…' : 'Hear the story again (text stays hidden)' }}
      </button>
      <ExerciseRunner :exercises="questionItems" @finished="onFinished" />
    </template>

    <!-- Phase 4 · REVEAL: text + audio + score together -->
    <template v-else>
      <div class="card stack">
        <p class="score" :class="{ okline: lastScore.correct === lastScore.total }">
          {{ lastScore.correct }}/{{ lastScore.total }} by ear
        </p>
        <p class="muted small">
          {{ lastScore.correct === lastScore.total
            ? 'Understood without the text — that is exactly the skill being built.'
            : 'Misses joined the retry queue. Now read WHILE listening — consolidation is what this phase is for.' }}
        </p>
      </div>
      <div class="card stack">
        <p class="muted small">The text returns — read along as you replay:</p>
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

const phase = ref<'read' | 'listen' | 'answer' | 'reveal'>('read')
const playing = ref(false)
const plays = ref(0)
const lastScore = ref({ correct: 0, total: 0 })

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
.story-line { margin: 0; line-height: 1.6; font-size: 1.05rem; }
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
.score { font-size: 1.4rem; font-weight: 700; margin: 0; }
.okline { color: var(--ok); }
</style>
