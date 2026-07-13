const PREFERRED_VOICES = ['Amélie', 'Thomas', 'Audrey', 'Google français', 'Marie']

export function useTts() {
  const supported = ref(false)
  const voice = shallowRef<SpeechSynthesisVoice | null>(null)

  function pickVoice() {
    const voices = speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('fr'))
    if (voices.length === 0) return
    const preferred = PREFERRED_VOICES
      .map(name => voices.find(v => v.name.includes(name)))
      .find(Boolean)
    voice.value = preferred ?? voices[0] ?? null
  }

  onMounted(() => {
    supported.value = typeof window !== 'undefined' && 'speechSynthesis' in window
    if (!supported.value) return
    pickVoice()
    speechSynthesis.addEventListener('voiceschanged', pickVoice)
  })

  onUnmounted(() => {
    if (supported.value) speechSynthesis.removeEventListener('voiceschanged', pickVoice)
  })

  function speak(text: string, rate = 1) {
    if (!supported.value) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'
    if (voice.value) u.voice = voice.value
    u.rate = rate
    speechSynthesis.speak(u)
  }

  return { supported, speak }
}
