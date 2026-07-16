<template>
  <div class="stack">
    <h2>Say it aloud</h2>
    <div class="card target-card">
      <p class="target">{{ exercise.target }}</p>
      <p class="muted small">{{ exercise.en }}</p>
      <button class="btn" @click="hear">🔊 Hear it</button>
    </div>

    <template v-if="speech.supported.value && !speech.failed.value">
      <button
        class="btn btn-block"
        :class="{ 'btn-primary': !heard, listening: speech.listening.value }"
        @click="listen"
      >
        {{ speech.listening.value ? '● Listening…' : heard ? '🎙 Try again' : '🎙 Speak' }}
      </button>
      <p v-if="speech.error.value" class="feedback-err small">{{ speech.error.value }}</p>
      <button class="btn switch-btn" @click="speech.markFailed()">
        Recognition not working? Record yourself instead →
      </button>
      <div v-if="heard" class="card">
        <div class="diff">
          <span v-for="(w, i) in diff" :key="i" class="chip word" :class="w.status">{{ w.word }}</span>
        </div>
        <p class="muted small heard">Recognizer heard: “{{ heard }}”</p>
        <p class="small" :class="passed ? 'okline' : 'muted'">
          {{ passed ? 'Understood — well done.' : 'Some words were not recognized. Listen again, then retry — or continue.' }}
        </p>
      </div>
    </template>

    <template v-else>
      <p class="muted small">
        Recording mode: tap record, say the phrase, then compare your playback against 🔊 Hear it.
        Your own ear catching the difference IS the exercise.
      </p>
      <p class="muted small">
        (Automatic checking is blocked here — on iPhone, Apple only allows it in a regular Safari tab,
        not in Chrome and not inside installed home-screen apps.)
      </p>
      <button class="btn btn-block" :class="{ 'btn-primary': !recordingUrl }" @click="toggleRecording">
        {{ recording ? '■ Stop recording' : '⏺ Record yourself' }}
      </button>
      <audio v-if="recordingUrl" :src="recordingUrl" controls class="playback" />
      <button v-if="speech.supported.value" class="btn switch-btn" @click="speech.retryRecognition()">
        Try automatic recognition again
      </button>
    </template>

    <button v-if="attempted" class="btn btn-primary btn-block" @click="$emit('done', passed)">Continue</button>
    <button v-else class="btn btn-block" @click="$emit('done', false)">Skip</button>
  </div>
</template>

<script setup lang="ts">
import { wordDiff } from '~/utils/grading'

const props = defineProps<{
  exercise: { type: 'speak'; target: string; en: string }
}>()
defineEmits<{ done: [correct: boolean] }>()

const progress = useProgress()
const tts = useTts()
const speech = useSpeech()

const heard = ref<string | null>(null)
const diff = computed(() => (heard.value ? wordDiff(props.exercise.target, heard.value) : []))
const passed = computed(() => diff.value.length > 0 && diff.value.every(w => w.status !== 'miss'))

const recording = ref(false)
const recordingUrl = ref<string | null>(null)
let recorder: MediaRecorder | null = null
let chunks: Blob[] = []

const attempted = computed(() => heard.value !== null || recordingUrl.value !== null)

function hear() {
  tts.speak(props.exercise.target, progress.settings.ttsRate)
}

function listen() {
  heard.value = null
  speech.start((transcript) => {
    heard.value = transcript
  })
}

async function toggleRecording() {
  if (recording.value) {
    recorder?.stop()
    return
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    chunks = []
    recorder = new MediaRecorder(stream)
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
      recordingUrl.value = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }))
      stream.getTracks().forEach(t => t.stop())
      recording.value = false
    }
    recorder.start()
    recording.value = true
  } catch {
    recording.value = false
  }
}

onUnmounted(() => {
  if (recordingUrl.value) URL.revokeObjectURL(recordingUrl.value)
})
</script>

<style scoped>
.target { font-size: 1.35rem; font-weight: 650; margin-bottom: 2px; }
.target-card { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.listening { border-color: var(--err); color: var(--err); }
.switch-btn {
  min-height: 36px;
  padding: 4px 10px;
  align-self: flex-start;
  border: 0;
  background: none;
  font-size: 0.82rem;
  color: var(--muted);
}
.diff { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.word.ok { background: var(--ok-soft); color: var(--ok); }
.word.near { background: var(--warn-soft); color: var(--warn); }
.word.miss { background: var(--err-soft); color: var(--err); }
.okline { color: var(--ok); }
.heard { margin: 0 0 4px; }
.playback { width: 100%; }
</style>
