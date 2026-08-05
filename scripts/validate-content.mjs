// Structural validation of course content. Run: npm run validate
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const contentDir = join(root, 'app/content')
const errors = []
const warn = []

const curriculum = JSON.parse(readFileSync(join(contentDir, 'curriculum.json'), 'utf8'))

const cards = {}
for (const f of readdirSync(join(contentDir, 'vocab')).filter(f => f.endsWith('.json'))) {
  for (const c of JSON.parse(readFileSync(join(contentDir, 'vocab', f), 'utf8'))) {
    if (cards[c.id]) errors.push(`duplicate card id ${c.id} (${f})`)
    for (const k of ['id', 'fr', 'en']) if (!c[k]) errors.push(`card in ${f} missing "${k}": ${JSON.stringify(c).slice(0, 60)}`)
    cards[c.id] = c
  }
}

const exerciseFiles = {}
for (const f of readdirSync(join(contentDir, 'exercises')).filter(f => f.endsWith('.json'))) {
  const name = f.replace('.json', '')
  const list = JSON.parse(readFileSync(join(contentDir, 'exercises', f), 'utf8'))
  exerciseFiles[name] = list
  list.forEach((ex, i) => {
    const at = `${name}[${i}]`
    switch (ex.type) {
      case 'mc':
        if (!Array.isArray(ex.options) || ex.options.length < 2) errors.push(`${at}: mc needs ≥2 options`)
        if (!Number.isInteger(ex.answer) || ex.answer < 0 || ex.answer >= ex.options.length) errors.push(`${at}: mc answer index out of range`)
        if (!ex.prompt) errors.push(`${at}: missing prompt`)
        break
      case 'type':
        if (!ex.prompt) errors.push(`${at}: missing prompt`)
        if (!Array.isArray(ex.answer) || ex.answer.length === 0) errors.push(`${at}: type needs answer variants`)
        break
      case 'conjugate':
        for (const k of ['verb', 'pronoun', 'tense']) if (!ex[k]) errors.push(`${at}: conjugate missing "${k}"`)
        if (!Array.isArray(ex.answer) || ex.answer.length === 0) errors.push(`${at}: conjugate needs answer variants`)
        break
      case 'dictation':
        if (!ex.ttsText) errors.push(`${at}: dictation missing ttsText`)
        if (!Array.isArray(ex.answer)) errors.push(`${at}: dictation needs answer array`)
        break
      case 'speak':
        if (!ex.target || !ex.en) errors.push(`${at}: speak needs target and en`)
        break
      case 'open':
        if (!ex.prompt) errors.push(`${at}: open needs a prompt`)
        if (ex.minWords !== undefined && (!Number.isInteger(ex.minWords) || ex.minWords < 1)) errors.push(`${at}: open minWords invalid`)
        break
      default:
        errors.push(`${at}: unknown type "${ex.type}"`)
    }
  })
}

const lessonIds = new Set()
for (const ch of curriculum) {
  if (!ch.id || !ch.title || !Array.isArray(ch.lessons)) errors.push(`chapter ${ch.id ?? '?'} malformed`)
  for (const l of ch.lessons) {
    if (lessonIds.has(l.id)) errors.push(`duplicate lesson id ${l.id}`)
    lessonIds.add(l.id)
    if (typeof l.durationMin !== 'number') errors.push(`${l.id}: missing durationMin`)
    switch (l.type) {
      case 'external':
        if (!l.url) errors.push(`${l.id}: external missing url`)
        if (l.provider === 'youtube' && !l.embedId) errors.push(`${l.id}: youtube lesson missing embedId`)
        if (!l.instructions || !l.teaches) warn.push(`${l.id}: missing instructions/teaches`)
        break
      case 'vocab':
        for (const cid of l.cardIds) if (!cards[cid]) errors.push(`${l.id}: unknown card ${cid}`)
        break
      case 'exercises':
        if (!exerciseFiles[l.exerciseFile]) warn.push(`${l.id}: exercise file "${l.exerciseFile}" not present yet (placeholder ok)`)
        break
      case 'checkpoint':
        if (!Array.isArray(l.canDoStatements) || l.canDoStatements.length === 0) errors.push(`${l.id}: checkpoint needs canDoStatements`)
        break
      case 'exam':
        if (!Number.isInteger(l.passPercent) || l.passPercent < 1 || l.passPercent > 100) errors.push(`${l.id}: exam passPercent must be 1-100`)
        if (!Number.isInteger(l.questions) || l.questions < 1) errors.push(`${l.id}: exam needs questions count`)
        break
      default:
        errors.push(`${l.id}: unknown lesson type "${l.type}"`)
    }
  }
}

