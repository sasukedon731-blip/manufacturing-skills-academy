import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type ConversationMessage = {
  role: "ai" | "user" | "system" | "assistant"
  text: string
}

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
      return `
あなたは日本語学習者向けの会話練習AIです。
テーマは「職場あいさつ」です。

目的:
- 学習者が職場で使う短く自然な日本語を練習する
- 難しすぎる表現は避ける
- 一度に長く話しすぎない
- 会話として自然に1〜3文で返す
- 相手が答えやすいように最後は軽い質問や促しで終えるとよい

話し方:
- やさしく、丁寧
- 実際の現場で使える自然な日本語
- 説明口調ではなく会話口調
`
    case "interview":
      return `
あなたは日本語学習者向けの会話練習AIです。
テーマは「面接」です。

目的:
- 学習者が面接で使う自然で丁寧な日本語を練習する
- 質問は明確で簡潔にする
- 学習者が答えやすいように1つの質問に絞る
- 一度に長く話しすぎない
- 返答は1〜3文程度にする

話し方:
- 丁寧
- 面接官として自然
- 圧迫的にならない
`
    case "daily":
    default:
      return `
あなたは日本語学習者向けの会話練習AIです。
テーマは「日常会話」です。

目的:
- 学習者が日常で使う自然な日本語を練習する
- やさしい会話を心がける
- 一度に長く話しすぎない
- 返答は1〜3文程度
- 相手が答えやすい内容にする

話し方:
- やさしい
- 親しみやすい
- 自然な日常会話
`
  }
}

function levelPrompt(level: string) {
  switch (level) {
    case "N5":
      return `
- N5レベルのかなりやさしい日本語を使う
- 1文を短くする
- むずかしい言い回しは避ける
- 学習者がまねしやすい表現を使う
`
    case "N4":
      return `
- N4レベルのやさしい日本語を使う
- 自然だが、わかりやすさを優先する
- 文は短め〜普通
`
    case "N3":
      return `
- N3レベルの自然な日本語を使う
- 少し長めの文も使ってよい
- 会話らしい言い回しを増やす
`
    case "N2":
      return `
- N2レベルのより自然で実用的な日本語を使う
- 日本で働く場面でも違和感のない表現にする
`
    case "business":
      return `
- ビジネス向けの丁寧な日本語を使う
- 面接や職場でそのまま使える表現を優先する
- 失礼のない自然な話し方にする
`
    default:
      return `
- N4レベルのやさしい日本語を使う
- 自然でわかりやすくする
`
  }
}

function buildHistoryText(history: ConversationMessage[]) {
  return history
    .map((m) => {
      const roleLabel =
        m.role === "user"
          ? "学習者"
          : m.role === "assistant" || m.role === "ai"
          ? "AI"
          : "System"

      return `${roleLabel}: ${m.text}`
    })
    .join("\n")
}

function parseJsonSafely(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .slice(0, 5)
}

function normalizeScore(value: unknown, fallback = 70) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.max(0, Math.min(100, Math.round(num)))
}

function removeTextRecognitionRelatedFeedback(items: string[]): string[] {
  const ngPatterns = [
    /漢字/,
    /表記/,
    /変換/,
    /誤変換/,
    /文字起こし/,
    /書き方/,
    /記載/,
    /同音異義語/,
  ]

  return items.filter((item) => {
    return !ngPatterns.some((pattern) => pattern.test(item))
  })
}

