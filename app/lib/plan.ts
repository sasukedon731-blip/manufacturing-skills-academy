import { quizzes } from "@/app/data/quizzes"
import type { QuizType } from "@/app/data/types"
import { isCompanyAccount } from "@/app/lib/account"

export type PlanId = "trial" | "free" | "3" | "5" | "7"
export type SelectLimit = number | "ALL"

const ALL_MANUFACTURING_QUIZ_TYPES: QuizType[] = Object.keys(quizzes) as QuizType[]

export function getSelectLimit(plan: PlanId): SelectLimit {
  // 製造版は「1日無料体験中は通常学習を一通り触れる」設計。
  // 旧N4固定の原因になる 1教材制限はここで廃止する。
  if (plan === "trial" || plan === "free") return "ALL"
  return "ALL"
}

export function buildEntitledQuizTypes(_plan: PlanId): QuizType[] {
  // 製造アプリでは、教材の表示・利用可否は課金状態/無料体験期間で制御する。
  // planから教材を削ると、trialユーザーがN4だけに固定されるため全教材を返す。
  return ALL_MANUFACTURING_QUIZ_TYPES
}

export function normalizeSelectedForPlan(
  selected: QuizType[],
  entitled: QuizType[],
  plan: PlanId
): QuizType[] {
  const uniq = Array.from(new Set(selected)).filter((q) => entitled.includes(q))
  const limit = getSelectLimit(plan)

  if (limit === "ALL") {
    // 初期状態は製造アプリらしく全教材を選択済みにする。
    // 既存ユーザーがN4だけでも、自動修復で全教材へ広げる。
    return entitled
  }

  const trimmed = uniq.slice(0, limit)

  if (trimmed.length < limit) {
    for (const q of entitled) {
      if (trimmed.length >= limit) break
      if (!trimmed.includes(q)) trimmed.push(q)
    }
  }

  return trimmed
}

export type BillingStatus = "trialing" | "pending" | "active" | "past_due" | "canceled" | "inactive"
export type BillingMethod = "convenience" | "card" | "bank_transfer"
export type AccountType = "personal" | "company"

export function getBillingStatus(userDoc: any): BillingStatus {
  if (!userDoc) return "inactive"
  if (isCompanyAccount(userDoc)) return "active"

  const s = userDoc?.billing?.status
  if (s === "pending" || s === "active" || s === "past_due" || s === "canceled") return s

  const trialEnd = toDate(userDoc.trialEndsAt)
  if ((userDoc.plan === "trial" || !userDoc.plan) && trialEnd && trialEnd.getTime() > Date.now()) {
    return "trialing"
  }
  return "inactive"
}

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === "function") return value.toDate()
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isAccessActive(userDoc: any): boolean {
  if (!userDoc) return false

  // 企業コード登録ユーザーは企業契約扱い。
  if (isCompanyAccount(userDoc)) return true

  // 有料billingがある場合。
  if (userDoc.billing?.status) {
    if (getBillingStatus(userDoc) !== "active") return false
    const end = toDate(userDoc?.billing?.currentPeriodEnd)
    return end ? end.getTime() > Date.now() : true
  }

  // 無料体験。trialEndsAtが無い既存データは移行中のため許可。
  if (userDoc.plan === "trial" || !userDoc.plan) {
    const trialEnd = toDate(userDoc.trialEndsAt)
    return trialEnd ? trialEnd.getTime() > Date.now() : false
  }

  return false
}

export function getEffectivePlanId(userDoc: any): PlanId {
  const p = userDoc?.billing?.currentPlan ?? userDoc?.plan
  return p === "trial" || p === "free" || p === "3" || p === "5" || p === "7"
    ? p
    : "trial"
}
