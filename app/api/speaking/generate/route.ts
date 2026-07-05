import OpenAI from "openai"

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  return new OpenAI({ apiKey })
}

type Candidate = {
  id: string
  japanese: string
  reading: string
  note: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  my: "Myanmar Burmese",
  vi: "Vietnamese",
  tl: "Filipino (Tagalog)",
  hi: "Hindi",
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const sourceText = String(body?.sourceText ?? "").trim()
    const sourceLanguage = String(body?.sourceLanguage ?? "en").trim().toLowerCase()
    const scene = String(body?.scene ?? "work")
    const politeness = String(body?.politeness ?? "polite")

    if (!sourceText) {
      return Response.json({ error: "sourceText is required" }, { status: 400 })
    }

    const openai = getOpenAI()

    const sourceLanguageLabel = LANGUAGE_LABELS[sourceLanguage] ?? sourceLanguage

    const prompt = `
You are a Japanese expression coach for foreign learners.

Convert the user's text into exactly 2 natural Japanese candidate sentences.

Return JSON only in this exact format:
{
  "candidates": [
    { "id": "c1", "japanese": "...", "reading": "...", "note": "..." },
    { "id": "c2", "japanese": "...", "reading": "...", "note": "..." }
  ]
}

Rules:
- sourceLanguage: ${sourceLanguageLabel} (${sourceLanguage})
- scene: ${scene}
- politeness: ${politeness}
- first sentence should be the best recommendation
- reading should be mainly hiragana
- note should be short and in Japanese
- understand the user input in the specified source language before converting it to natural Japanese
- useful for real work or daily life
- output JSON only

User text:
${sourceText}
`

    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    })

    const text = res.output_text?.trim()
    if (!text) {
      throw new Error("OpenAI returned empty output")
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error("JSON parse failed. raw text:", text)
      throw new Error("OpenAI response was not valid JSON")
    }

    const rawCandidates = (parsed as { candidates?: unknown[] })?.candidates
    if (!Array.isArray(rawCandidates)) {
      throw new Error("Candidates array is missing")
    }

    const candidates: Candidate[] = rawCandidates
      .slice(0, 2)
      .map((item, index) => {
        const candidate = item as Partial<Candidate>
        return {
          id: candidate.id || `c${index + 1}`,
          japanese: String(candidate.japanese ?? "").trim(),
          reading: String(candidate.reading ?? "").trim(),
          note: String(candidate.note ?? "").trim(),
        }
      })
      .filter((item) => item.japanese)

    if (candidates.length === 0) {
      throw new Error("有効な候補を作成できませんでした")
    }

    return Response.json({ candidates })
  } catch (error) {
    console.error("generate route error:", error)
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate Japanese candidates",
      },
      { status: 500 }
    )
  }
}
