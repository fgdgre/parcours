import { allLessons, lessonIndex } from '~/content'

/**
 * Exams gate the path: every lesson after the first unpassed exam is locked.
 * The exam itself stays accessible.
 */
export function useLocking() {
  const progress = useProgress()

  const lockBoundary = computed(() => {
    const i = allLessons.findIndex(l => l.type === 'exam' && !progress.isDone(l.id))
    return i === -1 ? Number.POSITIVE_INFINITY : i
  })

  const isLocked = (lessonId: string) => lessonIndex(lessonId) > lockBoundary.value

  return { lockBoundary, isLocked }
}
