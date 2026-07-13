# Parcours

Personal French A0→B2 learning app: the complete verified program (Language Transfer, Dylane's pronunciation course, comprehensible input, frequency vocabulary, Grammaire progressive) as an ordered path with a daily session screen, SRS flashcards, and native exercises — multiple choice, translation with a Duolingo-style word bank (or keyboard, toggleable), conjugation, TTS dictation, and speaking checks via the browser's speech recognizer.

**Daily sentences** (`/daily`, appears on Today once ≥15 words are learned): five fresh translation sentences per day, generated deterministically from a date seed by combining only drilled sentence patterns with words from your own SRS deck — no runtime AI, grammar correct by construction (`app/utils/sentenceGen.ts`).

No backend, no accounts, no gamification. Progress lives in `localStorage` with export/import backup. End goal: TCF Canada, NCLC 7 (B2) in all four skills.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (grading + SRS logic)
npm run validate   # structural check of all course content
```

## Deploy to Netlify

**Option A — Netlify Drop (fastest):**

```bash
npm run generate
```

Then drag the **`.output/public`** folder onto https://app.netlify.com/drop. Done.

**Option B — connect the git repo:** build command `npm run generate`, publish directory `.output/public`.

Redeploys never touch your progress (it's in the browser, not the site).

## Install on your phone

Open the deployed URL → browser menu → **Add to Home Screen**. It opens standalone like a native app. Speaking exercises need Chrome (Android) or Safari (iPhone) — both ship a French speech recognizer; elsewhere the app falls back to record-and-compare.

## Backup discipline

Progress → **Export backup** once a week. It downloads a small JSON file; **Import backup** restores it on any device.

## Content model (how to grow the course)

The app is a generic player; every lesson is data:

- `app/content/curriculum.json` — chapters → lessons. Lesson types: `external` (embedded video/audio/link), `vocab` (flashcard batch), `exercises` (points at a file below), `checkpoint` (honest self-check gate).
- `app/content/vocab/*.json` — flashcards (`id`, `fr`, `en`, `ipa`, `exFr`, `exEn`, `tags`). Card ids are permanent — never rename them.
- `app/content/exercises/*.json` — exercise arrays (`mc`, `type`, `conjugate`, `dictation`, `speak`).

Adding a chapter or deepening one = adding JSON + running `npm run validate`. No code changes, and existing progress is never affected because lesson/card ids are stable.

**Current state (v1):** all 7 chapters present (187 lessons — every Language Transfer track, all 55 pronunciation lessons, story listening, Grammaire progressive units, RFI/TV5Monde). Chapter 1 has full depth (150 cards + 6 exercise sets). Chapters 2+ get their exercise sets in the next content iterations.

## Docs

- Design spec: `docs/superpowers/specs/2026-07-13-parcours-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-13-parcours-v1.md`
