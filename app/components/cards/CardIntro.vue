<template>
  <div v-if="card" class="stack">
    <!-- Pass 1: meet every word -->
    <template v-if="phase === 'intro'">
      <p class="muted small">New word {{ idx + 1 }} of {{ queue.length }}</p>
      <div class="card word-card">
        <div class="row">
          <span class="fr">{{ card.fr }}</span>
          <button class="btn tts" aria-label="Hear it" @click="hear(card)">🔊</button>
        </div>
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
      </div>
      <div class="feedback-actions">
        <ExerciseNote :note-key="`card:${card.id}`" what="word" />
      </div>
      <button class="btn btn-primary btn-block" @click="nextIntro">
        {{ idx + 1 < queue.length ? 'Got it — next word' : (typables.length > 0 ? 'Got it — now spell them all' : 'Got it') }}
      </button>
    </template>

    <!-- Pass 2: spell every (single-word) card from memory -->
    <template v-else>
      <p class="muted small">Spelling {{ spellIdx + 1 }} of {{ typables.length }} — from memory</p>
      <div class="card word-card">
        <div class="row">
          <span class="en">{{ spellCard!.en }}</span>
          <button class="btn tts" aria-label="Hear it" @click="hear(spellCard!)">🔊</button>
        </div>
        <p class="muted small">Type the French word (tap 🔊 to hear it):</p>
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
          <p v-if="spellOk && !accentSlip" class="small okline">✓ {{ spellCard!.fr }}</p>
          <p v-else-if="accentSlip" class="small warn-note">
            ⚠️ Almost — accents matter: <strong>{{ spellCard!.fr }}</strong>
          </p>
          <p v-else class="small err-note">✗ It's <strong>{{ spellCard!.fr }}</strong></p>
        </template>
      </div>
      <button v-if="!checked" class="btn btn-primary btn-block" :disabled="!spelling.trim()" @click="check">Check</button>
      <button v-else class="btn btn-primary btn-block" @click="nextSpell">
        {{ spellIdx + 1 < typables.length ? 'Next word' : 'Finish' }}
      </button>
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
const phase = ref<'intro' | 'spell'>('intro')
const card = computed(() =>
  phase.value === 'intro' ? queue.value[idx.value] : spellCard.value,
)

/** Only single words get the spelling pass — phrases stay tap-through. */
const typables = computed(() =>
  queue.value.filter(c => !c.fr.includes(' ') && !c.fr.includes('/')),
)
const spellIdx = ref(0)
const spellCard = computed(() => typables.value[spellIdx.value])

const spelling = ref('')
const checked = ref(false)
const spellOk = ref(false)
const accentSlip = ref(false)
const spellEl = ref<HTMLInputElement>()

watch(card, c => c && phase.value === 'intro' && tts.speak(c.fr, progress.settings.ttsRate))

function hear(c: Card) {
  tts.speak(c.fr, progress.settings.ttsRate)
}

function nextIntro() {
  const c = queue.value[idx.value]
  if (!c) return
  emit('introduced', c.id)
  if (idx.value + 1 < queue.value.length) {
    idx.value += 1
  } else if (typables.value.length > 0) {
    phase.value = 'spell'
    nextTick(() => spellEl.value?.focus())
  } else {
    emit('finished')
  }
}

function check() {
  const c = spellCard.value
  if (!c || !spelling.value.trim()) return
  const lenient = matchAnswer(spelling.value, [c.fr], { strictAccents: false })
  const strict = matchAnswer(spelling.value, [c.fr], { strictAccents: true })
  spellOk.value = lenient
  accentSlip.value = lenient && !strict
  progress.recordRun({ spelling: { correct: strict ? 1 : 0, total: 1 } })
  if (!strict) {
    progress.logMistakes([{ q: `Spell: ${c.en}`, a: c.fr }])
  }
  checked.value = true
}

function onEnter() {
  if (!checked.value) check()
  else nextSpell()
}

function nextSpell() {
  spelling.value = ''
  checked.value = false
  spellOk.value = false
  accentSlip.value = false
  if (spellIdx.value + 1 < typables.value.length) {
    spellIdx.value += 1
    nextTick(() => spellEl.value?.focus())
  } else {
    emit('finished')
  }
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
