// app/lib/firestore.ts
"use client"

import { db } from "@/app/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export type UserRole = "admin" | "user"

type EnsureParams = {
  uid: string
  email?: string | null
  displayName?: string | null
}

/**
 * ✅ users/{uid} を必ず「実在するドキュメント」として作る/補正する
 * - 初回：role/user を含めて作成（空ドキュメント問題を根絶）
 * - 既存：roleは触らず、email/displayName/updatedAt を安全に merge
 * - ⚠️ 既存ユーザーの selectedQuizTypes を絶対に上書きしない
 */
export async function ensureUserProfile(params: EnsureParams) {
  const { uid } = params
  const email = params.email ?? null
  const displayName = params.displayName ?? null

  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      displayName,
      role: "user" as UserRole,

      // 初回だけ初期値
      quizLimit: 3,
      selectedQuizTypes: [],

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return
  }

  const data = snap.data() as any

  // ✅ 既存：roleは変更しない（事故防止）
  // ✅ email/displayName は未設定なら補完してOK
  // ✅ quizLimit/selectedQuizTypes は「無いときだけ」補完（上書き禁止）
  const patch: Record<string, any> = {
    uid,
    updatedAt: serverTimestamp(),
  }

  if (email && !data?.email) patch.email = email
  if (displayName && !data?.displayName) patch.displayName = displayName

  if (typeof data?.quizLimit !== "number") patch.quizLimit = 3
  if (!Array.isArray(data?.selectedQuizTypes)) patch.selectedQuizTypes = []

  await setDoc(ref, patch, { merge: true })
}

/**
 * ✅ 自分のrole取得（存在しない場合は user 扱い）
 */
export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return "user"
  const role = (snap.data() as any)?.role
  return role === "admin" ? "admin" : "user"
}
