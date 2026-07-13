<template>
  <div class="stack">
    <div class="assembled" :class="{ empty: placed.length === 0 }">
      <span v-if="placed.length === 0" class="muted small">Tap the words below in order…</span>
      <button
        v-for="(p, i) in placed"
        :key="`placed-${i}`"
        class="pill placed"
        type="button"
        @click="remove(i)"
      >
        {{ p.text }}
      </button>
    </div>
    <div class="bank">
      <button
        v-for="(w, i) in bank"
        :key="`bank-${i}`"
        class="pill"
        type="button"
        :disabled="w.used || disabled"
        @click="place(i)"
      >
        {{ w.text }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  words: string[]
  distractors: string[]
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

const bank = ref(shuffle([...props.words, ...props.distractors]).map(text => ({ text, used: false })))
const placed = ref<{ text: string; bankIdx: number }[]>([])

function sync() {
  emit('update:modelValue', placed.value.map(p => p.text).join(' '))
}

function place(i: number) {
  const w = bank.value[i]
  if (!w || w.used) return
  w.used = true
  placed.value.push({ text: w.text, bankIdx: i })
  sync()
}

function remove(i: number) {
  if (props.disabled) return
  const p = placed.value[i]
  if (!p) return
  bank.value[p.bankIdx]!.used = false
  placed.value.splice(i, 1)
  sync()
}
</script>

<style scoped>
.assembled {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 58px;
  padding: 10px 12px;
  border: 1px dashed var(--border);
  border-radius: 12px;
}
.bank { display: flex; flex-wrap: wrap; gap: 8px; }
.pill {
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--fg);
  font-size: 1rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s ease;
}
.pill:active { transform: scale(0.94); }
.pill:disabled { opacity: 0.25; cursor: default; }
.pill.placed { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
</style>
