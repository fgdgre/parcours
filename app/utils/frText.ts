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
  // frequent conjugated forms from the course (English collisions avoided)
  'parle', 'parles', 'parlent', 'aime', 'aimes', 'mange', 'manges',
  'travaille', 'travailles', 'ferme', 'fermes', 'viens', 'vient',
  'prends', 'prend', 'fais', 'fait', 'dis', 'dit', 'sais', 'sait',
  'comprends', 'comprend', 'dors', 'dort',
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

const isFrToken = (t: string) =>
  FR_TOKENS.has(t.toLowerCase()) || /[àâçéèêëîïôùûüœ]/i.test(t) || /^(c'|j'|n'|l'|d'|qu'|s'|m')/i.test(t)

/** Finds unquoted French runs in mixed text. Conservative by design: a run is
 * speakable only if it has ≥2 French tokens in a row, or one carrying an
 * accent/elision — a lone ambiguous word ("possible", "va") stays plain text.
 * Runs only bridge harmless separators (space, slash, comma); anything else
 * (___ blanks, parentheses) splits them, so "je ___ (être" never becomes one tap. */
function unquotedRuns(text: string): TextPart[] {
  const tokens = [...text.matchAll(/[a-zà-ÿœ']+/gi)]
  const parts: TextPart[] = []
  let cursor = 0
  let run: { start: number; end: number; count: number; strong: boolean } | null = null

  const flush = () => {
    if (run && (run.count >= 2 || run.strong)) {
      if (run.start > cursor) parts.push({ text: text.slice(cursor, run.start) })
      const frag = text.slice(run.start, run.end)
      parts.push({ text: frag, speak: frag })
      cursor = run.end
    }
    run = null
  }

  for (const m of tokens) {
    const tok = m[0]!
    const start = m.index!
    if (!isFrToken(tok)) { flush(); continue }
    const strong = /[àâçéèêëîïôùûüœ]/i.test(tok) || /^(c'|j'|n'|l'|d'|qu'|s'|m')/i.test(tok)
    if (run && /^[\s,/·–—-]*$/.test(text.slice(run.end, start))) {
      run.end = start + tok.length
      run.count += 1
      run.strong = run.strong || strong
    } else {
      flush()
      run = { start, end: start + tok.length, count: 1, strong }
    }
  }
  flush()
  if (cursor < text.length) parts.push({ text: text.slice(cursor) })
  return parts
}

/** Splits text on “…” / «…» quotes; quoted French fragments become speakable
 * parts, and unquoted French runs are detected conservatively in between. */
export function speakableParts(text: string): TextPart[] {
  const parts: TextPart[] = []
  const re = /[“«]([^”»]+)[”»]/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push(...unquotedRuns(text.slice(last, m.index)))
    const inner = m[1]!.trim()
    parts.push(isLikelyFrench(inner) ? { text: m[0]!, speak: inner } : { text: m[0]! })
    last = m.index! + m[0]!.length
  }
  if (last < text.length) parts.push(...unquotedRuns(text.slice(last)))
  return parts
}

/** The French worth hearing for a prompt+answer pair: French found in the
 * prompt wins (quoted or detected runs — it's the thing being asked about);
 * otherwise the answer if it's French; otherwise nothing — English is never
 * fed to the fr-FR voice. */
export function hearableFrench(prompt: string, answer: string): string | null {
  const found = speakableParts(prompt).filter(p => p.speak).map(p => p.speak!)
  if (found.length > 0) return found.join(', ')
  return isLikelyFrench(answer) ? answer : null
}
