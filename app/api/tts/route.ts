import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GOOGLE_TTS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "en-US",
          name: "en-US-Neural2-F",
          ssmlGender: "FEMALE",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] TTS API error response:", errorText)
      throw new Error(`Google TTS API error: ${response.status}`)
    }

    const data = await response.json()
    const audioContent = data.audioContent

    if (!audioContent) {
      throw new Error("No audio content received from Google TTS")
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioContent, "base64")

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("TTS API error:", error)
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
  }
}
