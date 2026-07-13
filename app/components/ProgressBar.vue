<template>
  <div class="track" role="progressbar" :aria-valuenow="Math.round(value * 100)" aria-valuemin="0" aria-valuemax="100">
    <div class="fill" :style="{ width: `${Math.round(value * 100)}%` }" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<style scoped>
.track {
  height: 6px;
  border-radius: 999px;
  background: var(--border);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
  transition: width 0.3s ease;
}
</style>
