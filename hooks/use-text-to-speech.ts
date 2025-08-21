"use client"

import { useState, useCallback } from "react"

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

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

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = () => {
        setIsSpeaking(false)
        setError("Failed to play audio")
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    setIsSpeaking(false)
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    error,
  }
}
