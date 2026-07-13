export interface NormalizeOptions {
  stripAccents?: boolean
}

export function normalizeFr(s: string, opts: NormalizeOptions = {}): string {
  let out = s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘ʼ]/g, "'")
    .replace(/[.!?,;:…]+\s*$/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (opts.stripAccents) {
    out = out.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
    // œ/æ ligatures survive NFD stripping but learners type oe/ae
    out = out.replace(/œ/g, 'oe').replace(/æ/g, 'ae')
  }
  return out
}

export interface MatchOptions {
  strictAccents?: boolean
}

export function matchAnswer(input: string, accepted: string[], opts: MatchOptions = {}): boolean {
  const strip = !opts.strictAccents
  const normalized = normalizeFr(input, { stripAccents: strip })
  return accepted.some(a => normalizeFr(a, { stripAccents: strip }) === normalized)
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = cur
  }
  return prev[n]!
}

export interface DiffWord {
  word: string
  status: 'ok' | 'near' | 'miss'
}

/**
 * Word-level comparison of a spoken target against an ASR transcript.
 * Position-tolerant: each target word looks for its best match in a
 * small window around its own position in the heard sequence.
 */
export function wordDiff(target: string, heard: string): DiffWord[] {
  const targetWords = normalizeFr(target, { stripAccents: true }).split(' ').filter(Boolean)
  const heardWords = normalizeFr(heard, { stripAccents: true }).split(' ').filter(Boolean)

  return targetWords.map((word, i) => {
    const windowStart = Math.max(0, i - 2)
    const candidates = heardWords.slice(windowStart, i + 3)
    if (candidates.length === 0) return { word, status: 'miss' as const }
    const best = Math.min(...candidates.map(c => levenshtein(word, c)))
    const nearThreshold = Math.max(1, Math.floor(word.length / 3))
    if (best === 0) return { word, status: 'ok' as const }
    if (best <= nearThreshold) return { word, status: 'near' as const }
    return { word, status: 'miss' as const }
  })
}
