"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mic, MicOff, Volume2, Bot, CheckCircle, AlertCircle, Lightbulb, TrendingUp, X } from "lucide-react"
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
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState<any>(null)

  // Ref to track if session destroy has been called
  const destroyCalled = useRef(false)

  const { isListening, transcript, isSupported, startListening, stopListening, forceStop, resetTranscript } =
    useSpeechRecognition()
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech()

  const scenarioData = SALES_SCENARIOS[scenario as ScenarioType]

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    if (score >= 60) return "Needs Work"
    return "Poor"
  }

  // Destroy session when user exits the chat (navigates away or closes tab)
  useEffect(() => {
    const destroySession = async () => {
      if (destroyCalled.current) return
      destroyCalled.current = true
      
      // Force stop all voice activities immediately
      try {
        if (isSpeaking) {
          stopSpeaking()
        }
        if (isListening) {
          forceStop() // Use forceStop instead of stopListening for immediate effect
        }
      } catch (e) {
        console.error("Error stopping voice activities:", e)
      }
      
      try {
        await fetch("/api/destroy-session", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId, 
            sessionId: conversationId,
            timestamp: new Date().toISOString()
          })
        })
      } catch (e) {
        console.error("Error destroying session:", e)
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

    // Visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Stop voice activities when tab becomes hidden
        if (isSpeaking) {
          stopSpeaking()
        }
        if (isListening) {
          forceStop()
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handleRouteChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      destroySession()
    }
  }, [isSpeaking, isListening, stopSpeaking, forceStop, userId, conversationId])

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

  const handleBackNavigation = () => {
    // Force stop all voice activities immediately before navigating back
    try {
      if (isSpeaking) {
        stopSpeaking()
      }
      if (isListening) {
        forceStop()
      }
    } catch (e) {
      console.error("Error stopping voice activities:", e)
    }
    
    // Small delay to ensure voice stops before navigation
    setTimeout(() => {
      router.back()
    }, 100)
  }

  const handleEndSession = async () => {
    if (messages.length < 2) {
      alert("Please have a conversation before ending the session.")
      return
    }

    // Stop any ongoing voice activities
    if (isSpeaking) {
      stopSpeaking()
    }
    if (isListening) {
      stopListening()
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

      // Show feedback inline instead of navigating
      setFeedbackData(data)
      setShowFeedback(true)
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
            <Button className="mt-4" onClick={handleBackNavigation}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If feedback is being shown, display feedback overlay
  if (showFeedback && feedbackData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Training Feedback</h1>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowFeedback(false)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close Feedback
              </Button>
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Feedback Content */}
        <div className="max-w-4xl mx-auto p-6 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
          {/* Overall Score */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreColor(feedbackData.score)} mb-4`}
                >
                  <span className="text-3xl font-bold">{feedbackData.score}</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{getScoreLabel(feedbackData.score)} Performance</h2>
                <p className="text-gray-600">Your {scenario.replace("_", " ")} training session score</p>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                What You Did Well
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackData.strengths?.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackData.improvements?.map((improvement: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Lightbulb className="w-5 h-5" />
                Key Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {feedbackData.recommendations?.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Scenario-Specific Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <TrendingUp className="w-5 h-5" />
                Scenario-Specific Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{feedbackData.scenarioFeedback}</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pb-6">
            <Button 
              onClick={() => {
                setShowFeedback(false)
                setFeedbackData(null)
                setMessages([])
                // Restart the session
                const initialMessage = { role: "assistant" as const, content: getInitialMessage(scenario) }
                setMessages([initialMessage])
                speak(getInitialMessage(scenario))
              }} 
              className="bg-purple-600 hover:bg-purple-700"
            >
              Practice Again
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Try Different Scenario
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackNavigation}>
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
