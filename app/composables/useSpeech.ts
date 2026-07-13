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
      error.value = e?.error === 'not-allowed'
        ? 'Microphone access was denied.'
        : `Recognition error: ${e?.error ?? 'unknown'}`
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

  return { supported, listening, error, start, stop }
}
