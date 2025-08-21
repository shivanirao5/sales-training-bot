import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { messages, scenario, userId } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const systemPrompts = {
      cold_calling: `You are a potential customer receiving a cold call from a sales representative. You should act realistic and challenging but not impossible to work with. 

Key behaviors:
- Be initially skeptical and busy
- Ask probing questions about value proposition
- Show interest if the salesperson demonstrates clear benefits
- Raise common objections like budget, timing, or existing solutions
- Gradually warm up if the salesperson handles objections well
- Keep responses conversational and under 50 words

Your company: Mid-size manufacturing company, you're the Operations Manager
Current challenges: Looking to improve efficiency and reduce costs
Personality: Professional but direct, values concrete benefits over features`,

      demo_pitch: `You are a potential customer attending a product demonstration. You're interested but need to be convinced of the value.

Key behaviors:
- Ask specific questions about features and benefits
- Compare to existing solutions you might have
- Inquire about pricing, implementation, and support
- Show interest in ROI and business impact
- Be engaged but require thorough explanations
- Keep responses conversational and under 50 words

Your company: Growing tech startup, you're the CTO
Current challenges: Scaling operations and improving team productivity
Personality: Technical-minded, data-driven, wants to see proof of value`,

      upsell: `You are an existing satisfied customer being approached about additional services or upgrades.

Key behaviors:
- Express satisfaction with current service
- Be open to hearing about new offerings
- Ask about additional costs and value
- Consider how new features would benefit your team
- Show interest if benefits are clearly explained
- Keep responses conversational and under 50 words

Your company: Established consulting firm, you're the Managing Partner
Current situation: Happy with existing service, always looking for ways to improve
Personality: Relationship-focused, values long-term partnerships, cost-conscious but willing to invest in proven value`,
    }

    const systemPrompt = systemPrompts[scenario as keyof typeof systemPrompts] || systemPrompts.cold_calling

    // Format conversation history for Gemini
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I'll roleplay as the customer according to these guidelines." }],
        },
        ...conversationHistory.slice(0, -1), // Exclude the last user message
      ],
    })

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]?.content || ""

    // Generate response
    const result = await chat.sendMessage(latestMessage)
    const response = await result.response
    const trainerMessage = response.text()

    return NextResponse.json({ message: trainerMessage })
  } catch (error) {
    console.error("Chat API error:", error)

    const { scenario } = await request.json().catch(() => ({ scenario: "cold_calling" }))

    const fallbackResponses = {
      cold_calling:
        "I appreciate you calling, but I'm quite busy right now. Can you quickly tell me what this is about?",
      demo_pitch: "This looks interesting. Can you tell me more about how this would specifically help our business?",
      upsell: "We're happy with our current service. What additional value would this new feature provide?",
    }

    const fallbackMessage =
      fallbackResponses[scenario as keyof typeof fallbackResponses] ||
      "I'm sorry, could you repeat that? I didn't quite catch what you said."

    return NextResponse.json({ message: fallbackMessage })
  }
}
