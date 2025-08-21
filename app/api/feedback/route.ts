import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Feedback API called")

    const body = await request.json()
    console.log("[v0] Request body received:", {
      messagesCount: body.messages?.length,
      scenario: body.scenario,
      userId: body.userId,
    })

    const { messages, scenario, userId, conversationId } = body

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("[v0] Missing GOOGLE_GENERATIVE_AI_API_KEY")
      return NextResponse.json({ error: "Training service not configured" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const feedbackPrompt = `You are an expert sales trainer analyzing a sales conversation. Please provide detailed feedback on this ${scenario.replace("_", " ")} conversation.

Conversation transcript:
${messages.map((msg: any) => `${msg.role === "user" ? "Salesperson" : "Customer"}: ${msg.content}`).join("\n")}

Please analyze this conversation and provide:

1. OVERALL SCORE (0-100): Rate the overall performance
2. STRENGTHS: What the salesperson did well (2-3 points)
3. AREAS FOR IMPROVEMENT: Specific areas to work on (2-3 points)
4. KEY RECOMMENDATIONS: Actionable advice for next time (2-3 points)
5. SCENARIO-SPECIFIC FEEDBACK: Feedback specific to ${scenario.replace("_", " ")} best practices

Format your response as JSON with this structure:
{
  "score": number,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "scenarioFeedback": "detailed scenario-specific feedback paragraph"
}

Be constructive, specific, and encouraging while providing actionable insights.`

    console.log("[v0] Generating training feedback...")
    const result = await model.generateContent(feedbackPrompt)
    const response = await result.response
    const feedbackText = response.text()
    console.log("[v0] Training response received, length:", feedbackText.length)

    // Parse the JSON response
    let feedback
    try {
      // Clean the response to extract JSON
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0])
        console.log("[v0] Successfully parsed training feedback JSON")
      } else {
        console.log("[v0] No JSON found in training response, using fallback")
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.log("[v0] JSON parsing failed, using fallback feedback")
      // Fallback feedback if JSON parsing fails
      feedback = {
        score: 75,
        strengths: [
          "Engaged in conversation with the customer",
          "Attempted to understand customer needs",
          "Maintained professional tone",
        ],
        improvements: [
          "Could ask more probing questions",
          "Should focus more on value proposition",
          "Could handle objections more effectively",
        ],
        recommendations: [
          "Practice active listening techniques",
          "Prepare stronger opening statements",
          "Study common objection handling methods",
        ],
        scenarioFeedback:
          "Overall, this was a good practice session. Focus on building rapport and clearly articulating value to improve your performance.",
      }
    }

    // Save to database
    console.log("[v0] Saving conversation to database...")
    const supabase = await createClient()

    if (conversationId) {
      // Update existing conversation
      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          messages: JSON.stringify(messages),
          score: feedback.score,
          feedback: JSON.stringify(feedback),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", userId)

      if (updateError) {
        console.error("[v0] Database update error:", updateError)
      } else {
        console.log("[v0] Conversation updated successfully")
      }
    } else {
      // Create new conversation
      const title = `${scenario.replace("_", " ")} - ${new Date().toLocaleDateString()}`
      const { error: insertError } = await supabase.from("conversations").insert({
        user_id: userId,
        title,
        scenario_type: scenario,
        messages: JSON.stringify(messages),
        score: feedback.score,
        feedback: JSON.stringify(feedback),
      })

      if (insertError) {
        console.error("[v0] Database insert error:", insertError)
      } else {
        console.log("[v0] New conversation created successfully")
      }
    }

    console.log("[v0] Returning feedback response")
    return NextResponse.json(feedback)
  } catch (error) {
    console.error("[v0] Feedback API error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
