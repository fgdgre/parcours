<template>
  <div class="page stack">
    <template v-if="!lesson">
      <h1>Lesson not found</h1>
      <NuxtLink to="/path" class="btn">Back to Path</NuxtLink>
    </template>

    <template v-else>
      <header>
        <p class="muted small">{{ chapter?.title }}</p>
        <h1>{{ lesson.title }}</h1>
      </header>

      <!-- External resource lesson -->
      <template v-if="lesson.type === 'external'">
        <div class="card stack">
          <p><span class="chip">You'll learn</span></p>
          <p>{{ lesson.teaches }}</p>
          <p class="muted small">{{ lesson.instructions }}</p>
        </div>
        <EmbedFrame :lesson="lesson" />
        <button
          class="btn btn-block"
          :class="{ 'btn-primary': !done }"
          @click="toggleDone"
        >
          {{ done ? '✓ Done — tap to undo' : 'Mark as done' }}
        </button>
      </template>

      <!-- Vocab lesson -->
      <template v-else-if="lesson.type === 'vocab'">
        <template v-if="phase === 'learn'">
          <CardIntro
            :cards="cardsToLearn"
            @introduced="progress.introduceCard($event)"
            @finished="phase = 'review'"
          />
        </template>
        <template v-else-if="phase === 'review' && cardsToReview.length > 0">
          <CardReview
            :cards="cardsToReview"
            @graded="(id, g) => progress.reviewCard(id, g)"
            @finished="finishVocab"
          />
        </template>
        <div v-else class="card stack">
          <p>{{ done ? 'This batch is learned. Reviews now appear in the Cards tab as they come due.' : 'All words here are already introduced.' }}</p>
          <button v-if="!done" class="btn btn-primary btn-block" @click="progress.markDone(lesson.id)">
            Mark as done
          </button>
        </div>
      </template>

      <!-- Exercise lesson -->
      <template v-else-if="lesson.type === 'exercises'">
        <template v-if="exercises.length === 0">
          <div class="card">
            <p class="muted">These exercises arrive in the next content update. Skip ahead — the rest of the path is ready.</p>
          </div>
          <button class="btn btn-block" @click="toggleDone">{{ done ? '✓ Done — tap to undo' : 'Mark as done' }}</button>
        </template>
        <template v-else-if="!finished && !done">
          <ExerciseRunner :exercises="exercises" @finished="finishExercises" />
        </template>
        <div v-else class="card stack">
          <p class="okline">✓ Exercises complete.</p>
          <button class="btn btn-block" @click="restartExercises">Practice again</button>
        </div>
      </template>

      <!-- Checkpoint -->
      <template v-else>
        <div class="card stack">
          <p class="muted small">Check each statement only if it's honestly true. This is your gate — nobody else's.</p>
          <label v-for="(s, i) in lesson.canDoStatements" :key="i" class="row check-row">
            <input v-model="checks[i]" type="checkbox">
            <span>{{ s }}</span>
          </label>
        </div>
        <button
          class="btn btn-block"
          :class="{ 'btn-primary': allChecked && !done }"
          :disabled="!allChecked && !done"
          @click="toggleDone"
        >
          {{ done ? '✓ Passed — tap to undo' : 'Confirm checkpoint' }}
        </button>
      </template>

      <NuxtLink v-if="done && next" :to="`/lesson/${next.id}`" class="btn btn-primary btn-block">
        Next: {{ next.title }} →
      </NuxtLink>
      <NuxtLink v-if="done && !next" to="/" class="btn btn-block">Back to Today</NuxtLink>
    </template>
  </div>
</template>

<script setup lang="ts">
import { cardsById, chapterOf, exercisesByFile, lessonById, nextLessonAfter } from '~/content'

const route = useRoute()
const progress = useProgress()

const lesson = computed(() => lessonById[route.params.id as string])
const chapter = computed(() => (lesson.value ? chapterOf(lesson.value.id) : undefined))
const done = computed(() => (lesson.value ? progress.isDone(lesson.value.id) : false))
const next = computed(() => (lesson.value ? nextLessonAfter(lesson.value.id) : undefined))

function toggleDone() {
  if (!lesson.value) return
  if (done.value) progress.unmarkDone(lesson.value.id)
  else progress.markDone(lesson.value.id)
}

// --- vocab ---
const lessonCards = computed(() =>
  lesson.value?.type === 'vocab'
    ? lesson.value.cardIds.map(id => cardsById[id]).filter(c => c !== undefined)
    : [],
)
const cardsToLearn = computed(() => lessonCards.value.filter(c => !progress.isIntroduced(c.id)))
const cardsToReview = computed(() => lessonCards.value)
const phase = ref<'learn' | 'review'>('learn')
watch(lesson, () => { phase.value = cardsToLearn.value.length > 0 ? 'learn' : 'review' }, { immediate: true })

function finishVocab() {
  if (lesson.value && !done.value) progress.markDone(lesson.value.id)
  phase.value = 'review'
}

// --- exercises ---
const exercises = computed(() =>
  lesson.value?.type === 'exercises' ? exercisesByFile[lesson.value.exerciseFile] ?? [] : [],
)
const finished = ref(false)
function finishExercises() {
  finished.value = true
  if (lesson.value) progress.markDone(lesson.value.id)
}
function restartExercises() {
  if (lesson.value) progress.unmarkDone(lesson.value.id)
  finished.value = false
}

// --- checkpoint ---
const checks = ref<boolean[]>([])
watch(lesson, (l) => {
  checks.value = l?.type === 'checkpoint' ? l.canDoStatements.map(() => false) : []
}, { immediate: true })
const allChecked = computed(() => checks.value.length > 0 && checks.value.every(Boolean))
</script>

<style scoped>
.check-row { align-items: flex-start; padding: 6px 0; }
.check-row input { width: 20px; height: 20px; margin-top: 3px; accent-color: var(--accent); }
.okline { color: var(--ok); font-weight: 600; }
</style>
