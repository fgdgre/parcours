import type { Card } from '~/types/content'

export interface GenSentence {
  type: 'type'
  prompt: string
  answer: string[]
}

// Deterministic RNG so "today's sentences" are stable for the whole day.
function seedFrom(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(rnd: () => number, arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!

const verbEn = (en: string) => en.split(',')[0]!.replace(/^to /, '').trim()
const nounEn = (en: string) => en.split(';')[0]!.split(',')[0]!.replace(/^the /, '').trim()

export interface GenOptions {
  /** unlocked by ex-lt-17-18: il faut + infinitive */
  ilFaut?: boolean
  /** unlocked by ex-lt-21-22: le/la object pronouns */
  objectPronouns?: boolean
  /** unlocked by ex-lt-25-26: passé composé with avoir (-er verbs) */
  pastTense?: boolean
}

// EN past forms for the past-tense template (only these verbs qualify)
const EN_PAST: Record<string, string> = {
  manger: 'ate',
  parler: 'spoke',
  travailler: 'worked',
  regarder: 'watched',
  écouter: 'listened',
  acheter: 'bought',
  trouver: 'found',
  donner: 'gave',
}

/**
 * Generates translation sentences (EN prompt → FR answer) by combining
 * ONLY drilled patterns with words the learner has seen. Advanced patterns
 * unlock via GenOptions as the matching exercises are completed.
 * Deterministic per seed; grammar is guaranteed by construction, so every
 * template is deliberately narrow.
 */
export function dailySentences(learned: Card[], seed: string, count = 5, opts: GenOptions = {}): GenSentence[] {
  const rnd = mulberry32(seedFrom(seed))

  const infinitives = learned.filter(c =>
    c.tags.includes('verbs') && /^[a-zà-ÿ]+$/i.test(c.fr) && c.en.startsWith('to '),
  )
  // nouns with a known gender and a consonant start (avoids elision edge cases)
  const nouns = learned.filter(c => /^(le|la) [a-zà-ÿ]/i.test(c.fr))
  const timeWords = learned.filter(c => ['maintenant', 'demain', "aujourd'hui"].includes(c.fr))

  const templates: (() => GenSentence | null)[] = [
    // Fallback that works from day 1: translate a learned card's example sentence.
    () => {
      const withExamples = learned.filter(c => c.exFr && c.exEn)
      if (withExamples.length === 0) return null
      const c = pick(rnd, withExamples)
      return {
        type: 'type',
        prompt: `Translate: “${c.exEn}”`,
        answer: [c.exFr!],
      }
    },
    () => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      const t = timeWords.length > 0 && rnd() > 0.4 ? pick(rnd, timeWords) : null
      const frTail = t ? ` ${t.fr}` : ''
      const enTail = t ? ` ${t.en.split(',')[0]}` : ''
      return {
        type: 'type',
        prompt: `Translate: “I want to ${verbEn(v.en)}${enTail}.”`,
        answer: [`je veux ${v.fr}${frTail}`],
      }
    },
    () => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      const t = timeWords.length > 0 ? pick(rnd, timeWords) : null
      const frTail = t ? ` ${t.fr}` : ''
      const enTail = t ? ` ${t.en.split(',')[0]}` : ''
      return {
        type: 'type',
        prompt: `Translate: “I'm going to ${verbEn(v.en)}${enTail}.”`,
        answer: [`je vais ${v.fr}${frTail}`],
      }
    },
    () => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      return {
        type: 'type',
        prompt: `Translate: “I don't want to ${verbEn(v.en)}.”`,
        answer: [`je ne veux pas ${v.fr}`, `je veux pas ${v.fr}`],
      }
    },
    () => {
      if (nouns.length === 0) return null
      const n = pick(rnd, nouns)
      return {
        type: 'type',
        prompt: `Translate: “I like ${nounEn(n.en)}.” (likes need le/la)`,
        answer: [`j'aime ${n.fr}`],
      }
    },
    () => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      return {
        type: 'type',
        prompt: `Ask (informal): “Do you want to ${verbEn(v.en)} with me?”`,
        answer: [`tu veux ${v.fr} avec moi`, `est-ce que tu veux ${v.fr} avec moi`],
      }
    },
    () => {
      if (nouns.length === 0) return null
      const n = pick(rnd, nouns)
      const bare = n.fr.replace(/^(le|la) /i, '')
      return {
        type: 'type',
        prompt: `Translate: “There is no ${nounEn(n.en)}.” (pas de …)`,
        answer: [`il n'y a pas de ${bare}`],
      }
    },
  ]

  if (opts.ilFaut) {
    templates.push(() => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      return {
        type: 'type',
        prompt: `Translate: “We have to ${verbEn(v.en)}.” (il faut …)`,
        answer: [`il faut ${v.fr}`, `on doit ${v.fr}`, `nous devons ${v.fr}`],
      }
    })
  }

  if (opts.objectPronouns) {
    templates.push(() => {
      if (nouns.length === 0) return null
      const n = pick(rnd, nouns)
      const pronoun = n.fr.startsWith('le ') ? 'le' : 'la'
      return {
        type: 'type',
        prompt: `“${n.fr}” — translate: “I want it.”`,
        answer: [`je ${pronoun} veux`],
      }
    })
    templates.push(() => {
      if (infinitives.length === 0) return null
      const v = pick(rnd, infinitives)
      return {
        type: 'type',
        prompt: `Translate: “I'm going to ${verbEn(v.en)} it.” (masculine thing)`,
        answer: [`je vais le ${v.fr}`],
      }
    })
  }

  if (opts.pastTense) {
    const pastVerbs = infinitives.filter(v => EN_PAST[v.fr] && v.fr.endsWith('er'))
    templates.push(() => {
      if (pastVerbs.length === 0) return null
      const v = pick(rnd, pastVerbs)
      const participle = `${v.fr.slice(0, -2)}é`
      const hier = learned.some(c => c.fr === 'hier')
      return {
        type: 'type',
        prompt: `Translate: “I ${EN_PAST[v.fr]}${hier ? ' yesterday' : ''}.”`,
        answer: [`j'ai ${participle}${hier ? ' hier' : ''}`],
      }
    })
    templates.push(() => {
      if (pastVerbs.length === 0) return null
      const v = pick(rnd, pastVerbs)
      const participle = `${v.fr.slice(0, -2)}é`
      return {
        type: 'type',
        prompt: `Translate: “I didn't ${verbEn(v.en)}.” (past)`,
        answer: [`je n'ai pas ${participle}`, `j'ai pas ${participle}`],
      }
    })
  }

  const out: GenSentence[] = []
  const seen = new Set<string>()
  let guard = 0
  while (out.length < count && guard < 60) {
    guard += 1
    const s = pick(rnd, templates)()
    if (!s || seen.has(s.answer[0]!)) continue
    seen.add(s.answer[0]!)
    out.push(s)
  }
  return out
}
