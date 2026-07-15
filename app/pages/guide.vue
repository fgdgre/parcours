<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
    <h1>How to run this program</h1>
    <p class="muted small">Everything here works from your phone only. No paper, no computer, no other apps required.</p>

    <div class="card stack">
      <h2>🗓 A normal day (~20 min)</h2>
      <p>Open <strong>Today</strong> and do the items in order — that's the whole system. If cards are due, do them first (5 min). Extra time or motivation? Daily sentences, then the optional Challenges at the end of your chapter.</p>
      <p class="muted small">Missed a day? Just continue. Never "catch up" with double sessions — consistency beats intensity.</p>
    </div>

    <div class="card stack">
      <h2>▶ Language Transfer tracks</h2>
      <p><strong>The one rule:</strong> when the teacher asks the student a question, PAUSE and answer OUT LOUD before the student does. This is the entire method — you're building sentences, not listening to a podcast.</p>
      <p class="muted small">In public and can't speak? Answer fully in your head or whisper — but re-run 2–3 minutes of the track aloud later at home. Audio-only works fine with the screen off.</p>
    </div>

    <div class="card stack">
      <h2>👄 Pronunciation lessons (Dylane)</h2>
      <p>Repeat every sound after her, out loud, exaggerated — your mouth muscles are learning, not your eyes. One 5-minute video a day.</p>
      <p class="muted small">Silent mode: mouth the shapes without voice (this genuinely works), redo aloud when you can.</p>
    </div>

    <div class="card stack">
      <h2>📺 Stories & input videos (Alice, one-word input, street French)</h2>
      <p>Just watch and follow. Do NOT pause, translate, or take notes. Understanding 60–70% from drawings and context is exactly the exercise — confusion is the feeling of acquisition.</p>
    </div>

    <div class="card stack">
      <h2>🃏 Cards (SRS)</h2>
      <p>Tap to reveal, then grade <em>honestly</em>: <strong>Again</strong> = didn't know · <strong>Hard</strong> = barely · <strong>Good</strong> = knew with effort · <strong>Easy</strong> = instant. Honest grading is what makes the algorithm work.</p>
      <p class="muted small">Reviews are the highest-value 5 minutes of the day. Do them even on days you skip everything else.</p>
    </div>

    <div class="card stack">
      <h2>✏️ Practice, dictation, speaking</h2>
      <p><strong>Practice:</strong> start with the word bank; switch to keyboard when it feels easy — typing is harder and teaches spelling. <strong>Dictation:</strong> play up to 3 times before typing. <strong>Speaking:</strong> any quiet corner, phone near your mouth; the app checks whether a French speech engine understands you. In public? Skip guilt-free and reopen the lesson later — everything is repeatable.</p>
    </div>

    <div class="card stack">
      <h2>🏆 Challenges (optional)</h2>
      <p>Reading and translation-sprint sets at the end of each chapter — fully silent, made for the metro, queues, and nights when you can't talk or listen. They never block chapter progress.</p>
    </div>

    <div class="card stack">
      <h2>🎓 Final exams</h2>
      <p>Every chapter ends with an exam: <strong>12 questions sampled fresh from the whole chapter</strong> (grammar + vocabulary), pass mark 80%. Lessons after the exam stay locked until you pass. Failing is part of the design — review, retake, and the questions will be different. Your best score is kept.</p>
    </div>

    <div class="card stack">
      <h2>🎲 The Practice tab</h2>
      <p>Unlimited extra drills built from the words you've learned: meaning quizzes, translations, dictations, or a mix. Every run is freshly generated, so it never repeats — this is your "I want more practice today" button. Also perfect for silent sessions.</p>
      <p class="muted small">Tap 🔊 anywhere in exercises to hear the French — every answer can be listened to.</p>
    </div>

    <div class="card stack">
      <h2>📖 Chapters 6–7: the grammar book, without paper</h2>
      <p>These chapters track <em>Grammaire progressive du français (débutant)</em>. You do NOT need the paper book: buy the <strong>e-book / digital edition</strong> (CLE International's version includes a web app with self-correcting exercises — usable in your phone browser). Do a unit there, then tick it here.</p>
      <p class="muted small">If the digital book route doesn't suit you when you get there (~week 11), tell Claude — those units can be replaced with in-app exercise sets like the other chapters.</p>
    </div>

    <div class="card stack">
      <h2>🌐 RFI & TV5Monde lessons</h2>
      <p>These open in your phone browser. Pick ONE exercise set at A1 level, finish it there, come back and mark the lesson done. They exist because their radio/TV style is literally the format of the TCF listening exam.</p>
    </div>

    <div class="card stack">
      <h2>🏁 Checkpoints</h2>
      <p>Tick a statement only if it's honestly true — this gate protects you, nobody else sees it. The final one (M3) is the real decision point from your master plan: continue to B2, or switch strategy. Decide on a good day.</p>
    </div>

    <div class="card stack">
      <h2>💾 Your data</h2>
      <p>Progress lives only in this browser. Once a week: <strong>Progress → Export backup</strong>. That file restores everything on any device.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/progress')
}
</script>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background: none;
  border: 0;
  padding: 4px 8px 4px 0;
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:active { opacity: 0.6; }
.back-btn svg { width: 18px; height: 18px; }
h2 { font-size: 1.02rem; }
</style>
