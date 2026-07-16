<template>
  <div class="page stack">
    <h1>Path</h1>
    <section v-for="ch in curriculum" :key="ch.id" class="stack chapter">
      <button
        class="chapter-head"
        :class="{ open: isOpen(ch.id) }"
        :aria-expanded="isOpen(ch.id)"
        @click="toggle(ch.id)"
      >
        <span class="head-text">
          <span class="title">{{ ch.title }}</span>
          <span class="muted small">{{ ch.subtitle }}</span>
          <ProgressBar class="head-bar" :value="required(ch).length ? doneIn(ch) / required(ch).length : 0" />
        </span>
        <span class="head-meta">
          <span class="muted small">{{ doneIn(ch) }}/{{ required(ch).length }}</span>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
      <template v-if="isOpen(ch.id)">
        <template v-for="(day, di) in daysFor(ch)" :key="`${ch.id}-day-${di}`">
          <div class="day-head" :class="{ 'day-done': day.done, 'day-current': day.current }">
            <span>{{ day.label }}</span>
            <span class="muted small">
              {{ day.done ? '✓ done' : `~${day.minutes} min` }}<template v-if="day.score !== undefined"> · {{ day.score }}%</template>
            </span>
          </div>
          <LessonCard v-for="l in day.lessons" :key="l.id" :lesson="l" />
        </template>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Chapter, Lesson } from '~/types/content'
import { curriculum, isOptional, programDays } from '~/content'

const progress = useProgress()

const required = (ch: Chapter) => ch.lessons.filter(l => !isOptional(l))
const doneIn = (ch: Chapter) => required(ch).filter(l => progress.isDone(l.id)).length

interface Day {
  label: string
  lessons: Lesson[]
  minutes: number
  done: boolean
  current: boolean
  score?: number
}

function dayScore(lessons: Lesson[]): number | undefined {
  const pcts: number[] = []
  for (const l of lessons) {
    const s = progress.lessonScores[l.id]
    if (s && s.total > 0) pcts.push((s.correct / s.total) * 100)
    else if (l.type === 'exam' && progress.examScores[l.id] !== undefined) pcts.push(progress.examScores[l.id]!)
  }
  if (pcts.length === 0) return undefined
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

// Chapter days come from the shared program-day model (globally numbered,
// same numbers the Today tab uses).
const globalCurrentDay = computed(() =>
  programDays.find(d => d.lessons.some(l => !isOptional(l) && !progress.isDone(l.id))),
)

function daysFor(ch: Chapter): Day[] {
  return programDays
    .filter(d => d.chapterId === ch.id)
    .map((d) => {
      const req = d.lessons.filter(l => !isOptional(l))
      return {
        label: `Day ${d.number}`,
        lessons: d.lessons,
        minutes: req.reduce((s, l) => s + l.durationMin, 0),
        done: req.every(l => progress.isDone(l.id)),
        current: d === globalCurrentDay.value,
        score: dayScore(d.lessons),
      }
    })
}

const currentChapterId = computed(
  () => curriculum.find(ch => doneIn(ch) < ch.lessons.length)?.id ?? curriculum[0]?.id,
)

const open = ref<Record<string, boolean>>({})
const isOpen = (id: string) => open.value[id] ?? id === currentChapterId.value
const toggle = (id: string) => { open.value[id] = !isOpen(id) }
</script>

<style scoped>
.chapter { margin-bottom: 10px; }
.chapter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  color: var(--fg);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.1s ease, background 0.15s ease;
}
.chapter-head:active { transform: scale(0.985); background: var(--accent-soft); }
.chapter-head.open { border-color: var(--accent); }
.head-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.head-bar { margin-top: 4px; }
.title { font-size: 1.05rem; font-weight: 650; }
.head-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.chev { width: 20px; height: 20px; color: var(--muted); transition: transform 0.2s ease; }
.chapter-head.open .chev { transform: rotate(90deg); }
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 10px 2px 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.day-head.day-current { color: var(--accent); }
.day-head.day-done { opacity: 0.6; }
</style>
