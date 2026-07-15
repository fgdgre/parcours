import type { Card, Exercise } from '~/types/content'

const firstSense = (en: string) => en.split(';')[0]!.split(',')[0]!.trim()

const frVariants = (fr: string) => fr.split(' / ').map(v => v.trim())

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function cardMc(card: Card, deck: Card[]): Exercise {
  const wrong = shuffle(deck.filter(c => c.id !== card.id && c.en !== card.en))
    .slice(0, 3)
    .map(c => firstSense(c.en))
  const options = shuffle([firstSense(card.en), ...wrong])
  return {
    type: 'mc',
    prompt: `What does “${card.fr}” mean?`,
    options,
    answer: options.indexOf(firstSense(card.en)),
  }
}

export function cardType(card: Card): Exercise {
  return {
    type: 'type',
    prompt: `Say in French: “${firstSense(card.en)}”`,
    answer: frVariants(card.fr),
    hint: card.ipa,
  }
}

export function cardDictation(card: Card): Exercise | null {
  if (!card.exFr) return null
  return {
    type: 'dictation',
    ttsText: card.exFr,
    answer: [card.exFr],
  }
}

/** Generated open writing prompts: compose sentences from your own learned words. */
export function writingPrompts(cards: Card[], count: number): Exercise[] {
  const out: Exercise[] = []
  const pool = shuffle(cards.filter(c => !c.fr.includes(' ') || c.fr.split(' ').length <= 3))
  for (let i = 0; i < count && pool.length >= 3; i++) {
    const picks = pool.splice(0, 3)
    out.push({
      type: 'open',
      prompt: `Write 2–3 French sentences that use all of these: ${picks.map(c => `“${c.fr}”`).join(', ')}.`,
      minWords: 12,
      hint: picks.map(c => `${c.fr} = ${c.en.split(';')[0]}`).join(' · '),
    })
  }
  return out
}

export type DrillKind = 'mixed' | 'mc' | 'type' | 'dictation' | 'writing'

/** Builds auto-generated drills from cards — every card yields an MC, a translation and (if it has an example) a dictation. */
export function buildDrills(cards: Card[], deck: Card[], kind: DrillKind, count: number): Exercise[] {
  if (kind === 'writing') return writingPrompts(cards, count)
  const picked = shuffle(cards)
  const out: Exercise[] = []
  for (const card of picked) {
    if (out.length >= count) break
    if (kind === 'mc') out.push(cardMc(card, deck))
    else if (kind === 'type') out.push(cardType(card))
    else if (kind === 'dictation') {
      const d = cardDictation(card)
      if (d) out.push(d)
    } else {
      const roll = Math.random()
      if (roll < 0.34) out.push(cardMc(card, deck))
      else if (roll < 0.67) out.push(cardType(card))
      else out.push(cardDictation(card) ?? cardMc(card, deck))
    }
  }
  return out
}
