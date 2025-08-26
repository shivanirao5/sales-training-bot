"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mic, MicOff, Volume2, Bot } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { ScenarioInfo } from "@/components/scenario-info"
import { SALES_SCENARIOS, type ScenarioType } from "@/lib/ai-prompts"

interface TrainingSessionProps {
  scenario: string
  userId: string
}

export function TrainingSession({ scenario, userId }: TrainingSessionProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

  // Ref to track if session destroy has been called
  const destroyCalled = useRef(false)

  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition()
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech()

  const scenarioData = SALES_SCENARIOS[scenario as ScenarioType]

  // Destroy session when user exits the chat (navigates away or closes tab)
  useEffect(() => {
    const destroySession = async () => {
      if (destroyCalled.current) return
      destroyCalled.current = true
      try {
        await fetch("/api/destroy-session", { method: "POST" })
      } catch (e) {
        // Ignore errors
      }
    }

    // On browser/tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      destroySession()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    // On route change (navigate away)
    const handleRouteChange = () => {
      destroySession()
    }
    // next/navigation router does not expose events, so we use popstate for browser navigation
    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handleRouteChange)
      destroySession()
    }
  }, [])

  const getInitialMessage = (scenario: string) => {
    switch (scenario) {
      case "cold_calling":
        return "Hello? This is quite unexpected. I'm actually in the middle of something important right now. What is this regarding?"
      case "demo_pitch":
        return "Thank you for setting up this demo. I'm interested to see what you have to show us. Our team is always looking for solutions that can help us scale more efficiently."
      case "upsell":
        return "Hi there! Good to hear from you. We've been quite happy with the current service you're providing. What's this about?"
      default:
        return "Hello! Let's begin your sales training session."
    }
  }

  // Initialize conversation with trainer greeting
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage = { role: "assistant" as const, content: getInitialMessage(scenario) }
      setMessages([initialMessage])
      // Auto-speak the initial message
      speak(getInitialMessage(scenario))
    }
  }, [scenario, messages.length, speak])

  // Handle transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      handleUserMessage(transcript)
      resetTranscript()
    }
  }, [transcript, isListening, resetTranscript])

  const handleUserMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return

    setIsProcessing(true)
    const newMessages = [...messages, { role: "user" as const, content: userMessage }]
    setMessages(newMessages)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          scenario,
          userId,
        }),
      })

      if (!response.ok) throw new Error("Failed to get trainer response")

      const data = await response.json()
      const trainerMessage = { role: "assistant" as const, content: data.message }

      setMessages((prev) => [...prev, trainerMessage])
      speak(data.message)
    } catch (error) {
      console.error("Error getting trainer response:", error)
      const errorMessage = {
        role: "assistant" as const,
        content: "I'm sorry, I'm having trouble responding right now. Could you repeat what you said?",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      if (isSpeaking) {
        stopSpeaking()
      }
      startListening()
    }
  }

  const handleEndSession = async () => {
    if (messages.length < 2) {
      alert("Please have a conversation before ending the session.")
      return
    }

    setIsGeneratingFeedback(true)

    try {
      console.log("[v0] Calling feedback API with:", { messagesCount: messages.length, scenario, userId })

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          scenario,
          userId,
          conversationId,
        }),
      })

      console.log("[v0] Feedback API response status:", response.status)
      console.log("[v0] Feedback API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Feedback API error response:", errorText)
        throw new Error(`Failed to generate feedback: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("[v0] Non-JSON response from feedback API:", responseText)
        throw new Error("Feedback API returned non-JSON response")
      }

      const data = await response.json()
      console.log("[v0] Feedback data received:", data)

      router.push(`/feedback/${scenario}`)
    } catch (error) {
      console.error("[v0] Error generating feedback:", error)
      alert(`Failed to generate feedback: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Speech Recognition Not Supported</h3>
            <p className="text-gray-600">
              Your browser doesn't support speech recognition. Please use a modern browser like Chrome or Edge.
            </p>
            <Button className="mt-4" onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">{scenarioData?.title || "Sales Training"}</h1>
            {isSpeaking && (
              <div className="flex items-center gap-2 text-purple-600">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Trainer Speaking...</span>
              </div>
            )}
          </div>
         
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <ScenarioInfo scenario={scenario as ScenarioType} />

        {/* Conversation Display */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <p className="text-sm">Trainer is thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Interface */}
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-end mb-4">
              <Button
                onClick={handleEndSession}
                disabled={isGeneratingFeedback || messages.length < 2}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingFeedback ? "Generating Feedback..." : "Get Feedback"}
              </Button>
            </div>
            <div className="mb-8">
              <div
                className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-200 relative ${
                  isListening
                    ? "bg-gradient-to-br from-red-400 to-red-600 animate-pulse"
                    : isSpeaking
                      ? "bg-gradient-to-br from-green-400 to-green-600 animate-pulse"
                      : "bg-gradient-to-br from-purple-400 to-purple-600"
                }`}
              >
                {/* Chatbot icon in background */}
                <Bot className="absolute w-8 h-8 text-white/30" />
                
                {/* Main icon */}
                {isListening ? (
                  <MicOff className="w-12 h-12 text-white relative z-10" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white relative z-10" />
                ) : (
                  <Mic className="w-12 h-12 text-white relative z-10" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isListening ? "Listening..." : isSpeaking ? "Trainer Speaking..." : "Ready to Continue"}
              </h3>
              <p className="text-gray-600">
                {isListening
                  ? "Speak naturally and practice your sales conversation"
                  : isSpeaking
                    ? "Sales trainer is responding to your message"
                    : "Click the microphone to respond"}
              </p>
              {transcript && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>You said:</strong> {transcript}
                  </p>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className={`rounded-full px-8 py-4 ${
                isListening
                  ? "bg-red-600 hover:bg-red-700"
                  : isSpeaking
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-purple-600 hover:bg-purple-700"
              }`}
              onClick={handleMicClick}
              disabled={isProcessing || isGeneratingFeedback}
            >
              {isListening ? "Stop Listening" : isSpeaking ? "Stop Trainer" : "Start Speaking"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
