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

const FAILED_KEY = 'parcours.asrFailed'

/** Errors that mean the speech service is unusable in this browser, full stop. */
const FATAL_CODES = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported']

export function useSpeech() {
  const supported = ref(false)
  const listening = ref(false)
  const error = ref<string | null>(null)
  /**
   * Recognition exists but doesn't actually work here. On iPhone that's
   * every browser except a real Safari tab — Apple blocks the speech engine
   * in Chrome/Firefox AND inside installed home-screen apps. Once detected,
   * we remember it for this device so the user lands on the recorder
   * directly instead of hitting the beep-then-error loop every time.
   */
  const failed = ref(false)
  let recognition: SpeechRecognitionLike | null = null
  let errorStreak = 0

  function markFailed() {
    failed.value = true
    try {
      localStorage.setItem(FAILED_KEY, '1')
    } catch { /* private mode — session-only memory is fine */ }
  }

  /** User wants to try recognition again (e.g. after switching browsers). */
  function retryRecognition() {
    failed.value = false
    errorStreak = 0
    error.value = null
    try {
      localStorage.removeItem(FAILED_KEY)
    } catch { /* ignore */ }
  }

  onMounted(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    supported.value = true
    failed.value = localStorage.getItem(FAILED_KEY) === '1'
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
      errorStreak = 0
      const transcript: string = e.results?.[0]?.[0]?.transcript ?? ''
      onResult(transcript)
    }
    recognition.onerror = (e: any) => {
      const code = e?.error ?? 'unknown'
      if (FATAL_CODES.includes(code)) {
        markFailed()
      } else if (code !== 'no-speech') {
        // 'network', 'aborted', unknown codes: two strikes and we fall back
        errorStreak += 1
        if (errorStreak >= 2) markFailed()
      }
      error.value = code === 'no-speech'
        ? "Didn't catch anything — try again, closer to the microphone."
        : 'Speech recognition is blocked. iPhone: turn ON Settings → General → Keyboard → Enable Dictation, then use a Safari tab. Or just record yourself below.'
      listening.value = false
    }
    recognition.onend = () => {
      listening.value = false
    }
    try {
      recognition.start()
    } catch {
      listening.value = false
      markFailed()
    }
  }

  function stop() {
    recognition?.stop()
  }

  return { supported, listening, error, failed, start, stop, markFailed, retryRecognition }
}
