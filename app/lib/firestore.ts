// app/lib/firestore.ts
"use client"

import { db } from "@/app/lib/firebase"
import { buildEntitledQuizTypes, normalizeSelectedForPlan, type PlanId } from "@/app/lib/plan"
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore"

export type UserRole = "admin" | "user"

type EnsureParams = {
  uid: string
  email?: string | null
  displayName?: string | null
}

/**
 * users/{uid} を必ず存在させる。
 * 新規登録画面を通らずAuthだけ作られたユーザーでも、1日無料体験つきの個人ユーザーとして復旧する。
 */
export async function ensureUserProfile(params: EnsureParams) {
  const { uid } = params
  const email = params.email ?? null
  const displayName = params.displayName ?? null

  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const plan: PlanId = "trial"
    const entitledQuizTypes = buildEntitledQuizTypes(plan)
    const selectedQuizTypes = normalizeSelectedForPlan([], entitledQuizTypes, plan)
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await setDoc(ref, {
      uid,
      email,
      displayName,
      role: "user" as UserRole,
      accountType: "personal",
      plan,
      trialStartedAt: Timestamp.fromDate(now),
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      selectedQuizTypes,
      nextChangeAllowedAt: null,
      schemaVersion: 3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return
  }

  const data = snap.data() as any
  const patch: Record<string, any> = {
    uid,
    updatedAt: serverTimestamp(),
  }

  if (email && !data?.email) patch.email = email
  if (displayName && !data?.displayName) patch.displayName = displayName

  await setDoc(ref, patch, { merge: true })
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return "user"
  const role = (snap.data() as any)?.role
  return role === "admin" ? "admin" : "user"
}