function sanitizeComment(comment: unknown) {
  const text =
    typeof comment === "string" && comment.trim()
      ? comment.trim()
      : "会話おつかれさまでした。全体としてしっかり伝わっていました。次は、返答を少し広げることも意識してみましょう。"

  if (/漢字|表記|変換|誤変換|文字起こし|書き方|記載/.test(text)) {
    return "会話おつかれさまでした。全体としてしっかり伝わっていました。次は、返答を少し広げることも意識してみましょう。"
  }

  return text
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const theme = String(body?.theme || "daily")
    const level = String(body?.level || "N4")
    const turn = Number(body?.turn || 1)
    const userText = String(body?.userText || "").trim()
    const history = Array.isArray(body?.history) ? body.history : []

    if (!userText) {
      return NextResponse.json({ error: "userText is required" }, { status: 400 })
    }

    const safeHistory: ConversationMessage[] = history
      .map((m: any): ConversationMessage => ({
        role:
          m?.role === "user"
            ? "user"
            : m?.role === "assistant" || m?.role === "ai"
            ? "assistant"
            : "system",
        text: String(m?.text || "").trim(),
      }))
      .filter((m: ConversationMessage) => Boolean(m.text))

    const isLastTurn = turn >= 3

    const replyPrompt = `
${themePrompt(theme)}
${levelPrompt(level)}

現在のテーマ: ${themeLabel(theme)}
現在のレベル: ${level}
現在のターン: ${turn} / 3

これまでの会話:
${buildHistoryText(safeHistory)}

学習者の最新の発話:
${userText}

あなたの役割:
- 学習者の発話を受けて、自然な会話の返答をする
- 学習者が次に話しやすい返答にする
- 日本語学習用なので、自然だが難しすぎない表現にする
- 1〜3文で返す
- 箇条書きにしない
- 解説しない
- JSONは出さない
- 返答本文のみ出力する
`

    const replyResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "あなたは日本語会話練習のAIパートナーです。自然で短めの会話返答だけを返してください。",
        },
        {
          role: "user",
          content: replyPrompt,
        },
      ],
    })

    const reply =
      replyResponse.choices?.[0]?.message?.content?.trim() ||
      "ありがとうございます。では、もう少し詳しく教えてください。"

    if (!isLastTurn) {
      return NextResponse.json({
        reply,
        done: false,
        evaluation: null,
        totalScore: null,
      })
    }

    const evaluationPrompt = `
あなたは日本語会話トレーナーです。
以下の会話をもとに、学習者の日本語を評価してください。

テーマ: ${themeLabel(theme)}
レベル: ${level}

重要:
- この会話は音声入力を文字起こしした結果です
- 文字起こしには誤変換が含まれる場合があります
- 漢字・表記・変換ミスは一切評価しないでください
- 意味が自然に伝われば問題ありません
- 発音や音響的な分析は行わないでください
- あくまで会話としての伝わりやすさ・自然さ・丁寧さ・続けやすさを評価してください
- ユーザー本人が修正できない文字起こし由来の問題を指摘しないでください
- 「漢字を直しましょう」「表記を直しましょう」「変換を直しましょう」のような指摘は禁止です

評価基準:
- 90〜100点: 非常に自然で、ほぼ問題なく会話できる
- 80〜89点: 自然で、実用上ほぼ問題なく通じる
- 70〜79点: 多少違和感はあるが、十分通じる
- 60〜69点: 伝わるが、不自然さや広がり不足がある
- 0〜59点: 伝わりにくい部分がある

会話履歴:
${buildHistoryText([
  ...safeHistory,
  { role: "user", text: userText },
  { role: "assistant", text: reply },
])}

評価項目:
- clarity（伝わりやすさ）
- naturalness（自然さ）
- politeness（丁寧さ）
- continuity（会話継続力）

出力ルール:
- 各項目は 0〜100点
- goodPoints は2〜3個
- nextTips は2〜3個
- nextTips は話し方、表現、受け答えの広げ方だけにする
- 漢字、表記、変換ミスには絶対に触れない
- comment は短く前向きに

JSONのみで返してください。
{
  "clarity": 78,
  "naturalness": 74,
  "politeness": 82,
  "continuity": 70,
  "goodPoints": ["..."],
  "nextTips": ["..."],
  "comment": "..."
}
`

    const evaluationResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "あなたは日本語会話レッスンの評価AIです。必ずJSONのみを返してください。音声認識の漢字変換や表記ミスを指摘してはいけません。音響解析ではなく、会話品質のみを評価してください。",
        },
        {
          role: "user",
          content: evaluationPrompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    })

    const evaluationText =
      evaluationResponse.choices?.[0]?.message?.content?.trim() || "{}"

    const parsed = parseJsonSafely(evaluationText) || {}

    const filteredGoodPoints = removeTextRecognitionRelatedFeedback(
      normalizeArray(parsed?.goodPoints)
    )

    const filteredNextTips = removeTextRecognitionRelatedFeedback(
      normalizeArray(parsed?.nextTips)
    )

    const evaluation = {
      clarity: normalizeScore(parsed?.clarity, 75),
      naturalness: normalizeScore(parsed?.naturalness, 72),
      politeness: normalizeScore(parsed?.politeness, 78),
      continuity: normalizeScore(parsed?.continuity, 70),
      goodPoints:
        filteredGoodPoints.length > 0
          ? filteredGoodPoints
          : [
              "会話の内容がしっかり伝わっていました。",
              "受け答えの形ができていました。",
            ],
      nextTips:
        filteredNextTips.length > 0
          ? filteredNextTips
          : [
              "返答に一言理由を足すと、より自然になります。",
              "最後に一言広げると会話が続きやすくなります。",
            ],
      comment: sanitizeComment(parsed?.comment),
    }

    const totalScore = Math.round(
      (evaluation.clarity +
        evaluation.naturalness +
        evaluation.politeness +
        evaluation.continuity) / 4
    )

    return NextResponse.json({
      reply,
      done: true,
      evaluation,
      totalScore,
    })
  } catch (error) {
    console.error("conversation/chat error:", error)

    return NextResponse.json(
      {
        error: "AI会話の処理中にエラーが発生しました。",
      },
      { status: 500 }
    )
  }
}