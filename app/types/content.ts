export type Provider = 'youtube' | 'soundcloud' | 'link'

export interface ExternalLesson {
  id: string
  type: 'external'
  title: string
  provider: Provider
  url: string
  embedId?: string
  durationMin: number
  instructions: string
  teaches: string
}

export interface VocabLesson {
  id: string
  type: 'vocab'
  title: string
  cardIds: string[]
  newCards: number
  durationMin: number
}

export interface ExerciseLesson {
  id: string
  type: 'exercises'
  title: string
  exerciseFile: string
  durationMin: number
}

export interface CheckpointLesson {
  id: string
  type: 'checkpoint'
  title: string
  canDoStatements: string[]
  durationMin: number
}

export type Lesson = ExternalLesson | VocabLesson | ExerciseLesson | CheckpointLesson

export interface Chapter {
  id: string
  title: string
  subtitle: string
  lessons: Lesson[]
}

export interface Card {
  id: string
  fr: string
  en: string
  ipa?: string
  exFr?: string
  exEn?: string
  tags: string[]
}

export type Exercise =
  | { type: 'mc'; prompt: string; options: string[]; answer: number; explain?: string }
  | { type: 'type'; prompt: string; answer: string[]; hint?: string }
  | { type: 'conjugate'; verb: string; pronoun: string; tense: string; answer: string[] }
  | { type: 'dictation'; ttsText: string; answer: string[] }
  | { type: 'speak'; target: string; en: string }
