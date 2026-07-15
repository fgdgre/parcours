// Counts real study time: 10-second ticks whenever the app tab is visible.
export default defineNuxtPlugin(() => {
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      useProgress().addTime(10)
    }
  }, 10_000)
})
