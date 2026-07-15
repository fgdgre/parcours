import type { Card, Chapter, Exercise, ExerciseLesson, Lesson, VocabLesson } from '~/types/content'
import curriculumJson from './curriculum.json'

export const curriculum = curriculumJson as Chapter[]

const vocabModules = import.meta.glob('./vocab/*.json', { eager: true }) as
  Record<string, { default: Card[] }>

export const cardsById: Record<string, Card> = {}
for (const mod of Object.values(vocabModules)) {
  for (const card of mod.default) cardsById[card.id] = card
}

const exerciseModules = import.meta.glob('./exercises/*.json', { eager: true }) as
  Record<string, { default: Exercise[] }>

export const exercisesByFile: Record<string, Exercise[]> = {}
for (const [path, mod] of Object.entries(exerciseModules)) {
  const name = path.split('/').pop()!.replace('.json', '')
  exercisesByFile[name] = mod.default
}

export const allLessons: Lesson[] = curriculum.flatMap(c => c.lessons)

export const lessonById: Record<string, Lesson> = Object.fromEntries(
  allLessons.map(l => [l.id, l]),
)

export const isOptional = (l: Lesson): boolean => l.type === 'exercises' && !!l.optional

/** All auto-gradable exercise items authored for a chapter — the exam sampling pool. */
export function chapterExercisePool(ch: Chapter): Exercise[] {
  return ch.lessons
    .filter((l): l is ExerciseLesson => l.type === 'exercises')
    .flatMap(l => exercisesByFile[l.exerciseFile] ?? [])
    .filter(e => e.type !== 'speak' && e.type !== 'open')
}

/** The chapter's open writing prompts — one gets appended to every exam attempt. */
export function chapterOpenPool(ch: Chapter): Exercise[] {
  return ch.lessons
    .filter((l): l is ExerciseLesson => l.type === 'exercises')
    .flatMap(l => exercisesByFile[l.exerciseFile] ?? [])
    .filter(e => e.type === 'open')
}

/** All flashcards introduced by a chapter's vocab lessons. */
export function chapterCards(ch: Chapter): Card[] {
  return ch.lessons
    .filter((l): l is VocabLesson => l.type === 'vocab')
    .flatMap(l => l.cardIds)
    .map(id => cardsById[id])
    .filter((c): c is Card => c !== undefined)
}

export function chapterOf(lessonId: string): Chapter | undefined {
  return curriculum.find(c => c.lessons.some(l => l.id === lessonId))
}

export function lessonIndex(lessonId: string): number {
  return allLessons.findIndex(l => l.id === lessonId)
}

export function nextLessonAfter(lessonId: string): Lesson | undefined {
  const i = lessonIndex(lessonId)
  return i >= 0 ? allLessons[i + 1] : undefined
}
