<template>
  <div class="page stack">
    <header class="spread">
      <div>
        <h1>Today</h1>
        <p class="muted small">{{ dateLabel }}</p>
      </div>
      <NuxtLink to="/guide" class="muted small guide-link">How this works →</NuxtLink>
    </header>

    <NuxtLink v-if="progress.dueIds.length > 0" to="/cards" class="card due spread">
      <span><strong>{{ progress.dueIds.length }}</strong> card{{ progress.dueIds.length === 1 ? '' : 's' }} to review</span>
      <span class="chip">Review →</span>
    </NuxtLink>

    <NuxtLink v-if="progress.wordsSeen >= 15" to="/daily" class="card spread" :class="{ 'daily-done': dailyDone }">
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

    <template v-if="session.length > 0">
      <div class="spread">
        <h2>Your session</h2>
        <span class="muted small">~{{ totalMin }} min</span>
      </div>
      <LessonCard v-for="l in session" :key="l.id" :lesson="l" />
      <NuxtLink :to="`/lesson/${session[0]!.id}`" class="btn btn-primary btn-block">Start</NuxtLink>
    </template>

    <div v-else class="card">
      <h2>All caught up</h2>
      <p class="muted">Every lesson on the path is done. Review your cards, or revisit anything from the Path tab.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { allLessons, isOptional } from '~/content'
import { todayIso } from '~/utils/srs'

const progress = useProgress()
const { isLocked } = useLocking()

const dateLabel = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long',
})

const session = computed(() => {
  const incomplete = allLessons.filter(l => !progress.isDone(l.id) && !isOptional(l) && !isLocked(l.id))
  const picked = []
  let minutes = 0
  for (const lesson of incomplete) {
    if (picked.length >= 4) break
    if (picked.length > 0 && minutes + lesson.durationMin > 25) break
    picked.push(lesson)
    minutes += lesson.durationMin
  }
  return picked
})

const totalMin = computed(() => session.value.reduce((s, l) => s + l.durationMin, 0))

const dailyDone = computed(() => progress.isDone(`daily-${todayIso()}`))

const workouts = computed(() => ([
  { kind: 'quiz', icon: '🧠', label: 'Quiz', sub: '10 q' },
  { kind: 'writing', icon: '📝', label: 'Writing', sub: '1 task' },
  { kind: 'speaking', icon: '🎙', label: 'Speaking', sub: '5 phrases' },
].map(w => ({ ...w, done: progress.isDone(`workout-${w.kind}-${todayIso()}`) }))))
</script>

<style scoped>
.guide-link { flex-shrink: 0; padding-top: 6px; }
.due { border-color: var(--accent); }
.daily-done { opacity: 0.7; }
.done-check { color: var(--ok); font-weight: 700; }
.guide-link { flex-shrink: 0; padding-top: 6px; }
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
