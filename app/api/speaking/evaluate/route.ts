import { NextResponse } from "next/server"
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type EvalJson = {
  overallResult: string
  scores: {
    meaning: number
    naturalness: number
    politeness: number
  }
  goodPoints: string[]
  fixPoints: string[]
  recommended: string
  shortFeedback: string
}

function clampScore(value: unknown, fallback = 60) {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100, Math.round(n)))
}

function normalizeArray(value: unknown, max = 3) {
  if (!Array.isArray(value)) return []
  return value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, max)
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const targetText = typeof body?.targetText === "string" ? body.targetText.trim() : ""
    const spokenTranscript =
      typeof body?.spokenTranscript === "string" ? body.spokenTranscript.trim() : ""

    if (!targetText || !spokenTranscript) {
      return NextResponse.json(
        { error: "targetText と spokenTranscript は必須です" },
        { status: 400 }
      )
    }

    const prompt = `
あなたは、日本語学習者向けのやさしく実用的な評価者です。
以下の「目標文」と「学習者の発話文字起こし」を比較して、
“日本語として伝わるか・自然か・丁寧さが合っているか” を評価してください。

重要ルール:
- 音声の発音そのものは評価しない
- 漢字/ひらがな/カタカナの違いは減点対象にしない
- 軽微な助詞ミス、表記ゆれ、言い換えは、意味が通れば厳しく減点しない
- 「会話で通じるか」「職場や日常で使って自然か」を重視する
- 厳しすぎず、学習継続につながる前向きな評価にする
- 3項目を0〜100点で直採点する
- 出力は必ずJSONのみ

評価項目:
1. meaning
   伝えたい意味がどれだけ相手に伝わるか
2. naturalness
   日本語としてどれだけ自然か
3. politeness
   場面に対して丁寧さが合っているか

採点目安:
- 90〜100: かなり自然でそのまま使いやすい
- 75〜89: 少し違和感はあるが十分伝わる
- 60〜74: 伝わるが直すとかなり良くなる
- 40〜59: 一部伝わるが不自然さが大きい
- 0〜39: 意味がかなり伝わりにくい

返却形式:
{
  "overallResult": "ひとことで総評",
  "scores": {
    "meaning": 0,
    "naturalness": 0,
    "politeness": 0
  },
  "goodPoints": ["良かった点1", "良かった点2"],
  "fixPoints": ["直すと良い点1", "直すと良い点2"],
  "recommended": "おすすめの言い方",
  "shortFeedback": "短い励ましコメント"
}

目標文:
${targetText}

学習者の発話文字起こし:
${spokenTranscript}
`.trim()

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    })

    const text = response.output_text?.trim()
    if (!text) {
      return NextResponse.json(
        { error: "評価結果の生成に失敗しました" },
        { status: 500 }
      )
    }

    let parsed: Partial<EvalJson> = {}
    try {
      parsed = JSON.parse(text)
    } catch {
      return NextResponse.json(
        { error: "評価結果の解析に失敗しました", raw: text },
        { status: 500 }
      )
    }

    const meaning = clampScore(parsed.scores?.meaning, 60)
    const naturalness = clampScore(parsed.scores?.naturalness, 60)
    const politeness = clampScore(parsed.scores?.politeness, 60)

    const result: EvalJson = {
      overallResult: normalizeString(
        parsed.overallResult,
        "伝わる内容でした。少し整えるとさらに自然になります。"
      ),
      scores: {
        meaning,
        naturalness,
        politeness,
      },
      goodPoints: normalizeArray(parsed.goodPoints, 3),
      fixPoints: normalizeArray(parsed.fixPoints, 3),
      recommended: normalizeString(
        parsed.recommended,
        targetText
      ),
      shortFeedback: normalizeString(
        parsed.shortFeedback,
        "いい練習です。この調子で続けましょう。"
      ),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("speaking evaluate error:", error)
    return NextResponse.json(
      { error: "評価中にエラーが発生しました" },
      { status: 500 }
    )
  }
}