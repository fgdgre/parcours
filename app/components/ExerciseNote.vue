<template>
  <button class="btn note-btn" :class="{ has: hasNote }" type="button" @click="toggle">
    {{ hasNote ? '📝 Note ●' : '📝 Note' }}
  </button>
  <textarea
    v-if="open"
    v-model="draft"
    class="input note-area"
    rows="2"
    :placeholder="`Your note about this ${what}…`"
    @blur="save"
  />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  noteKey: string
  what?: string
}>(), { what: 'question' })

const progress = useProgress()
const open = ref(false)
const draft = ref('')

const hasNote = computed(() => !!(progress.notes as Record<string, string>)[props.noteKey])

watch(() => props.noteKey, () => {
  open.value = false
  draft.value = (progress.notes as Record<string, string>)[props.noteKey] ?? ''
}, { immediate: true })

function toggle() {
  if (open.value) save()
  open.value = !open.value
}

function save() {
  progress.setNote(props.noteKey, draft.value)
}
</script>

<style scoped>
.note-btn {
  min-height: 38px;
  padding: 6px 12px;
  font-size: 0.85rem;
  color: var(--muted);
}
.note-btn.has { color: var(--accent); border-color: var(--accent); }
/* inside a wrapping flex row, the textarea takes its own full-width line */
.note-area {
  flex-basis: 100%;
  min-height: 56px;
  resize: vertical;
  font-size: 0.95rem;
}
</style>
