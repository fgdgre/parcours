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
          <ProgressBar class="head-bar" :value="ch.lessons.length ? doneIn(ch) / ch.lessons.length : 0" />
        </span>
        <span class="head-meta">
          <span class="muted small">{{ doneIn(ch) }}/{{ ch.lessons.length }}</span>
          <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
      <template v-if="isOpen(ch.id)">
        <LessonCard v-for="l in ch.lessons" :key="l.id" :lesson="l" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Chapter } from '~/types/content'
import { curriculum } from '~/content'

const progress = useProgress()

const doneIn = (ch: Chapter) => ch.lessons.filter(l => progress.isDone(l.id)).length

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
</style>
