"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, TrendingUp, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { formatDate } from "@/lib/utils"

interface ConversationData {
  id: string
  title: string
  scenario_type: string
  messages: string
  score?: number
  feedback?: string
  created_at: string
  updated_at: string
}

interface ConversationHistoryProps {
  conversation: ConversationData
}

export function ConversationHistory({ conversation }: ConversationHistoryProps) {
  const router = useRouter()

  const messages = JSON.parse(conversation.messages || "[]")
  const feedback = conversation.feedback ? JSON.parse(conversation.feedback) : null

  const formatScenarioType = (type: string) => {
    switch (type) {
      case "cold_calling":
        return "Cold Call Prospecting"
      case "demo_pitch":
        return "Product Demo Presentation"
      case "upsell":
        return "Upselling Existing Customers"
      default:
        return type
    }
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-600"
    if (score >= 80) return "bg-green-100 text-green-700"
    if (score >= 60) return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    if (score >= 60) return "Needs Work"
    return "Poor"
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
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{conversation.title}</h1>
              <p className="text-sm text-gray-600">{formatScenarioType(conversation.scenario_type)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {conversation.score && (
              <Badge className={`${getScoreColor(conversation.score)} font-medium`}>
                {conversation.score} - {getScoreLabel(conversation.score)}
              </Badge>
            )}
            <Button
              onClick={() => router.push(`/training/${conversation.scenario_type}`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Session Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date</p>
                  <p className="text-sm text-gray-600">{formatDate(conversation.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-sm text-gray-600">{messages.length} exchanges</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Performance</p>
                  <p className="text-sm text-gray-600">
                    {conversation.score ? `${conversation.score}/100` : "Not scored"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Transcript */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.map((message: any, index: number) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="text-xs opacity-75 mb-1">{message.role === "user" ? "You" : "Customer"}</div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Summary */}
        {feedback && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Strengths</h4>
                  <ul className="space-y-1">
                    {feedback.strengths?.slice(0, 2).map((strength: string, index: number) => (
                      <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2">Improvements</h4>
                  <ul className="space-y-1">
                    {feedback.improvements?.slice(0, 2).map((improvement: string, index: number) => (
                      <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {feedback.recommendations?.slice(0, 2).map((recommendation: string, index: number) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 justify-center pt-4">
                <Button
                  onClick={() =>
                    router.push(`/feedback/${conversation.scenario_type}?conversationId=${conversation.id}`)
                  }
                  variant="outline"
                >
                  View Full Feedback
                </Button>
                <Button
                  onClick={() => router.push(`/training/${conversation.scenario_type}`)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Practice This Scenario Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
