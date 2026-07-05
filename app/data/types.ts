export type QuizType =
  | "japanese-n4"
  | "japanese-n3"
  | "japanese-n2"
  | "speaking-practice"
  | "genba-listening"
  | "genba-phrasebook"
  | "kansai-listening"
  | "dialect-listening"
  | "dialect-meaning"
  | "confusing-japanese"
  | "manufacturing-meaning"
  | "manufacturing-word"
  | "manufacturing-listening"
  | "manufacturing-conversation"
  | "manufacturing-conversation-50"
  | "skill-test-machining"

export type QuizSection = {
  id: string
  label: string
}

export type Question = {
  id: number
  question: string
  choices: string[]
  correctIndex?: number
  correctIndexes?: number[]
  explanation: string
  explanationEn?: string
  point?: string
  trap?: string
  signId?: string
  audioUrl?: string
  listeningText?: string
  imageUrl?: string
  imageAlt?: string
  choiceImageUrl?: string
  choiceImageAlt?: string
  explanationImageUrl?: string
  explanationImageAlt?: string
  sectionId?: string
  kind?: "description" | "term" | "image"
  hint?: string
}

export type Quiz = {
  id: QuizType
  title: string
  description?: string
  sections?: QuizSection[]
  questions: Question[]
}
