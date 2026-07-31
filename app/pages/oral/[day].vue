<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>

    <template v-if="entry && lockedAhead">
      <div class="card stack">
        <p><strong>🔒 Day {{ entry.day }} is still locked.</strong></p>
        <p class="muted small">The ladder goes in order — repetition before speed.</p>
        <NuxtLink to="/path" class="btn btn-block">Back to the Path</NuxtLink>
      </div>
    </template>

    <template v-else-if="entry">
      <div>
        <p class="path-label">🎧 Listening · Day {{ entry.day }} of {{ oralLadder.length }}</p>
        <h1>{{ oralDayTitle(entry) }}</h1>
        <p v-if="entry.note" class="muted small">{{ entry.note }}</p>
      </div>

      <div v-if="done" class="card stack">
        <p class="okline">✓ This day is complete.</p>
        <p class="muted small">Repeating is always allowed — repetition is the point.</p>
      </div>

      <PassivePlayer
        v-if="entry.kind === 'passive'"
        :items="passiveItems"
        :rate="entry.rate ?? 0.88"
        @done="finish"
      />

      <StoryPlayer
        v-else-if="entry.kind === 'story' && story"
        :key="`${entry.day}-${story.id}`"
        :story="story"
        :rate="entry.rate"
        :record-key="oralDayKey(entry.day)"
        @done="finish"
      />

      <template v-else-if="entry.kind === 'dictation-check'">
        <div class="card stack">
          <p class="muted small">
            This week's measurement: one dictation workout, clear head, no pressure.
            The score is a thermometer, not a grade — expect it low, watch it step up
            over the weeks as the listening minutes pile up.
          </p>
          <NuxtLink to="/workout/dictation" class="btn btn-primary btn-block">
            🎧 Run the dictation check
          </NuxtLink>
          <button class="btn btn-block" :disabled="!checkDoneToday" @click="finish">
            {{ checkDoneToday ? '✓ Check done — complete the ladder' : 'Finish the workout first' }}
          </button>
        </div>
      </template>
    </template>

    <div v-else class="card">
      <p class="muted">That listening day doesn't exist. <NuxtLink to="/path">Back to the Path</NuxtLink>.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { oralDayKey, oralDayTitle, oralLadder, passiveById, storyById } from '~/content/paths'
import { todayIso } from '~/utils/srs'

const route = useRoute()
const router = useRouter()
const progress = useProgress()

const dayNum = computed(() => Number(route.params.day))
const entry = computed(() => oralLadder.find(d => d.day === dayNum.value))
const done = computed(() => entry.value ? progress.isDone(oralDayKey(entry.value.day)) : false)

const passiveItems = computed(() =>
  entry.value?.refs.flatMap(r => passiveById[r]?.items ?? []) ?? [],
)
const story = computed(() =>
  entry.value?.kind === 'story' ? storyById[entry.value.refs[0] ?? ''] : undefined,
)
const lockedAhead = computed(() => {
  if (!entry.value || done.value) return false
  const current = oralLadder.find(d => !progress.isDone(oralDayKey(d.day)))
  return !!current && entry.value.day > current.day
})
const checkDoneToday = computed(() => progress.isDone(`workout-dictation-${todayIso()}`))

function finish() {
  if (entry.value) progress.markDone(oralDayKey(entry.value.day))
  navigateTo('/path')
}

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/path')
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
.path-label { color: var(--path-oral-text); font-weight: 700; font-size: 0.85rem; margin: 0 0 4px; }
.okline { color: var(--ok); font-weight: 600; margin: 0; }
</style>
