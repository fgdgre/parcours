<template>
  <button class="btn note-btn" :class="{ has: hasNote }" type="button" @click="toggle">
    {{ hasNote ? '📝 Note ●' : '📝 Note' }}
  </button>
  <div v-if="open" class="note-block stack">
    <div v-if="previous.length > 0" class="history stack">
      <p v-for="(entry, i) in previous" :key="i" class="small prev">{{ entry }}</p>
    </div>
    <textarea
      v-model="draft"
      class="input note-area"
      rows="2"
      :placeholder="previous.length > 0 ? `Add a new note about this ${what}…` : `Your note about this ${what}…`"
      @blur="save"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  noteKey: string
  what?: string
}>(), { what: 'question' })

const progress = useProgress()
const open = ref(false)
const draft = ref('')

const stored = computed(() => (progress.notes as Record<string, string>)[props.noteKey] ?? '')
const hasNote = computed(() => !!stored.value)
// earlier notes stay as read-only history; the box is always for a fresh one
const previous = computed(() => stored.value.split('\n— ').filter(Boolean))

watch(() => props.noteKey, () => {
  open.value = false
  draft.value = ''
}, { immediate: true })

function toggle() {
  if (open.value) save()
  open.value = !open.value
}

function save() {
  const text = draft.value.trim()
  if (!text) return
  progress.setNote(props.noteKey, stored.value ? `${stored.value}\n— ${text}` : text)
  draft.value = ''
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
/* inside a wrapping flex row, the block takes its own full-width line */
.note-block { flex-basis: 100%; gap: 6px; }
.history { gap: 2px; }
.prev { margin: 0; color: var(--muted); border-left: 2px solid var(--border); padding-left: 8px; }
.note-area {
  min-height: 56px;
  resize: vertical;
  font-size: 0.95rem;
}
</style>
