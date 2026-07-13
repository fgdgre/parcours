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
      default:
        errors.push(`${l.id}: unknown lesson type "${l.type}"`)
    }
  }
}

const orphans = Object.keys(cards).filter(id =>
  !curriculum.some(ch => ch.lessons.some(l => l.type === 'vocab' && l.cardIds.includes(id))),
)
if (orphans.length) warn.push(`${orphans.length} cards not referenced by any vocab lesson: ${orphans.slice(0, 5).join(', ')}…`)

console.log(`chapters: ${curriculum.length}, lessons: ${lessonIds.size}, cards: ${Object.keys(cards).length}, exercise files: ${Object.keys(exerciseFiles).length}`)
for (const w of warn) console.log(`WARN  ${w}`)
for (const e of errors) console.log(`ERROR ${e}`)
if (errors.length) process.exit(1)
console.log('content OK')
