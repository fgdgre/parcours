// Asks the browser to mark this origin's storage as persistent, which
// protects localStorage from automatic eviction under storage pressure
// (and from Safari's inactivity cleanup for installed web apps).
export default defineNuxtPlugin(() => {
  navigator.storage?.persist?.().catch(() => {})
})
