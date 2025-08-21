"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, RotateCcw, Plus, Phone, PresentationIcon as PresentationChart, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardContent() {
  const router = useRouter()

  const scenarios = [
    {
      id: "cold_calling",
      title: "Cold calling",
      subtitle: "Practice",
      description: "Practice a sales conversation scenario.",
      icon: Phone,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "demo_pitch",
      title: "Demo Pitch",
      subtitle: "Pitch",
      description: "Get feedback on your sales pitch.",
      icon: PresentationChart,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "upsell",
      title: "Upsell",
      subtitle: "Upsell",
      description: "Test your sales knowledge.",
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600",
    },
  ]

  const handleScenarioClick = (scenarioId: string) => {
    router.push(`/training/${scenarioId}`)
  }

  const handleFeedbackClick = () => {
    router.push("/history")
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-end">
          <Button
            onClick={handleFeedbackClick}
            variant="outline"
            className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200 text-purple-700 hover:from-purple-200 hover:to-pink-200"
          >
            Get Feedback
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Purple gradient orb */}
        <div className="w-32 h-32 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full mb-8 shadow-lg opacity-90"></div>

        {/* Welcome text */}
        <div className="text-center mb-12 max-w-md">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Welcome to Sales Training Bot</h1>
          <p className="text-gray-600">Choose a scenario to start practicing your sales skills.</p>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
          {scenarios.map((scenario) => {
            const IconComponent = scenario.icon
            return (
              <Card
                key={scenario.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-gray-200"
                onClick={() => handleScenarioClick(scenario.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${scenario.color} rounded-full flex items-center justify-center`}
                    >
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{scenario.title}</h3>
                  <p className="text-sm text-purple-600 font-medium mb-3">{scenario.subtitle}</p>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Bottom input area */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent">
            <Plus className="w-5 h-5" />
          </Button>
          <Button size="icon" className="rounded-full w-14 h-14 bg-purple-600 hover:bg-purple-700 shadow-lg">
            <Mic className="w-6 h-6 text-white" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full w-12 h-12 bg-transparent">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
