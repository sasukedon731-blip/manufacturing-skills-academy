// app/lib/billingServer.ts
import { adminDb } from "@/app/lib/firebaseAdmin"
import { buildEntitledQuizTypes, normalizeSelectedForPlan } from "@/app/lib/plan"
import type { QuizType } from "@/app/data/types"

export type BillingStatus = "pending" | "active" | "past_due" | "canceled"
export type BillingMethod = "convenience" | "card"
export type PlanId = "trial" | "free" | "3" | "5" | "7"

export type BillingPatch = Partial<{
  accountType: "personal" | "company"
  method: BillingMethod
  status: BillingStatus
  currentPlan: PlanId
  currentPeriodEnd: any
  komojuSessionId: string | null
  komojuPaymentId: string | null
  komojuOrderId: string | null
  updatedAt: any
  aiConversationEnabled: boolean
  aiConversationExpiresAt: any

  // ✅ 上乗せ計算用
  purchasedDurationDays: 30 | 90 | 180
}>

type UserDoc = {
  plan?: PlanId
  entitledQuizTypes?: QuizType[]
  selectedQuizTypes?: QuizType[]
  nextChangeAllowedAt?: any
  billing?: BillingPatch
  industry?: string
}

function isPlanId(v: any): v is PlanId {
  return v === "trial" || v === "free" || v === "3" || v === "5" || v === "7"
}

function nextMonthDate(from = new Date()) {
  const d = new Date(from)
  d.setMonth(d.getMonth() + 1)
  return d
}

function toDateOrNull(value: any): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  // Firestore Timestamp 互換
  if (typeof value?.toDate === "function") {
    const d = value.toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }

  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function addDays(from: Date, days: number) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return d
}

function calcExtendedEnd(currentEnd: any, durationDays: 30 | 90 | 180) {
  const now = new Date()
  const current = toDateOrNull(currentEnd)
  const base =
    current && current.getTime() > now.getTime()
      ? current
      : now

  return addDays(base, durationDays)
}

/**
 * ✅ industry を merge 保存（決済成功後に webhook から呼ぶ）
 */
export async function setUserIndustryMerge(uid: string, industry: string) {
  const ref = adminDb().collection("users").doc(uid)
  await ref.set(
    {
      industry,
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

/**
 * ✅ billing を merge 更新
 */
export async function patchUserBilling(uid: string, patch: BillingPatch) {
  const ref = adminDb().collection("users").doc(uid)
  const snap = await ref.get()
  const current = (snap.exists ? (snap.data() as UserDoc) : {}) as UserDoc

  await ref.set(
    {
      billing: {
        ...(current.billing ?? {}),
        ...patch,
      },
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

/**
 * ✅ webhook から呼ばれるメイン
 * - billing を merge
 * - status=active & currentPlan が来た場合は
 *   entitled/selected/nextChangeAllowedAt を確定
 * - さらに purchasedDurationDays が来た場合は currentPeriodEnd を上乗せ
 */
export async function setUserBillingMerge(uid: string, patch: BillingPatch) {
  const ref = adminDb().collection("users").doc(uid)

  const snap = await ref.get()
  const current = (snap.exists ? (snap.data() as UserDoc) : {}) as UserDoc
  const currentBilling = current.billing ?? {}

  const nextBilling: BillingPatch = {
    ...currentBilling,
    ...patch,
  }

  const becomingActive = patch.status === "active"
  const nextPlan = patch.currentPlan

  // ✅ 再購入時の期限上乗せ
  if (becomingActive && patch.purchasedDurationDays) {
    nextBilling.currentPeriodEnd = calcExtendedEnd(
      currentBilling.currentPeriodEnd,
      patch.purchasedDurationDays
    )

    if (patch.aiConversationEnabled) {
      nextBilling.aiConversationEnabled = true
      nextBilling.aiConversationExpiresAt = calcExtendedEnd(
        currentBilling.aiConversationExpiresAt,
        patch.purchasedDurationDays
      )
    } else if (patch.aiConversationEnabled === false) {
      // 明示的に false が来たら無効化はする
      nextBilling.aiConversationEnabled = false
      nextBilling.aiConversationExpiresAt = null
    }
  }

  const next: any = {
    billing: nextBilling,
    updatedAt: new Date(),
  }

  // ✅ 有料プラン確定時に entitlements を確定
  if (
    becomingActive &&
    isPlanId(nextPlan) &&
    (nextPlan === "3" || nextPlan === "5" || nextPlan === "7")
  ) {
    const entitled = buildEntitledQuizTypes(nextPlan)

    const selected = normalizeSelectedForPlan(
      (current.selectedQuizTypes ?? []) as QuizType[],
      entitled,
      nextPlan
    )

    next.entitledQuizTypes = entitled
    next.selectedQuizTypes = selected
    next.nextChangeAllowedAt = nextMonthDate()
    next.plan = nextPlan
  }

  await ref.set(next, { merge: true })
}
