interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

export function useSpeech() {
  const supported = ref(false)
  const listening = ref(false)
  const error = ref<string | null>(null)
  /** Recognition exists but doesn't actually work (e.g. Chrome/Firefox on iOS,
   * where Apple only lets Safari use the speech engine). */
  const failed = ref(false)
  let recognition: SpeechRecognitionLike | null = null

  onMounted(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    supported.value = true
    recognition = new SR() as SpeechRecognitionLike
    recognition.lang = 'fr-FR'
    recognition.interimResults = false
    recognition.maxAlternatives = 3
  })

  onUnmounted(() => {
    recognition?.abort()
  })

  function start(onResult: (transcript: string) => void) {
    if (!recognition || listening.value) return
    error.value = null
    listening.value = true
    recognition.onresult = (e: any) => {
      const transcript: string = e.results?.[0]?.[0]?.transcript ?? ''
      onResult(transcript)
    }
    recognition.onerror = (e: any) => {
      const code = e?.error ?? 'unknown'
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(code)) {
        // Recognition is effectively unusable in this browser — fall back.
        failed.value = true
      }
      error.value = code === 'not-allowed' || code === 'service-not-allowed'
        ? 'Speech recognition is blocked in this browser.'
        : `Recognition error: ${code}`
      listening.value = false
    }
    recognition.onend = () => {
      listening.value = false
    }
    try {
      recognition.start()
    } catch {
      listening.value = false
    }
  }

  function stop() {
    recognition?.stop()
  }

  return { supported, listening, error, failed, start, stop }
}
