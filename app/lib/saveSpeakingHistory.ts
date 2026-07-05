import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/app/lib/firebase"

type SpeakingHistoryInput = {
  uid: string
  prompt: string
  candidate: string
  transcript: string
  evaluation: {
    meaning: number
    naturalness: number
    politeness: number
    totalScore: number
    comment?: string
  }
}

export async function saveSpeakingHistory(input: SpeakingHistoryInput) {
  const ref = collection(db, "users", input.uid, "speakingHistory")

  await addDoc(ref, {
    type: "speaking",
    prompt: input.prompt,
    candidate: input.candidate,
    transcript: input.transcript,
    evaluation: input.evaluation,
    totalScore: input.evaluation.totalScore,
    createdAt: serverTimestamp(),
  })
}
