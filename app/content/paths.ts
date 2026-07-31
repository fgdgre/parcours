import type { GrammarLesson, OralDay, OralStory, PassiveSet, SpeakingBrief } from '~/types/content'
import briefsJson from './paths/briefs.json'
import grammarJson from './paths/grammar.json'
import ladderJson from './paths/oral-ladder.json'
import passiveJson from './paths/passive.json'
import storiesJson from './paths/stories.json'

export const passiveSets = passiveJson as PassiveSet[]
export const passiveById: Record<string, PassiveSet> = Object.fromEntries(passiveSets.map(s => [s.id, s]))

export const oralStories = storiesJson as OralStory[]
export const storyById: Record<string, OralStory> = Object.fromEntries(oralStories.map(s => [s.id, s]))

export const oralLadder = ladderJson as OralDay[]
export const grammarLadder = grammarJson as GrammarLesson[]
export const speakingBriefs = briefsJson as SpeakingBrief[]

export const oralDayKey = (day: number) => `oral-day-${day}`
export const grammarDayKey = (day: number) => `gram-day-${day}`

export function oralDayTitle(d: OralDay): string {
  if (d.kind === 'dictation-check') return 'Weekly dictation check'
  if (d.kind === 'story') {
    const s = storyById[d.refs[0] ?? '']
    return `Histoire · ${s?.topic ?? ''}${d.rate && d.rate >= 1 ? ' (natural speed)' : ''}`
  }
  return d.refs.map(r => passiveById[r]?.topic ?? r).join(' + ')
}

export function oralDayMinutes(d: OralDay): number {
  if (d.kind === 'passive') return 10
  if (d.kind === 'story') return 6
  return 8
}
