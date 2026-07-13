<template>
  <div class="page stack">
    <header>
      <h1>Today</h1>
      <p class="muted small">{{ dateLabel }}</p>
    </header>

    <NuxtLink v-if="progress.dueIds.length > 0" to="/cards" class="card due spread">
      <span><strong>{{ progress.dueIds.length }}</strong> card{{ progress.dueIds.length === 1 ? '' : 's' }} to review</span>
      <span class="chip">Review →</span>
    </NuxtLink>

    <NuxtLink v-if="progress.wordsSeen >= 15" to="/daily" class="card spread" :class="{ 'daily-done': dailyDone }">
      <span>✍️ Daily sentences <span v-if="dailyDone" class="done-check">✓</span></span>
      <span class="chip">{{ dailyDone ? 'again →' : '5 fresh →' }}</span>
    </NuxtLink>

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
import { allLessons } from '~/content'
import { todayIso } from '~/utils/srs'

const progress = useProgress()

const dateLabel = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long',
})

const session = computed(() => {
  const incomplete = allLessons.filter(l => !progress.isDone(l.id))
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
</script>

<style scoped>
.due { border-color: var(--accent); }
.daily-done { opacity: 0.7; }
.done-check { color: var(--ok); font-weight: 700; }
</style>
