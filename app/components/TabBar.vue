<template>
  <nav class="tabbar">
    <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="tab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <template v-if="item.icon === 'today'">
          <circle cx="12" cy="12" r="9" />
          <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
        </template>
        <template v-else-if="item.icon === 'path'">
          <path d="M5 19c5 0 4-7 7-7s2 7 7 7" />
          <circle cx="5" cy="19" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="7" r="2.2" />
        </template>
        <template v-else-if="item.icon === 'practice'">
          <path d="M12 20l8-8-4-4-8 8z" />
          <path d="M15 7l2 2" />
          <path d="M4 20l4-1-3-3z" fill="currentColor" stroke="none" />
        </template>
        <template v-else-if="item.icon === 'cards'">
          <rect x="4" y="7" width="13" height="13" rx="2.5" />
          <path d="M8 4h10a2.5 2.5 0 0 1 2.5 2.5V16" />
        </template>
        <template v-else>
          <path d="M5 20V13" />
          <path d="M12 20V6" />
          <path d="M19 20v-9" />
        </template>
      </svg>
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const items = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/path', label: 'Path', icon: 'path' },
  { to: '/practice', label: 'Practice', icon: 'practice' },
  { to: '/cards', label: 'Cards', icon: 'cards' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
]
</script>

<style scoped>
.tabbar {
  position: fixed;
  inset: auto 0 0 0;
  display: flex;
  background: var(--card);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 20;
}
.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0 6px;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 600;
  -webkit-tap-highlight-color: transparent;
}
.tab svg { width: 24px; height: 24px; }
.tab.router-link-active { color: var(--accent); }
</style>
