import OpenAI from "openai"

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }

  return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const audio = form.get("audio")

    if (!(audio instanceof File)) {
      return Response.json({ error: "audio is required" }, { status: 400 })
    }

    const openai = getOpenAI()

    const result = await openai.audio.transcriptions.create({
      file: audio,
      model: "gpt-4o-mini-transcribe",
    })

    return Response.json({
      transcript: result.text,
    })
  } catch (error) {
    console.error("transcribe route error:", error)
    return Response.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}