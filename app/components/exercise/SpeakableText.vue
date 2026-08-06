<template>
  <h2 class="prompt">
    <template v-for="(part, i) in parts" :key="i">
      <button
        v-if="part.speak"
        type="button"
        class="fr-tap"
        :aria-label="`Hear: ${part.speak}`"
        @pointerdown.prevent
        @click="tts.speak(part.speak!, progress.settings.ttsRate)"
      >{{ part.text }}<span class="mini" aria-hidden="true">🔊</span></button>
      <span v-else>{{ part.text }}</span>
    </template>
  </h2>
</template>

<script setup lang="ts">
import { speakableParts } from '~/utils/frText'

const props = defineProps<{ text: string }>()

const progress = useProgress()
const tts = useTts()

const parts = computed(() => speakableParts(props.text))
</script>

<style scoped>
.prompt { margin: 0; }
.fr-tap {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  border-bottom: 2px dotted var(--accent);
  -webkit-tap-highlight-color: transparent;
}
.fr-tap:active { opacity: 0.6; }
.mini { font-size: 0.65em; margin-left: 3px; vertical-align: super; }
</style>
