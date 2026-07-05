import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function themeLabel(theme: string) {
  switch (theme) {
    case "work-greeting":
      return "職場あいさつ"
    case "interview":
      return "面接"
    case "daily":
      return "日常会話"
    default:
      return "日常会話"
  }
}

function themePrompt(theme: string) {
  switch (theme) {
    case "work-greeting":
      return "職場でのあいさつや短いやり取りを練習する会話にしてください。"
    case "interview":
      return "面接の受け答えを練習する会話にしてください。"
    case "daily":
    default:
      return "日常で使う自然な会話にしてください。"
  }
}

function levelPrompt(level: string) {
  switch (level) {
    case "N5":
      return "N5レベルのかなりやさしい日本語で、短い文を使ってください。漢字は少なめにしてください。"
    case "N4":
      return "N4レベルのやさしい日本語で、自然でわかりやすく話してください。"
    case "N3":
      return "N3レベルの日本語で、少し長めでも自然な会話にしてください。"
    case "N2":
      return "N2レベルの自然で実用的な日本語で話してください。"
    case "business":
      return "ビジネス向けの丁寧で自然な日本語で話してください。"
    default:
      return "N4レベルのやさしい日本語で話してください。"
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const theme = String(body?.theme || "daily")
    const level = String(body?.level || "N4")

    const prompt = `
あなたは日本語学習者向けの会話練習AIです。
最初の一言を自然な日本語で返してください。

テーマ: ${themeLabel(theme)}
テーマ方針: ${themePrompt(theme)}
レベル方針: ${levelPrompt(level)}

条件:
- 最初の一言として自然
- 長すぎない
- 1〜3文
- 学習者が返答しやすい内容
- 解説しない
- 箇条書きにしない
- 会話文だけ返す
`

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "あなたは日本語学習者向けの会話練習AIです。自然な会話文だけを返してください。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const reply =
      response.choices?.[0]?.message?.content?.trim() ||
      "こんにちは。今日はどんなことを話したいですか？"

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("conversation/start error:", error)

    return NextResponse.json(
      { error: "会話の開始に失敗しました。" },
      { status: 500 }
    )
  }
}