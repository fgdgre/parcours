<template>
  <div class="page stack">
    <template v-if="!lesson">
      <h1>Lesson not found</h1>
      <NuxtLink to="/path" class="btn">Back to Path</NuxtLink>
    </template>

    <template v-else>
      <button class="back-btn" aria-label="Go back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </button>
      <header>
        <p class="muted small">{{ chapter?.title }}</p>
        <h1>{{ lesson.title }}</h1>
      </header>

      <!-- Locked behind an exam -->
      <template v-if="locked">
        <div class="card stack">
          <p>🔒 This lesson unlocks after you pass the exam earlier in the path.</p>
          <NuxtLink to="/path" class="btn btn-primary btn-block">Back to Path</NuxtLink>
        </div>
      </template>

      <!-- External resource lesson -->
      <template v-else-if="lesson.type === 'external'">
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

      <!-- Exam -->
      <template v-else-if="lesson.type === 'exam'">
        <div v-if="examState === 'intro'" class="card stack">
          <p>
            <strong>{{ lesson.questions }} questions</strong>, sampled fresh from everything this
            chapter taught — grammar exercises and vocabulary. Pass mark:
            <strong>{{ lesson.passPercent }}%</strong>. No hints, no retries per question.
          </p>
          <p class="muted small">
            Fail it? No problem — review, then retake it with a different set of questions.
            Lessons after this exam unlock when you pass.
          </p>
          <p v-if="bestScore !== undefined" class="muted small">Best score so far: {{ bestScore }}%</p>
          <button class="btn btn-primary btn-block" @click="startExam">
            {{ done ? 'Retake exam' : 'Start exam' }}
          </button>
        </div>
        <ExerciseRunner
          v-else-if="examState === 'running'"
          :key="examAttempt"
          :exercises="examItems"
          @finished="onExamFinished"
        />
        <div v-else class="card stack">
          <p :class="examPassed ? 'okline' : ''" class="score">
            {{ examScore }}% — {{ examPassed ? 'passed ✓' : `below the ${lesson.passPercent}% pass mark` }}
          </p>
          <p class="muted small">
            {{ examPassed
              ? 'The next lessons are unlocked. Onward.'
              : 'Review the chapter exercises, then try again — the questions will be different.' }}
          </p>
          <button class="btn btn-block" :class="{ 'btn-primary': !examPassed }" @click="startExam">
            {{ examPassed ? 'Retake for a better score' : 'Try again' }}
          </button>
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
import type { Exercise } from '~/types/content'
import {
  cardsById, chapterCards, chapterExercisePool, chapterOf, chapterOpenPool,
  exercisesByFile, lessonById, nextLessonAfter,
} from '~/content'
import { buildDrills, shuffle } from '~/utils/drills'

const route = useRoute()
const router = useRouter()
const progress = useProgress()
const { isLocked } = useLocking()
const locked = computed(() => (lesson.value ? isLocked(lesson.value.id) : false))

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/path')
}

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

// --- exam ---
const examState = ref<'intro' | 'running' | 'result'>('intro')
const examAttempt = ref(0)
const examItems = ref<Exercise[]>([])
const examScore = ref(0)
const examPassed = ref(false)
const bestScore = computed(() =>
  lesson.value ? (progress.examScores as Record<string, number>)[lesson.value.id] : undefined,
)

function startExam() {
  if (lesson.value?.type !== 'exam' || !chapter.value) return
  const pool = [
    ...chapterExercisePool(chapter.value),
    ...buildDrills(chapterCards(chapter.value), Object.values(cardsById), 'mixed', 8),
  ]
  const items = shuffle(pool).slice(0, Math.min(lesson.value.questions, pool.length))
  // every exam ends with one open writing task (auto-passed; check it via "Copy to check")
  const openPool = chapterOpenPool(chapter.value)
  if (openPool.length > 0) items.push(shuffle(openPool)[0]!)
  examItems.value = items
  examAttempt.value += 1
  examState.value = 'running'
}

function onExamFinished(score: { correct: number; total: number }) {
  if (lesson.value?.type !== 'exam') return
  const pct = Math.round((score.correct / Math.max(1, score.total)) * 100)
  examScore.value = pct
  examPassed.value = pct >= lesson.value.passPercent
  progress.recordExam(lesson.value.id, pct)
  if (examPassed.value) progress.markDone(lesson.value.id)
  examState.value = 'result'
}

watch(lesson, () => {
  examState.value = 'intro'
})

// --- checkpoint ---
const checks = ref<boolean[]>([])
watch(lesson, (l) => {
  checks.value = l?.type === 'checkpoint' ? l.canDoStatements.map(() => false) : []
}, { immediate: true })
const allChecked = computed(() => checks.value.length > 0 && checks.value.every(Boolean))
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background: none;
  border: 0;
  padding: 4px 8px 4px 0;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active { opacity: 0.6; }
.back-btn svg { width: 18px; height: 18px; }
.check-row { align-items: flex-start; padding: 6px 0; }
.check-row input { width: 20px; height: 20px; margin-top: 3px; accent-color: var(--accent); }
.okline { color: var(--ok); font-weight: 600; }
.score { font-size: 1.3rem; font-weight: 700; }
</style>
