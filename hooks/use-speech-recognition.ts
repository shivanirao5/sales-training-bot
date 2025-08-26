"use client"

import { useState, useEffect, useCallback } from "react"

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = "en-US"

        recognitionInstance.onstart = () => {
          setIsListening(true)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
        }

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript((prev) => prev + finalTranscript)
          }
        }

        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      setTranscript("")
      recognition.start()
    }
  }, [recognition, isListening])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
      recognition.abort() // Force stop to prevent hanging
    }
  }, [recognition, isListening])

  const forceStop = useCallback(() => {
    if (recognition) {
      recognition.abort()
      setIsListening(false)
    }
  }, [recognition])

  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    forceStop,
    resetTranscript,
  }
}
