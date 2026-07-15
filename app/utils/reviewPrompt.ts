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
5. Finally, rate my answer STRICTLY and honestly — do not inflate to be nice; I track these numbers to find my weak sides, so flattery hurts me. Judge against what a solid A1 learner should produce: grammar accuracy, spelling/accents, and naturalness. End with exactly one line in this format so I can record it:
RATING: NN/100

THE TASK: ${task}

MY ANSWER:
${answer}`
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
