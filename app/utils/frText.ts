/** Heuristics for finding speakable French inside mixed EN/FR exercise text. */

// deliberately excludes English homographs (a, as, on, son, ton, comment,
// pour, y…) — a false "French" hit feeds English to the fr-FR voice, which
// is worse than a missed tap. Real French fragments containing those words
// almost always carry another, unambiguous token (il A, ON va → il/va).
const FR_TOKENS = new Set([
  'le', 'les', 'un', 'une', 'des', 'du', 'au', 'aux', 'à',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'est', 'suis', 'sont', 'sommes', 'êtes', 'ai', 'avons', 'avez', 'ont',
  'va', 'vais', 'vas', 'allons', 'allez', 'vont',
  'veux', 'veut', 'voulons', 'voulez', 'veulent', 'voudrais',
  'peux', 'peut', 'pouvons', 'pouvez', 'peuvent',
  'ne', 'pas', 'que', 'qui', 'quoi', 'quand', 'pourquoi', 'combien', 'où',
  'ça', 'cette', 'mes', 'tes', 'ses',
  'oui', 'et', 'mais', 'avec', 'moi', 'toi', 'lui',
  'très', 'aussi', 'ici', 'là', 'merci', 'bonjour', 'bonsoir', 'salut', 'madame', 'monsieur',
])

/** True when a text fragment looks French enough to hand to the fr-FR voice. */
export function isLikelyFrench(text: string): boolean {
  if (/[àâçéèêëîïôùûüœ]/i.test(text)) return true
  if (/\b(c'|j'|n'|l'|d'|qu'|s'|m')/i.test(text)) return true
  const tokens = text.toLowerCase().split(/[^a-zà-ÿ']+/).filter(Boolean)
  return tokens.some(t => FR_TOKENS.has(t))
}

export interface TextPart {
  text: string
  /** French quoted fragment — tappable, spoken without the quotes */
  speak?: string
}

/** Splits text on “…” / «…» quotes; quoted French fragments become speakable parts. */
export function speakableParts(text: string): TextPart[] {
  const parts: TextPart[] = []
  const re = /[“«]([^”»]+)[”»]/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push({ text: text.slice(last, m.index) })
    const inner = m[1]!.trim()
    parts.push(isLikelyFrench(inner) ? { text: m[0]!, speak: inner } : { text: m[0]! })
    last = m.index! + m[0]!.length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}

/** The French worth hearing for a prompt+answer pair: quoted French in the
 * prompt wins (it's the thing being asked about); otherwise the answer if
 * it's French; otherwise nothing (never feed English to the fr-FR voice). */
export function hearableFrench(prompt: string, answer: string): string | null {
  const quoted = speakableParts(prompt).filter(p => p.speak).map(p => p.speak!)
  if (quoted.length > 0) return quoted.join(', ')
  return isLikelyFrench(answer) ? answer : null
}
