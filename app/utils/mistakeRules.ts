import type { MistakeEntry } from '~/utils/retries'

export interface RuleLink {
  title: string
  url: string
}

const RULES: { test: RegExp; title: string; url: string }[] = [
  { test: /accents?:|spell/i, title: 'Accents — what é, è, ê, ç change', url: 'https://www.lawlessfrench.com/pronunciation/accents/' },
  { test: /dictation|writing what you hear/i, title: 'French spelling & accents guide', url: 'https://www.lawlessfrench.com/pronunciation/accents/' },
  { test: /est-ce que|yes\/no question|intonation/i, title: 'Asking questions in French', url: 'https://www.lawlessfrench.com/grammar/questions/' },
  { test: /going to|near future|aller \+/i, title: 'Futur proche — aller + infinitive', url: 'https://www.lawlessfrench.com/grammar/futur-proche/' },
  { test: /want to|infinitive|veux (parler|manger|venir|fermer)/i, title: 'Two verbs together — dual-verb constructions', url: 'https://www.lawlessfrench.com/grammar/dual-verb-constructions/' },
  { test: /n[e']?.*pas|don'?t|not |no /i, title: 'Negation & “pas de”', url: 'https://www.lawlessfrench.com/grammar/negation/' },
  { test: /\b(une?|le|la) (question|porte|décision|situation|fenêtre|voiture)|feminine|masculine|gender/i, title: 'Noun gender — un/une, le/la, endings', url: 'https://www.lawlessfrench.com/grammar/gender/' },
  { test: /le\/la\/les|pronoun|l'ai|je le |je la |je les /i, title: 'Direct object pronouns (le, la, les)', url: 'https://www.lawlessfrench.com/grammar/direct-objects/' },
  { test: /passé|past|j'ai (fait|vu|pris|mangé)|participle/i, title: 'Passé composé', url: 'https://www.lawlessfrench.com/grammar/passe-compose/' },
  { test: /il faut|must|have to|devoir/i, title: 'Il faut & devoir — obligation', url: 'https://www.lawlessfrench.com/grammar/il-faut/' },
]

/** Best-guess grammar reference for a mistake; conjugation gets a per-verb link. */
export function ruleFor(m: MistakeEntry): RuleLink | undefined {
  const conj = m.q.match(/Conjugate (\S+)/i)
  if (conj) {
    const verb = conj[1]!.toLowerCase().replace(/[^a-zà-ÿ]/g, '')
    return {
      title: `Conjugation table: ${verb}`,
      url: `https://conjugator.reverso.net/conjugation-french-verb-${encodeURIComponent(verb)}.html`,
    }
  }
  const haystack = `${m.q} ${m.a}`
  return RULES.find(r => r.test.test(haystack))
}
