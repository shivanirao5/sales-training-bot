import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { messages, scenario, userId, conversationId } = await request.json()

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
- Use plain text only, no asterisks, underscores, or any formatting symbols
- Speak naturally as if in a real phone conversation

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
- Use plain text only, no asterisks, underscores, or any formatting symbols
- Speak naturally as if in a real phone conversation

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
- Use plain text only, no asterisks, underscores, or any formatting symbols
- Speak naturally as if in a real phone conversation

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
    let trainerMessage = response.text()

    // Clean the response to remove asterisks and any markdown formatting
    trainerMessage = trainerMessage
      .replace(/\*+/g, '') // Remove all asterisks
      .replace(/_+/g, '') // Remove underscores used for emphasis
      .replace(/#+\s*/g, '') // Remove hash symbols used for headings
      .replace(/\[([^\]]+)\]/g, '$1') // Remove square brackets but keep content
      .replace(/\(([^)]+)\)/g, '') // Remove parentheses and content (often URLs)
      .trim()

    // Save conversation in progress if conversationId is provided
    if (conversationId && userId) {
      try {
        const { createClient } = await import("@/lib/supabase/server")
        const supabase = await createClient()
        
        const updatedMessages = [...messages, { role: "assistant", content: trainerMessage }]
        const title = `${scenario.replace("_", " ")} - ${new Date().toLocaleDateString()}`
        
        // Try to update existing conversation, if not exists then insert
        const { error: updateError } = await supabase
          .from("conversations")
          .update({
            messages: JSON.stringify(updatedMessages),
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId)
          .eq("user_id", userId)

        if (updateError?.code === 'PGRST116') {
          // Conversation doesn't exist, create new one
          await supabase.from("conversations").insert({
            id: conversationId,
            user_id: userId,
            title,
            scenario_type: scenario,
            messages: JSON.stringify(updatedMessages),
          })
        }
      } catch (dbError) {
        console.error("Error saving conversation:", dbError)
        // Don't fail the response if DB save fails
      }
    }

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