// order guarantees: ids must match titles, and sequences must ascend across the path
const flat = curriculum.flatMap(c => c.lessons)
for (const l of flat) {
  let m
  if ((m = l.id.match(/^lt-(\d+)$/)) && !l.title.endsWith(`Track ${Number(m[1])}`)) {
    errors.push(`${l.id}: title does not match track number: "${l.title}"`)
  }
  if ((m = l.id.match(/^dylane-(\d+)$/)) && Number(m[1]) <= 55 && !l.title.startsWith(`Pronunciation ${Number(m[1])}/55`)) {
    errors.push(`${l.id}: title does not match lesson number: "${l.title}"`)
  }
}
for (const prefix of ['lt', 'dylane']) {
  const seq = flat.filter(l => new RegExp(`^${prefix}-\\d+$`).test(l.id)).map(l => Number(l.id.split('-')[1]))
  if (seq.some((n, i) => i > 0 && n <= seq[i - 1])) errors.push(`${prefix} lessons are out of order in the path`)
}

const orphans = Object.keys(cards).filter(id =>
  !curriculum.some(ch => ch.lessons.some(l => l.type === 'vocab' && l.cardIds.includes(id))),
)
if (orphans.length) warn.push(`${orphans.length} cards not referenced by any vocab lesson: ${orphans.slice(0, 5).join(', ')}…`)

// --- three-path content (oral ladder, stories, grammar, briefs) ---
const pathsDir = join(contentDir, 'paths')
const passive = JSON.parse(readFileSync(join(pathsDir, 'passive.json'), 'utf8'))
const stories = JSON.parse(readFileSync(join(pathsDir, 'stories.json'), 'utf8'))
const ladder = JSON.parse(readFileSync(join(pathsDir, 'oral-ladder.json'), 'utf8'))
const grammar = JSON.parse(readFileSync(join(pathsDir, 'grammar.json'), 'utf8'))
const briefs = JSON.parse(readFileSync(join(pathsDir, 'briefs.json'), 'utf8'))

const rla = JSON.parse(readFileSync(join(pathsDir, 'rla.json'), 'utf8'))
const passiveIds = new Set(passive.map(x => x.id))
const storyIds = new Set(stories.map(x => x.id))
const rlaIds = new Set(rla.map(x => x.id))
for (const l of rla) {
  if (!l.story?.length) errors.push(`rla ${l.id} has no sentences`)
  for (const g of l.glossary ?? []) if (!g.fr || !g.en) errors.push(`rla ${l.id} glossary item missing fr/en`)
  for (const q of l.questions ?? []) {
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`rla ${l.id} question needs 2+ options`)
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length ?? 0))
      errors.push(`rla ${l.id} question answer index out of range`)
  }
}
for (const set of passive) {
  if (!set.items?.length) errors.push(`passive set ${set.id} has no items`)
  for (const it of set.items ?? []) if (!it.fr || !it.en) errors.push(`passive ${set.id} item missing fr/en`)
}
for (const st of stories) {
  if (!st.story?.length) errors.push(`story ${st.id} has no sentences`)
  for (const q of st.questions ?? []) {
    if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`story ${st.id} question needs 2+ options`)
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options?.length ?? 0))
      errors.push(`story ${st.id} question answer index out of range`)
  }
}
ladder.forEach((d, i) => {
  if (d.day !== i + 1) errors.push(`oral ladder day ${d.day} out of sequence at index ${i}`)
  const pool = d.kind === 'story' ? storyIds : d.kind === 'rla' ? rlaIds : passiveIds
  if (d.kind !== 'dictation-check') {
    if (!d.refs?.length) errors.push(`oral day ${d.day} has no refs`)
    for (const r of d.refs ?? []) if (!pool.has(r)) errors.push(`oral day ${d.day} unknown ref ${r}`)
  }
})
grammar.forEach((g, i) => {
  if (g.day !== i + 1) errors.push(`grammar day ${g.day} out of sequence at index ${i}`)
  if (!g.rule) errors.push(`grammar ${g.id} missing rule`)
  if (!g.practice?.length) errors.push(`grammar ${g.id} has no practice items`)
  for (const pr of g.practice ?? [])
    if (!pr.prompt || !Array.isArray(pr.answer) || pr.answer.length === 0 || pr.answer.some(a => !a))
      errors.push(`grammar ${g.id} bad practice item: ${JSON.stringify(pr).slice(0, 60)}`)
})
for (const b of briefs) if (!b.copyBlock || !b.theme) errors.push(`brief ${b.id} missing theme/copyBlock`)

console.log(`chapters: ${curriculum.length}, lessons: ${lessonIds.size}, cards: ${Object.keys(cards).length}, exercise files: ${Object.keys(exerciseFiles).length}`)
for (const w of warn) console.log(`WARN  ${w}`)
for (const e of errors) console.log(`ERROR ${e}`)


if (errors.length) process.exit(1)
console.log('content OK')
