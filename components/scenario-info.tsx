import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SALES_SCENARIOS, type ScenarioType } from "@/lib/ai-prompts"

interface ScenarioInfoProps {
  scenario: ScenarioType
}

export function ScenarioInfo({ scenario }: ScenarioInfoProps) {
  const scenarioData = SALES_SCENARIOS[scenario]

  if (!scenarioData) return null

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Scenario Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">{scenarioData.description}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Customer Profile</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Role:</strong> {scenarioData.customerProfile.role}
              </p>
              <p>
                <strong>Company:</strong> {scenarioData.customerProfile.company}
              </p>
              <p>
                <strong>Personality:</strong> {scenarioData.customerProfile.personality}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">Your Objectives</h4>
            <ul className="space-y-1 text-sm">
              {scenarioData.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Customer Challenges</h4>
          <div className="flex flex-wrap gap-2">
            {scenarioData.customerProfile.challenges.map((challenge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {challenge}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
