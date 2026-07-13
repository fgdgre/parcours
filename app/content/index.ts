import type { Card, Chapter, Exercise, Lesson } from '~/types/content'
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
