// app/lib/entitlement.ts
"use client"

import { db } from "@/app/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { getQuizDef } from "@/app/data/quizCatalog"

export type UserEntitlement = {
  quizLimit: number
  selectedQuizTypes: string[]
}

export async function getUserEntitlement(uid: string): Promise<UserEntitlement> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  const data: Record<string, unknown> = snap.exists() ? snap.data() : {}

  return {
    quizLimit: typeof data.quizLimit === "number" ? data.quizLimit : 3,
    selectedQuizTypes: Array.isArray(data.selectedQuizTypes)
      ? data.selectedQuizTypes.filter(
          (quizType: unknown): quizType is string =>
            typeof quizType === "string" && Boolean(getQuizDef(quizType)),
        )
      : [],
  }
}

export async function setSelectedQuizTypes(uid: string, selectedQuizTypes: string[]) {
  const ref = doc(db, "users", uid)
  const activeQuizTypes = selectedQuizTypes.filter((quizType) => Boolean(getQuizDef(quizType)))
  await setDoc(
    ref,
    {
      selectedQuizTypes: activeQuizTypes,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export function canAccessQuiz(selectedQuizTypes: string[], quizType: string) {
  return Boolean(getQuizDef(quizType)) && selectedQuizTypes.includes(quizType)
}
