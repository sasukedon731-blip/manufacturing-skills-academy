// app/api/speaking/tts/route.ts

import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text = String(body?.text ?? "").trim()

    if (!text) {
      return Response.json(
        { error: "text is required" },
        { status: 400 }
      )
    }

    const mp3 = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("TTS route error:", error)
    return Response.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    )
  }
}