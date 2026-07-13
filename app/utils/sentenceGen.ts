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

/**
 * Generates translation sentences (EN prompt → FR answer) by combining
 * ONLY patterns drilled in chapters 1–2 with words the learner has seen.
 * Deterministic per seed; grammar is guaranteed by construction, so every
 * template is deliberately narrow.
 */
export function dailySentences(learned: Card[], seed: string, count = 5): GenSentence[] {
  const rnd = mulberry32(seedFrom(seed))

  const infinitives = learned.filter(c =>
    c.tags.includes('verbs') && /^[a-zà-ÿ]+$/i.test(c.fr) && c.en.startsWith('to '),
  )
  // nouns with a known gender and a consonant start (avoids elision edge cases)
  const nouns = learned.filter(c => /^(le|la) [a-zà-ÿ]/i.test(c.fr))
  const timeWords = learned.filter(c => ['maintenant', 'demain', "aujourd'hui"].includes(c.fr))

  const templates: (() => GenSentence | null)[] = [
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
