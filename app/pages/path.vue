<template>
  <div class="page stack">
    <h1>Path</h1>
    <section v-for="ch in curriculum" :key="ch.id" class="stack chapter">
      <button class="chapter-head" @click="toggle(ch.id)">
        <span class="head-text">
          <span class="title">{{ ch.title }}</span>
          <span class="muted small">{{ ch.subtitle }}</span>
        </span>
        <span class="muted small count">{{ doneIn(ch) }}/{{ ch.lessons.length }}</span>
      </button>
      <ProgressBar :value="ch.lessons.length ? doneIn(ch) / ch.lessons.length : 0" />
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
  gap: 10px;
  background: none;
  border: 0;
  padding: 0;
  color: var(--fg);
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.head-text { display: flex; flex-direction: column; }
.title { font-size: 1.05rem; font-weight: 650; }
.count { flex-shrink: 0; }
</style>
