<template>
  <div v-if="card" class="stack">
    <p class="muted small">New word {{ idx + 1 }} of {{ queue.length }}</p>

    <template v-if="phase === 'show'">
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
      <button class="btn btn-primary btn-block" @click="gotIt">
        {{ typable ? 'Got it — now type it' : 'Got it' }}
      </button>
    </template>

    <template v-else>
      <div class="card word-card">
        <div class="row">
          <span class="en">{{ card.en }}</span>
          <button class="btn tts" aria-label="Hear it" @click="hear">🔊</button>
        </div>
        <p class="muted small">Type the French word from memory (tap 🔊 to hear it again):</p>
        <input
          ref="spellEl"
          v-model="spelling"
          class="input"
          type="text"
          lang="fr"
          autocapitalize="off"
          autocorrect="off"
          autocomplete="off"
          spellcheck="false"
          :disabled="checked"
          placeholder="…"
          @keydown.enter="onEnter"
        >
        <template v-if="checked">
          <p v-if="spellOk && !accentSlip" class="small okline">✓ {{ card.fr }}</p>
          <p v-else-if="accentSlip" class="small warn-note">
            ⚠️ Almost — accents matter: <strong>{{ card.fr }}</strong>
          </p>
          <p v-else class="small err-note">✗ It's <strong>{{ card.fr }}</strong></p>
        </template>
      </div>
      <button v-if="!checked" class="btn btn-primary btn-block" :disabled="!spelling.trim()" @click="check">Check</button>
      <button v-else class="btn btn-primary btn-block" @click="next">Next word</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/content'
import { matchAnswer } from '~/utils/grading'

const props = defineProps<{ cards: Card[] }>()
const emit = defineEmits<{ introduced: [id: string]; finished: [] }>()

const progress = useProgress()
const tts = useTts()
const queue = ref<Card[]>([...props.cards])
const idx = ref(0)
const card = computed(() => queue.value[idx.value])

const phase = ref<'show' | 'type'>('show')
const spelling = ref('')
const checked = ref(false)
const spellOk = ref(false)
const accentSlip = ref(false)
const spellEl = ref<HTMLInputElement>()

/** Only single words get the typing step — phrases stay tap-through. */
const typable = computed(() =>
  !!card.value && !card.value.fr.includes(' ') && !card.value.fr.includes('/'),
)

watch(card, c => c && tts.speak(c.fr, progress.settings.ttsRate), { immediate: false })

function hear() {
  if (card.value) tts.speak(card.value.fr, progress.settings.ttsRate)
}

function gotIt() {
  if (!card.value) return
  if (typable.value) {
    phase.value = 'type'
    nextTick(() => spellEl.value?.focus())
  } else {
    next()
  }
}

function check() {
  if (!card.value || !spelling.value.trim()) return
  const lenient = matchAnswer(spelling.value, [card.value.fr], { strictAccents: false })
  const strict = matchAnswer(spelling.value, [card.value.fr], { strictAccents: true })
  spellOk.value = lenient
  accentSlip.value = lenient && !strict
  progress.recordRun({ spelling: { correct: strict ? 1 : 0, total: 1 } })
  if (!strict) {
    progress.logMistakes([{ q: `Spell: ${card.value.en}`, a: card.value.fr }])
  }
  checked.value = true
}

function onEnter() {
  if (!checked.value) check()
  else next()
}

function next() {
  if (!card.value) return
  emit('introduced', card.value.id)
  phase.value = 'show'
  spelling.value = ''
  checked.value = false
  spellOk.value = false
  accentSlip.value = false
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
.okline { color: var(--ok); font-weight: 600; margin: 0; }
.warn-note { color: var(--warn); margin: 0; }
.err-note { color: var(--err); margin: 0; }
</style>
