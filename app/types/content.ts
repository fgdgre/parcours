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
  optional?: boolean
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
  /** extra practice: excluded from Today sessions and chapter progress */
  optional?: boolean
}

export interface CheckpointLesson {
  id: string
  type: 'checkpoint'
  title: string
  canDoStatements: string[]
  durationMin: number
}

export interface ExamLesson {
  id: string
  type: 'exam'
  title: string
  durationMin: number
  /** minimum score (0-100) to pass; lessons after an unpassed exam are locked */
  passPercent: number
  /** how many questions to sample from the chapter pool per attempt */
  questions: number
}

export type Lesson = ExternalLesson | VocabLesson | ExerciseLesson | CheckpointLesson | ExamLesson

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
  exFr2?: string
  exEn2?: string
  tags: string[]
}

export type Exercise =
  | { type: 'mc'; prompt: string; options: string[]; answer: number; explain?: string; passage?: string }
  | { type: 'type'; prompt: string; answer: string[]; hint?: string; passage?: string }
  | { type: 'conjugate'; verb: string; pronoun: string; tense: string; answer: string[] }
  | { type: 'dictation'; ttsText: string; answer: string[] }
  | { type: 'speak'; target: string; en: string }
  | { type: 'open'; prompt: string; minWords?: number; hint?: string }

// --- Three-path architecture (Oral / Grammar annexes to the Main spine) ---

export interface PassiveItem {
  fr: string
  en: string
}

export interface PassiveSet {
  id: string
  topic: string
  items: PassiveItem[]
}

export interface StoryQuestion {
  q: string
  en: string
  options: string[]
  answer: number
}

export interface OralStory {
  id: string
  topic: string
  rate: number
  story: string[]
  /** new-word glosses shown on screen, never spoken */
  gloss?: string
  questions: StoryQuestion[]
}

export interface OralDay {
  day: number
  kind: 'passive' | 'story' | 'rla' | 'dictation-check'
  refs: string[]
  /** overrides the story's own rate (natural-speed repeat days) */
  rate?: number
  note?: string
}

export interface GrammarLesson {
  id: string
  day: number
  topic: string
  rule: string
  examples: PassiveItem[]
  practice: { prompt: string; answer: string[]; hint?: string }[]
  review?: boolean
}

export interface SpeakingBrief {
  id: string
  theme: string
  level: string
  targetStructures: string[]
  usefulPhrases: PassiveItem[]
  copyBlock: string
}

/** Read → Listen (text hidden) → Answer → Reveal — the ear does the test, the eyes only prime it. */
export interface RlaLesson {
  id: string
  topic: string
  rate: number
  naturalRate?: number
  story: string[]
  glossary: PassiveItem[]
  questions: StoryQuestion[]
}
