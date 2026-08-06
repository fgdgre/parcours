<template>
  <div class="page stack">
    <button class="back-btn" aria-label="Go back" @click="goBack">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
    <h1>📋 Cheat sheets</h1>
    <p class="muted small">
      Quick reference — pull up fast, repeat over time. Tap any French to hear it.
      Cover a column and test yourself: recall beats recognition.
    </p>

    <section v-for="sheet in sheets" :key="sheet.id" class="card stack sheet">
      <h2>{{ sheet.title }}</h2>

      <div v-if="sheet.rows" class="table-wrap">
        <table>
          <thead v-if="sheet.headers">
            <tr><th v-for="(h, i) in sheet.headers" :key="i">{{ h }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in sheet.rows" :key="ri">
              <td v-for="(cell, ci) in row" :key="ci">
                <button
                  v-if="isLikelyFrench(cell)"
                  class="fr-cell"
                  @click="tts.speak(cell, progress.settings.ttsRate)"
                >{{ cell }}</button>
                <template v-else>{{ cell }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul v-if="sheet.items" class="list">
        <li v-for="(it, i) in sheet.items" :key="i" class="small">{{ it }}</li>
      </ul>

      <p v-if="sheet.footer" class="muted small foot">{{ sheet.footer }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import sheetsJson from '~/content/cheatsheets.json'
import { isLikelyFrench } from '~/utils/frText'

interface Sheet {
  id: string
  title: string
  headers?: string[]
  rows?: string[][]
  items?: string[]
  footer?: string
}

const sheets = sheetsJson as Sheet[]
const router = useRouter()
const progress = useProgress()
const tts = useTts()

function goBack() {
  if (window.history.length > 1) router.back()
  else navigateTo('/path')
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
.sheet h2 { margin: 0; font-size: 1.05rem; color: var(--path-grammar-text); }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
th, td { text-align: left; padding: 6px 10px 6px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: 0.8rem; }
tbody tr:last-child td { border-bottom: 0; }
td:first-child { font-weight: 600; }
.fr-cell {
  position: relative;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.fr-cell::after {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: var(--path-grammar);
  opacity: 0.7;
}
.fr-cell:active { opacity: 0.6; }
.list { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
.foot { margin: 0; }
</style>
