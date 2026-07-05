import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/app/lib/firebase"

export type SpeakingHistoryItem = {
  id: string
  prompt: string
  candidate: string
  transcript: string
  totalScore: number
  evaluation: {
    meaning: number
    naturalness: number
    politeness: number
    totalScore: number
    comment?: string
  } | null
  createdAt: Date | null
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  return null
}

function toNumber(value: unknown, fallback = 0) {
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

export async function getSpeakingHistory(
  uid: string,
  maxCount = 30
): Promise<SpeakingHistoryItem[]> {
  if (!uid) return []

  const ref = collection(db, "users", uid, "speakingHistory")
  const q = query(ref, orderBy("createdAt", "desc"), limit(maxCount))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    const evaluationRaw = data.evaluation ?? null

    return {
      id: doc.id,
      prompt: String(data.prompt || ""),
      candidate: String(data.candidate || ""),
      transcript: String(data.transcript || ""),
      totalScore: toNumber(
        data.totalScore,
        toNumber(evaluationRaw?.totalScore, 0)
      ),
      evaluation: evaluationRaw
        ? {
            meaning: toNumber(evaluationRaw.meaning, 0),
            naturalness: toNumber(evaluationRaw.naturalness, 0),
            politeness: toNumber(evaluationRaw.politeness, 0),
            totalScore: toNumber(evaluationRaw.totalScore, 0),
            comment:
              typeof evaluationRaw.comment === "string"
                ? evaluationRaw.comment
                : undefined,
          }
        : null,
      createdAt: toDate(data.createdAt),
    }
  })
}