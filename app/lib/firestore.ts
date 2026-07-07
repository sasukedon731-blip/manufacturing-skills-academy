// app/lib/firestore.ts
"use client"

import { db } from "@/app/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { buildEntitledQuizTypes, normalizeSelectedForPlan, type PlanId } from "@/app/lib/plan"

export type UserRole = "admin" | "company_admin" | "user"

type EnsureParams = {
  uid: string
  email?: string | null
  displayName?: string | null
}

/**
 * users/{uid} を必ず実在するドキュメントとして作る/補正する。
 * - 初回作成は無料体験（trial）で統一
 * - billing / accountType / companyCode はクライアント側で勝手に作らない
 * - 旧 quizLimit は再作成しない
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

    await setDoc(ref, {
      uid,
      email,
      displayName,
      role: "user" as UserRole,
      plan,
      selectedQuizTypes,
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
  if (!data?.plan) patch.plan = "trial"
  if (!Array.isArray(data?.selectedQuizTypes)) {
    const plan: PlanId = data?.plan === "3" || data?.plan === "5" || data?.plan === "7" ? data.plan : "trial"
    const entitledQuizTypes = buildEntitledQuizTypes(plan)
    patch.selectedQuizTypes = normalizeSelectedForPlan([], entitledQuizTypes, plan)
  }
  if (data?.schemaVersion !== 3) patch.schemaVersion = 3

  await setDoc(ref, patch, { merge: true })
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return "user"
  const role = (snap.data() as any)?.role
  return role === "admin" || role === "company_admin" ? role : "user"
}
