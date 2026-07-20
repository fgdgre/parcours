/**
 * Builds the clipboard payload for the "Copy to check" button on open writing
 * tasks: a tutor briefing + the task + the learner's answer, ready to paste
 * into any AI chat for correction. This keeps AI feedback in the loop without
 * embedding any API key in a public static site.
 */
export function buildReviewPrompt(task: string, answer: string): string {
  return `You are a friendly, precise French tutor. I am an absolute beginner (A0–A1), \
native Ukrainian speaker with B2 English, learning French for Canadian immigration (target: TCF Canada, B2 eventually). \
My current grammar: present tense, near future (aller + infinitive), basic passé composé (avoir/être), \
ne…pas, object pronouns (le/la/les/me/te), il faut / devoir, venir de + infinitive. \
Please review my writing below:
1. List each mistake with a one-line explanation in simple English (grammar, spelling incl. accents, word choice).
2. Show the fully corrected version.
3. Rewrite it once more the way a native would casually say it — staying within my grammar level.
4. Give me ONE short tip to improve, and ONE follow-up question in simple French for me to answer, so we can keep practicing in this chat.
5. Finally, rate my answer STRICTLY and honestly — do not inflate to be nice; I track these numbers to find my weak sides, so flattery hurts me. Judge against what a solid A1 learner should produce: grammar accuracy, spelling/accents, and naturalness. End with exactly two lines in this format so I can record them in my app:
RATING: NN/100
NOTE: <one short line naming my main weakness in this answer>

THE TASK: ${task}

MY ANSWER:
${answer}`
}

/**
 * "Explain this to me" — packs one exercise into a prompt that teaches the
 * rule behind the answer instead of just showing it.
 */
export function buildExplainPrompt(question: string, correct: string, mine?: string): string {
  return `You are a friendly, precise French tutor. I am an absolute beginner (A0–A1), \
native Ukrainian speaker with B2 English. I just did this exercise in my learning app and I want to \
UNDERSTAND it, not memorize it.

THE EXERCISE: ${question}
CORRECT ANSWER: ${correct}${mine ? `\nMY ANSWER WAS: ${mine}` : ''}

Please:
1. Explain the rule or pattern behind the correct answer in simple English (2-4 sentences). If it's a verb form, show the pattern for je/tu/il so I see the system, not one form.
2. ${mine ? 'Tell me exactly what my answer got wrong and why a French speaker would notice.' : 'Point out the most common mistake beginners make here.'}
3. Give 3 more short examples using the same rule (French + English).
4. Ask me ONE new question that tests the same rule — then wait for my answer and correct it.`
}

/**
 * "Continue with AI" — packs a just-finished lesson into a prompt that keeps
 * teaching exactly that topic, at the learner's level, one question at a time.
 */
export function buildContinuePrompt(opts: {
  lessonTitle: string
  topic?: string
  items?: { q: string; a: string }[]
  missed?: { q: string; a: string }[]
}): string {
  const items = (opts.items ?? []).slice(0, 12)
    .map((x, i) => `${i + 1}. ${x.q} → ${x.a}`).join('\n')
  const missed = (opts.missed ?? [])
    .map(x => `- ${x.q} → ${x.a}`).join('\n')
  return `You are a friendly, precise French tutor. I am an absolute beginner (A0–A1), \
native Ukrainian speaker with B2 English, learning French for Canadian immigration. \
I just finished a lesson in my app and I want to KEEP practicing exactly this topic — it felt \
important and I'm not solid on it yet.

THE LESSON: ${opts.lessonTitle}${opts.topic ? `\nWHAT IT COVERED: ${opts.topic}` : ''}${items ? `\n\nITS QUESTIONS AND ANSWERS:\n${items}` : ''}${missed ? `\n\nTHE ONES I GOT WRONG:\n${missed}` : ''}

Please:
1. Briefly explain the core idea of this topic in simple English (3-5 sentences), especially anything my wrong answers reveal I misunderstood.
2. Then drill me: ask me ONE new question at a time on exactly this topic, wait for my answer, correct it kindly but precisely, and slowly increase difficulty. Stay within beginner grammar. Keep going until I say stop.`
}

/** Packs the recent mistake log into a tutor prompt for pattern analysis + a mini-drill. */
export function buildMistakesPrompt(mistakes: { q: string; a: string }[]): string {
  const list = mistakes
    .map((m, i) => `${i + 1}. Question: ${m.q}\n   Correct answer: ${m.a}`)
    .join('\n')
  return `You are a friendly, precise French tutor. I am an absolute beginner (A0–A1), \
native Ukrainian speaker with B2 English, learning French for Canadian immigration. \
Below are exercise questions I recently got WRONG in my learning app, with the correct answers. Please:
1. Group them into 2–3 underlying error patterns (what am I systematically confusing?).
2. Explain each pattern in one short paragraph of simple English.
3. Give me a mini-drill: 5 new questions targeting exactly these patterns, one at a time — wait for my answer before the next one.

MY RECENT MISTAKES:
${list}`
}

/**
 * Packs the learner's full progress picture into a deep-review prompt:
 * honest level assessment, weak-side analysis, adaptive recommendations for
 * the rest of the program, and — if warranted — a spec for an extra focus
 * chapter that the app's developer-assistant can implement as content.
 */
export function buildProgressReviewPrompt(payload: object): string {
  return `You are a strict, experienced French teacher and learning coach. I am an absolute beginner \
(A0–A1), native Ukrainian speaker with B2 English, learning French for Canadian immigration \
(long-term target: TCF Canada, B2 in all four skills). I study with a self-built app that follows \
Language Transfer (40 tracks), a 55-lesson pronunciation course, comprehensible input, SRS vocabulary \
(350 words), exercises, chapter exams, and daily writing/speaking workouts.

Below is my COMPLETE progress data exported from the app. Analyze it honestly — do not flatter me; \
inflated praise costs me real immigration points later. Please give me:

1. HONEST LEVEL ASSESSMENT — where am I really, in CEFR terms, based on scores, writing samples and pace.
2. WEAK SIDES — my top 3 weaknesses, each backed by specific evidence from the data (skill percentages, repeated mistake patterns, hardest words, writing errors in my saved texts).
3. WHAT'S WORKING — 1-2 things I should keep doing exactly as is.
4. ADAPTIVE PLAN — concrete adjustments for the REST of the program: what to repeat before moving on, what to drill daily for the next 2 weeks, whether my pace (time per day, days active) matches my 15-18-month exam goal.
5. FOCUS CHAPTER SPEC (only if the data justifies it) — a specification for one extra remedial chapter targeting my weak sides, in this exact format so my developer-assistant can build it into the app: title, 8-12 lessons, each lesson = { type: quiz/practice/dictation/speaking/writing, topic, 8-10 example items in French }.
6. ONE QUESTION in simple French for me to answer right now, so we start practicing immediately.

MY PROGRESS DATA (JSON):
${JSON.stringify(payload, null, 1)}`
}
