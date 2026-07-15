<template>
  <NuxtLink
    :to="`/lesson/${lesson.id}`"
    class="card lesson"
    :class="{ done, optional, locked }"
    @click="onClick"
  >
    <span class="icon" aria-hidden="true">{{ locked ? '🔒' : icon }}</span>
    <span class="body">
      <span class="title">{{ lesson.title }}</span>
      <span class="muted small">
        <template v-if="locked">pass the exam above to unlock</template>
        <template v-else>{{ subtitle }}<template v-if="optional"> · optional</template></template>
      </span>
    </span>
    <span v-if="done" class="check" aria-label="done">
      ✓<template v-if="scorePct !== undefined">
        <span class="pct" :class="scoreClass">{{ scorePct }}%</span>
      </template>
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Lesson } from '~/types/content'
import { isOptional } from '~/content'

const props = defineProps<{ lesson: Lesson }>()
const progress = useProgress()
const { isLocked } = useLocking()
const done = computed(() => progress.isDone(props.lesson.id))
const locked = computed(() => isLocked(props.lesson.id))
const optional = computed(() => isOptional(props.lesson))

function onClick(e: MouseEvent) {
  if (locked.value) e.preventDefault()
}

const scorePct = computed<number | undefined>(() => {
  const s = progress.lessonScores[props.lesson.id]
  if (s && s.total > 0) return Math.round((s.correct / s.total) * 100)
  if (props.lesson.type === 'exam') return progress.examScores[props.lesson.id]
  return undefined
})

const scoreClass = computed(() => {
  const p = scorePct.value ?? 100
  return p >= 80 ? 'pct-ok' : p >= 60 ? 'pct-warn' : 'pct-err'
})

const icon = computed(() => {
  switch (props.lesson.type) {
    case 'external': return props.lesson.provider === 'link' ? '🔗' : '▶'
    case 'vocab': return '🃏'
    case 'exercises': return '✏️'
    case 'exam': return '🎓'
    case 'checkpoint': return '🏁'
  }
})

const subtitle = computed(() => {
  const min = `${props.lesson.durationMin} min`
  switch (props.lesson.type) {
    case 'external': return min
    case 'vocab': return `${props.lesson.cardIds.length} words · ${min}`
    case 'exercises': return `practice · ${min}`
    case 'exam': return `${props.lesson.questions} questions · pass ${props.lesson.passPercent}%`
    case 'checkpoint': return 'checkpoint'
  }
})
</script>

<style scoped>
.lesson {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: var(--fg);
  transition: transform 0.1s ease, border-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.lesson:active { transform: scale(0.985); border-color: var(--accent); }
.lesson.done { opacity: 0.62; }
.lesson.optional { border-style: dashed; }
.lesson.locked { opacity: 0.45; cursor: default; }
.lesson.locked:active { transform: none; border-color: var(--border); }
.opt-chip { margin-left: auto; flex-shrink: 0; }
.icon { font-size: 1.1rem; width: 28px; text-align: center; flex-shrink: 0; }
.body { display: flex; flex-direction: column; min-width: 0; }
.title { font-weight: 600; }
.check { margin-left: auto; color: var(--ok); font-weight: 700; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.pct { font-size: 0.78rem; font-weight: 700; }
.pct-ok { color: var(--ok); }
.pct-warn { color: var(--warn); }
.pct-err { color: var(--err); }
</style>
