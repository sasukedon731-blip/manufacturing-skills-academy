import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/app/lib/firebase"

export type ConversationHistoryMessage = {
  role: "ai" | "user" | "system"
  text: string
  createdAt?: number
}

export type ConversationHistoryEvaluation = {
  clarity?: number | string
  naturalness?: number | string
  politeness?: number | string
  continuity?: number | string
  goodPoints?: string[]
  nextTips?: string[]
  comment?: string
}

export type SaveConversationHistoryInput = {
  uid: string
  theme: string
  themeLabel: string
  level: string
  levelLabel: string
  messages: ConversationHistoryMessage[]
  evaluation: ConversationHistoryEvaluation | null
  totalScore: number
}

export async function saveConversationHistory({
  uid,
  theme,
  themeLabel,
  level,
  levelLabel,
  messages,
  evaluation,
  totalScore,
}: SaveConversationHistoryInput) {
  if (!uid) {
    throw new Error("uid is required")
  }

  const ref = collection(db, "users", uid, "conversationHistory")

  const payload = {
    type: "conversation",
    theme,
    themeLabel,
    level,
    levelLabel,
    totalScore,
    messages: messages.map((m) => ({
      role: m.role,
      text: m.text,
      createdAt: m.createdAt ?? Date.now(),
    })),
    evaluation: evaluation
      ? {
          clarity: evaluation.clarity ?? null,
          naturalness: evaluation.naturalness ?? null,
          politeness: evaluation.politeness ?? null,
          continuity: evaluation.continuity ?? null,
          goodPoints: evaluation.goodPoints ?? [],
          nextTips: evaluation.nextTips ?? [],
          comment: evaluation.comment ?? "",
        }
      : null,
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(ref, payload)
  return docRef.id
}