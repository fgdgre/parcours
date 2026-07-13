<template>
  <div class="page stack">
    <h1>Cards</h1>

    <template v-if="sessionCards.length > 0">
      <CardReview
        :key="sessionKey"
        :cards="sessionCards"
        @graded="(id, g) => progress.reviewCard(id, g)"
        @finished="onFinished"
      />
    </template>

    <div v-else class="card stack">
      <h2>Nothing due</h2>
      <p class="muted">
        {{ progress.wordsSeen === 0
          ? 'New words are introduced in vocab lessons on the Path.'
          : 'Come back later — spaced repetition decides when each word returns.' }}
      </p>
      <NuxtLink to="/path" class="btn btn-block">Go to Path</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card } from '~/types/content'
import { cardsById } from '~/content'

const progress = useProgress()

const sessionKey = ref(0)
const sessionCards = ref<Card[]>([])

function buildSession() {
  sessionCards.value = progress.dueIds
    .map(id => cardsById[id])
    .filter((c): c is Card => c !== undefined)
  sessionKey.value += 1
}

onMounted(buildSession)

function onFinished() {
  sessionCards.value = []
}
</script>
