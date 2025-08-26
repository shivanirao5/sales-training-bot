"use client"

import { useState, useCallback, useRef } from "react"

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    // Stop any currently playing audio first
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }
    }

    setIsSpeaking(true)
    setError(null)

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      // Store references for cleanup
      currentAudioRef.current = audio
      currentAudioUrlRef.current = audioUrl

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        currentAudioUrlRef.current = null
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setError("Failed to play audio")
        URL.revokeObjectURL(audioUrl)
        currentAudioRef.current = null
        currentAudioUrlRef.current = null
      }

      await audio.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSpeaking(false)
      currentAudioRef.current = null
      currentAudioUrlRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }
      currentAudioRef.current = null
      currentAudioUrlRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    error,
  }
}
