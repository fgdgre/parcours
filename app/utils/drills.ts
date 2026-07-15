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

export type DrillKind = 'mixed' | 'mc' | 'type' | 'dictation'

/** Builds auto-generated drills from cards — every card yields an MC, a translation and (if it has an example) a dictation. */
export function buildDrills(cards: Card[], deck: Card[], kind: DrillKind, count: number): Exercise[] {
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
