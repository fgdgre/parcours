<template>
  <div class="ptabs" role="tablist">
    <button
      v-for="t in tabs"
      :key="t.id"
      role="tab"
      class="ptab"
      :class="{ active: modelValue === t.id }"
      :style="modelValue === t.id ? { color: t.color, borderColor: t.color } : {}"
      :aria-selected="modelValue === t.id"
      @click="$emit('update:modelValue', t.id)"
    >
      {{ t.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
export interface PathTab {
  id: string
  label: string
  color: string
}
defineProps<{ tabs: PathTab[]; modelValue: string }>()
defineEmits<{ 'update:modelValue': [id: string] }>()
</script>

<style scoped>
.ptabs {
  display: flex;
  gap: 4px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 4px;
}
.ptab {
  flex: 1;
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 8px;
  padding: 8px 4px;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ptab.active { background: var(--bg); }
</style>
