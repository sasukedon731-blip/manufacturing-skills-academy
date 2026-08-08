import type { Question, Quiz, QuizType } from "@/app/data/types"

const MANUFACTURING_STATIC_AUDIO_URLS = new Map<string, string>([
  ["speaking-practice:1", "/audio/manufacturing/speaking/speaking-practice-1.mp3"],
  ["genba-listening:1", "/audio/manufacturing/genba/genba-listening-1.mp3"],
  ["genba-listening:2", "/audio/manufacturing/genba/genba-listening-2.mp3"],
  ["genba-listening:3", "/audio/manufacturing/genba/genba-listening-3.mp3"],
  ["genba-listening:4", "/audio/manufacturing/genba/genba-listening-4.mp3"],
  ["genba-phrasebook:1", "/audio/manufacturing/genba/genba-phrasebook-1.mp3"],
  ["genba-phrasebook:5", "/audio/manufacturing/genba/genba-phrasebook-5.mp3"],
])

function getAudioUrl(quizType: QuizType, question: Question): string | undefined {
  if (!question.listeningText?.trim()) return undefined

  const manufacturingStaticAudioUrl = MANUFACTURING_STATIC_AUDIO_URLS.get(`${quizType}:${question.id}`)
  if (manufacturingStaticAudioUrl) return manufacturingStaticAudioUrl

  switch (quizType) {
    case "japanese-n4":
      return question.sectionId === "listening"
        ? `/audio/jlpt/n4/japanese-n4_${question.id}.mp3`
        : undefined

    case "japanese-n3":
      return question.sectionId === "listening"
        ? `/audio/jlpt/n3/jlpt-n3-listening_${question.id}.mp3`
        : undefined

    case "japanese-n2":
      return question.sectionId === "listening"
        ? `/audio/jlpt/n2/jlpt-n2-listening_${question.id}.mp3`
        : undefined

    case "manufacturing-listening":
      return `/audio/manufacturing-listening/manufacturing-listening_${question.id}.mp3`

    case "manufacturing-conversation":
      return `/audio/manufacturing-conversation/manufacturing-conversation_${question.id}.mp3`

    case "manufacturing-conversation-50":
      return `/audio/manufacturing-conversation/manufacturing-conversation_${question.id}.mp3`

    case "kansai-listening":
      return `/audio/kansai-listening/kansai_${String(question.id).padStart(3, "0")}.mp3`

    default:
      return undefined
  }
}

export function attachAudioUrls(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      audioUrl: q.audioUrl ?? getAudioUrl(quiz.id, q),
    })),
  }
}
