export type QuizMode = "normal" | "exam" | "review"
export type IndustryId = "manufacturing" | "japanese" | "undecided"

export type QuizSectionDef = {
  id: string
  title: string
  description?: string
  enabled: boolean
  order: number
}

export type QuizDef = {
  id: string
  title: string
  description?: string
  enabled: boolean
  order: number
  modes: QuizMode[]
  sections: QuizSectionDef[]
  industries?: IndustryId[] | "all"
}

const allSection = [{ id: "all", title: "すべて", enabled: true, order: 1 }]
const jlptSections = [
  { id: "all", title: "すべて", enabled: true, order: 1 },
  { id: "vocab", title: "文字・語彙", enabled: true, order: 2 },
  { id: "grammar", title: "文法", enabled: true, order: 3 },
  { id: "reading", title: "読解", enabled: true, order: 4 },
  { id: "listening", title: "聴解", enabled: true, order: 5 },
]

export const quizCatalog: QuizDef[] = [
  {
    id: "japanese-n4",
    title: "日本語検定 N4",
    description: "基礎日本語の文字・語彙・文法・読解・聴解",
    enabled: true,
    order: 1,
    industries: "all",
    modes: ["normal", "exam", "review"],
    sections: jlptSections,
  },
  {
    id: "japanese-n3",
    title: "日本語 N3",
    description: "仕事と生活で使う中級日本語",
    enabled: true,
    order: 2,
    industries: "all",
    modes: ["normal", "exam", "review"],
    sections: jlptSections,
  },
  {
    id: "japanese-n2",
    title: "日本語 N2",
    description: "より実践的な中上級日本語",
    enabled: true,
    order: 3,
    industries: "all",
    modes: ["normal", "exam", "review"],
    sections: jlptSections,
  },
  {
    id: "speaking-practice",
    title: "AI日本語スピーキング",
    description: "AI生成文と採点で発話練習",
    enabled: true,
    order: 4,
    industries: "all",
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "genba-listening",
    title: "現場用語リスニング",
    description: "仕事で使う日本語を音声で練習",
    enabled: true,
    order: 5,
    industries: "all",
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "genba-phrasebook",
    title: "現場フレーズ集",
    description: "現場で使える聞き取り・発話フレーズ",
    enabled: true,
    order: 6,
    industries: "all",
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "kansai-listening",
    title: "関西弁リスニング",
    description: "関西弁のあいさつ・日常表現・会話表現",
    enabled: true,
    order: 7,
    industries: ["manufacturing", "japanese", "undecided"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "dialect-listening",
    title: "方言リスニング",
    description: "地域ごとの日本語表現を音声で練習",
    enabled: true,
    order: 8,
    industries: ["manufacturing", "japanese", "undecided"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "dialect-meaning",
    title: "全国方言 意味あて",
    description: "方言の意味を選んで覚える日本語クイズ",
    enabled: true,
    order: 9,
    industries: ["manufacturing", "japanese", "undecided"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "confusing-japanese",
    title: "まぎらわしい日本語",
    description: "会話で迷いやすい表現を練習",
    enabled: true,
    order: 10,
    industries: ["manufacturing", "japanese", "undecided"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "manufacturing-meaning",
    title: "製造用語 意味",
    description: "製造現場の重要語を意味から学ぶ",
    enabled: true,
    order: 20,
    industries: ["manufacturing"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "manufacturing-word",
    title: "製造用語 単語",
    description: "製造現場の日本語単語を練習",
    enabled: true,
    order: 21,
    industries: ["manufacturing"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "manufacturing-listening",
    title: "製造リスニング",
    description: "製造現場の音声聞き取り",
    enabled: true,
    order: 22,
    industries: ["manufacturing"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "manufacturing-conversation",
    title: "製造会話",
    description: "工場・製造現場の会話練習",
    enabled: true,
    order: 23,
    industries: ["manufacturing"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "manufacturing-conversation-50",
    title: "製造会話 50",
    description: "製造会話の重点セット",
    enabled: true,
    order: 24,
    industries: ["manufacturing"],
    modes: ["normal", "review"],
    sections: allSection,
  },
  {
    id: "skill-test-machining",
    title: "技能検定 機械加工",
    description: "技能検定の学科対策",
    enabled: true,
    order: 25,
    industries: ["manufacturing"],
    modes: ["normal", "exam", "review"],
    sections: allSection,
  },
]

export function getQuizDef(quizType: string): QuizDef | undefined {
  return quizCatalog.find((q) => q.id === quizType && q.enabled)
}

export function resolveSection(
  quiz: QuizDef,
  sectionId?: string | null,
): QuizSectionDef {
  const enabledSections = (quiz.sections ?? [])
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)

  const fallback: QuizSectionDef =
    enabledSections[0] ?? {
      id: "all",
      title: "すべて",
      enabled: true,
      order: 1,
    }

  if (!sectionId) return fallback
  return enabledSections.find((s) => s.id === sectionId) ?? fallback
}
