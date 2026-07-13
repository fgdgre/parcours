# Parcours — Design Spec

*2026-07-13. Approved by Dmytro in chat before implementation.*

## What this is

A personal, phone-first French learning app that replaces Duolingo as the daily driver. It wraps a researched, verified A0→A2 program (Language Transfer, Dylane's pronunciation course, comprehensible-input video, frequency vocabulary, Grammaire progressive) into an ordered path with a "what do I do today" screen and natively-authored exercises (flashcards with SRS, multiple choice, type-the-answer, conjugation drills, TTS dictation, speaking checks).

End goal it serves: TCF Canada, NCLC 7 (B2) in all four skills, in ~15–18 months, for Canadian Express Entry (French category).

## Hard requirements (from user)

- **No gamification.** No streaks, XP, points, mascots. Informational progress only.
- **Minimal, clear UX; phone-first.** Desktop works but phone is the primary device.
- **Complete program, not a summary.** Every lesson of every wrapped resource appears as a node in the path (all 40 LT tracks, all 55 Dylane lessons, etc.). External media is **embedded/linked, never copied** (copyright + reliability).
- **Generic content architecture.** Course content is pure data (JSON). New chapters are added as data in later iterations without code changes and without breaking stored progress.
- **v1 depth:** full program skeleton + deep exercise/vocab content for Chapter 1. Later iterations deepen chapters 2+.
- **Flashcards FR→EN only** (Ukrainian hints may be added later if needed).
- **All exercise types in v1**, including audio (TTS) and speaking; text-based ones are the priority if anything must be cut.
- **No backend.** localStorage persistence, export/import backup. Static deploy to Netlify. PWA (Add to Home Screen).
- **Stack: Nuxt 4 + TypeScript** so the user (Vue/Nuxt developer) can maintain and extend it.

## Architecture

- Nuxt 4, `ssr: false` (SPA) + `nuxi generate` → static output for Netlify. No server routes.
- Pinia stores; localStorage persistence with a versioned schema (`schemaVersion` field, migration hook).
- Content lives in `app/content/` as typed JSON, loaded at build time:
  - `curriculum.json` — chapters → lessons (ordered).
  - `vocab/ch-N.json` — flashcards per chapter.
  - `exercises/<lesson-id>.json` — exercise sets keyed by lesson id.
- Progress keys on **stable lesson ids** (`ch1-lt-03`, `ch1-vocab-02`, …). Adding content never mutates existing ids.

### Data model (essentials)

```ts
type Lesson =
  | { id: string; type: 'external'; title: string; provider: 'youtube'|'soundcloud'|'link';
      url: string; embedId?: string; durationMin: number; instructions: string; teaches: string }
  | { id: string; type: 'vocab'; title: string; cardIds: string[]; newCards: number }
  | { id: string; type: 'exercises'; title: string; exerciseFile: string; durationMin: number }
  | { id: string; type: 'checkpoint'; title: string; canDoStatements: string[] }

type Card = { id: string; fr: string; en: string; ipa?: string; exFr?: string; exEn?: string; tags: string[] }

type Exercise =
  | { type: 'mc'; prompt: string; options: string[]; answer: number; explain?: string }
  | { type: 'type'; prompt: string; answer: string[]; hint?: string }       // answer = accepted variants
  | { type: 'conjugate'; verb: string; pronoun: string; tense: 'present'; answer: string[] }
  | { type: 'dictation'; ttsText: string; answer: string[] }                 // TTS reads, user types
  | { type: 'speak'; target: string; en: string }                            // ASR compares
```

- Progress store: `{ schemaVersion, completedLessons: Record<id, isoDate>, srs: Record<cardId, {ease, intervalDays, due, reps, lapses}>, settings }`.
- SRS: SM-2-lite. New cards/day capped (default 10, configurable).

### Grading rules

- Type-the-answer & dictation: normalize (trim, lowercase, collapse spaces, curly→straight apostrophes). Accent-lenient by default (é≡e) with a per-answer "accents matter" flag off in Chapter 1; strictness toggle in Settings. Multiple accepted variants per answer.
- Speaking: Web Speech API `SpeechRecognition` (`lang: 'fr-FR'`), feature-detected. Token-level fuzzy match (per-word Levenshtein after normalization) → per-word green/yellow/red diff + "recognizer heard: …". Framed as *intelligibility*, not phoneme scoring. Fallback where ASR unavailable: MediaRecorder record-and-compare against TTS playback of the target.
- TTS: `speechSynthesis` with best available `fr-FR` voice; used on cards, dictation, and speak targets.

### Screens (4 tabs)

1. **Today** (`/`) — next 2–4 incomplete lessons in path order, total minutes, one tap to run them sequentially in the lesson player.
2. **Path** (`/path`, `/lesson/<id>`) — chapters → lessons, done-marks, durations. Linear by default; nothing locked.
3. **Cards** (`/cards`) — due count + new count, review session player, TTS button per card.
4. **Progress** (`/progress`) — words learned, per-chapter %, total time; export/import backup (JSON file download/upload); settings (new cards/day, accent strictness, TTS voice).

## Curriculum skeleton (v1, complete)

Sources verified July 2026 (research workflow). Chapters ≈ weeks of the user's existing plan (Étape 0 → Étape 1 boundary at the Warsaw move):

- **Ch 1 — Fondations (weeks 1–2):** LT tracks 1–8 ⋅ Dylane lessons 1–10 ⋅ Alice Ayel first stories ⋅ vocab batches 1–5 ⋅ exercises per LT track ⋅ checkpoint.
- **Ch 2 (weeks 3–4):** LT 9–16 ⋅ Dylane 11–20 ⋅ Alice Ayel / FCI A1 ⋅ vocab 6–10.
- **Ch 3 (weeks 5–6):** LT 17–24 ⋅ Dylane 21–30 ⋅ FCI A1 ⋅ vocab 11–15.
- **Ch 4 (weeks 7–8):** LT 25–32 ⋅ Dylane 31–42 ⋅ Super Easy French enters ⋅ vocab 16–20.
- **Ch 5 (weeks 9–10):** LT 33–40 ⋅ Dylane 43–55 ⋅ Super Easy French ⋅ vocab 21–25 ⋅ checkpoint (LT complete).
- **Ch 6 (weeks 11–14):** Grammaire progressive débutant units 1–20 (checklist nodes w/ page refs) ⋅ TV5Monde A1 + RFI débutant sessions ⋅ vocab 26–33.
- **Ch 7 (weeks 15–18+):** GP units 21–40 ⋅ RFI bilingual fiction ⋅ Easy French ⋅ vocab 34–40 ⋅ **Checkpoint M3** (simple everyday dialogue — the go/no-go gate from the master plan).

v1 authors deep content (vocab cards, exercise files) for **Chapter 1** (~150 cards, exercises for every LT track + dictation/speak drills). Chapters 2–7 ship as skeleton nodes (external lessons fully usable — embeds work; vocab/exercise nodes marked "coming in next iteration").

## Content authoring quality gate

Exercise and card French is authored by AI agents and then **verified by independent reviewer agents** (grammar/spelling/naturalness + answer-key correctness + embed-URL liveness) before inclusion. Link rot mitigation: every embed keeps a plain external fallback URL.

## Data safety

localStorage only; versioned schema; export/import JSON backup from Progress tab. Redeploys don't touch data. Worst-case loss without backup: re-tick done lessons; SRS timing resets.

## Out of scope (v1)

Backend/sync across devices, accounts, Ukrainian hints, offline caching of external media, native apps, chapters 2–7 deep content (next iterations), TEF/TCF mock tests (month 9+ concern).

## Deploy

`npm run generate` → `.output/public` (or `dist`) → Netlify Drop, or connect the git repo (build: `npm run generate`, publish dir per Nuxt output). README documents both, with PWA install steps for iPhone/Android.
