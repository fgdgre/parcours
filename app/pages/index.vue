<template>
  <div class="page stack">
    <header class="spread">
      <div>
        <h1>Today</h1>
        <p class="muted small">{{ dateLabel }}</p>
      </div>
      <NuxtLink to="/guide" class="muted small guide-link">How this works →</NuxtLink>
    </header>

    <NuxtLink v-if="backupOverdue" to="/progress" class="card backup-nudge spread">
      <span class="small">💾 It's been a while — export a backup of your progress.</span>
      <span class="chip">Backup →</span>
    </NuxtLink>

    <!-- 1. Learn new things first -->
    <template v-if="dayFinishedToday">
      <div class="card stack">
        <h2>✓ Day {{ finishedDayNumber }} complete</h2>
        <p class="muted">
          That's today's plan done. Practice below if you want more — or keep going.
        </p>
        <button class="btn btn-block" @click="continueNextDay">
          Continue with Day {{ finishedDayNumber + 1 }} →
        </button>
      </div>
    </template>

    <template v-else-if="currentDay && dayLessons.length > 0">
      <div class="spread">
        <h2>Day {{ currentDay.number }} <span class="muted small">of {{ programDays.length }}</span></h2>
        <span class="muted small">~{{ minutesLeft }} min left</span>
      </div>
      <LessonCard v-for="l in dayLessons" :key="l.id" :lesson="l" />
      <NuxtLink v-if="firstIncomplete" :to="`/lesson/${firstIncomplete.id}`" class="btn btn-primary btn-block">
        {{ dayStarted ? 'Continue' : 'Start' }}
      </NuxtLink>
    </template>

    <div v-else class="card">
      <h2>All caught up</h2>
      <p class="muted">Every lesson on the path is done. Practice below, or revisit anything from the Path tab.</p>
    </div>

    <!-- 2. Then use what you learned -->
    <h2 class="practice-head">Practice what you learned</h2>

    <NuxtLink v-if="progress.dueIds.length > 0" to="/cards" class="card due spread">
      <span><strong>{{ progress.dueIds.length }}</strong> card{{ progress.dueIds.length === 1 ? '' : 's' }} to review</span>
      <span class="chip">Review →</span>
    </NuxtLink>

    <NuxtLink v-if="progress.dueRetries.length > 0" to="/mistakes" class="card retry-due spread">
      <span>🔁 <strong>{{ progress.dueRetries.length }}</strong> mistake{{ progress.dueRetries.length === 1 ? '' : 's' }} due for retry</span>
      <span class="chip">Fix →</span>
    </NuxtLink>

    <NuxtLink v-if="progress.wordsSeen >= 10" to="/daily" class="card spread" :class="{ 'daily-done': dailyDone }">
      <span>✍️ Daily sentences <span v-if="dailyDone" class="done-check">✓</span></span>
      <span class="chip">{{ dailyDone ? 'again →' : '5 fresh →' }}</span>
    </NuxtLink>

    <div class="workouts">
      <NuxtLink
        v-for="w in workouts"
        :key="w.kind"
        :to="`/workout/${w.kind}`"
        class="card workout"
        :class="{ 'daily-done': w.done }"
      >
        <span class="w-icon">{{ w.icon }}</span>
        <span class="small w-label">{{ w.label }}</span>
        <span class="small" :class="w.done ? 'done-check' : 'muted'">{{ w.done ? '✓ done' : w.sub }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isOptional, programDays } from '~/content'
import { todayIso } from '~/utils/srs'

const progress = useProgress()
const { isLocked } = useLocking()

const dateLabel = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long',
})

const requiredOf = (lessons: { id: string }[]) =>
  (lessons as any[]).filter(l => !isOptional(l))

/** First day that still has an incomplete required lesson. */
const currentDay = computed(() =>
  programDays.find(d => requiredOf(d.lessons).some(l => !progress.isDone(l.id))),
)

/** The day just before the current one — used to detect "finished today". */
const previousDay = computed(() => {
  const idx = currentDay.value ? programDays.indexOf(currentDay.value) : programDays.length
  return idx > 0 ? programDays[idx - 1] : undefined
})

/** True when the most recently completed day was finished TODAY — then Today
 * rests, unless the user explicitly chose to continue with the next day. */
const dayFinishedToday = computed(() => {
  if (progress.isDone(`continue-${todayIso()}`)) return false
  const prev = previousDay.value
  if (!prev) return false
  const dates = requiredOf(prev.lessons).map(l => progress.completedLessons[l.id])
  return dates.length > 0 && dates.every(Boolean) && dates.some(d => d === todayIso())
})

function continueNextDay() {
  progress.markDone(`continue-${todayIso()}`)
}

const finishedDayNumber = computed(() => previousDay.value?.number ?? 0)

// the whole day stays visible — done lessons show their checkmark like on Path
const dayLessons = computed(() =>
  currentDay.value ? requiredOf(currentDay.value.lessons) : [],
)

const firstIncomplete = computed(() =>
  dayLessons.value.find(l => !progress.isDone(l.id) && !isLocked(l.id)),
)

const dayStarted = computed(() => dayLessons.value.some(l => progress.isDone(l.id)))

const minutesLeft = computed(() =>
  dayLessons.value.filter(l => !progress.isDone(l.id)).reduce((s, l) => s + l.durationMin, 0),
)

const dailyDone = computed(() => progress.isDone(`daily-${todayIso()}`))

const workouts = computed(() => ([
  { kind: 'quiz', icon: '🧠', label: 'Quiz', sub: '10 q' },
  { kind: 'writing', icon: '📝', label: 'Writing', sub: '1 task' },
  { kind: 'speaking', icon: '🎙', label: 'Speaking', sub: '5 phrases' },
].map(w => ({ ...w, done: progress.isDone(`workout-${w.kind}-${todayIso()}`) }))))

const backupOverdue = computed(() => {
  if (progress.wordsSeen === 0) return false
  const last = progress.settings.lastBackupAt
  if (!last) return Object.keys(progress.completedLessons).length >= 15
  const days = (new Date(todayIso()).getTime() - new Date(last).getTime()) / 86400000
  return days >= 7
})
</script>

<style scoped>
.guide-link { flex-shrink: 0; padding-top: 6px; }
.due { border-color: var(--accent); }
.retry-due { border-color: var(--warn); }
.daily-done { opacity: 0.7; }
.done-check { color: var(--ok); font-weight: 700; }
.practice-head { margin-top: 6px; }
.backup-nudge { border-color: var(--warn); }
.workouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.workout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 6px;
  color: var(--fg);
  -webkit-tap-highlight-color: transparent;
}
.workout:active { transform: scale(0.97); border-color: var(--accent); }
.w-icon { font-size: 1.3rem; }
.w-label { font-weight: 650; }
</style>
