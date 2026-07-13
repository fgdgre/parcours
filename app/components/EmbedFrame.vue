<template>
  <div class="stack">
    <div v-if="lesson.provider === 'youtube' && lesson.embedId" class="video">
      <iframe
        :src="`https://www.youtube-nocookie.com/embed/${lesson.embedId}`"
        :title="lesson.title"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>
    <div v-else-if="lesson.provider === 'soundcloud'" class="audio">
      <iframe
        :src="`https://w.soundcloud.com/player/?url=${encodeURIComponent(lesson.url)}&auto_play=false&show_comments=false&visual=false`"
        :title="lesson.title"
        loading="lazy"
      />
    </div>
    <a class="btn btn-block" :href="lesson.url" target="_blank" rel="noopener">
      Open externally ↗
    </a>
  </div>
</template>

<script setup lang="ts">
import type { ExternalLesson } from '~/types/content'

defineProps<{ lesson: ExternalLesson }>()
</script>

<style scoped>
.video {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius);
  overflow: hidden;
  background: #000;
}
.video iframe { width: 100%; height: 100%; border: 0; display: block; }
.audio iframe { width: 100%; height: 166px; border: 0; border-radius: var(--radius); }
</style>
