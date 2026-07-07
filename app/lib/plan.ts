import { quizzes } from "@/app/data/quizzes"
import type { QuizType } from "@/app/data/types"

export type PlanId = "trial" | "free" | "3" | "5" | "7"
export type SelectLimit = number

export function getSelectLimit(plan: PlanId): SelectLimit {
  if (plan === "trial" || plan === "free") return 1
  return Object.keys(quizzes).length
}

export function buildEntitledQuizTypes(plan: PlanId): QuizType[] {
  const all = Object.keys(quizzes) as QuizType[]
  if (plan === "trial" || plan === "free") return all.slice(0, 1)
  return all
}

export function normalizeSelectedForPlan(
  selected: QuizType[],
  entitled: QuizType[],
  plan: PlanId
): QuizType[] {
  const uniq = Array.from(new Set(selected)).filter((q) => entitled.includes(q))
  const limit = getSelectLimit(plan)

  if (limit <= 1) {
    return entitled.length ? [entitled[0]] : []
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

export type BillingStatus = "pending" | "active" | "past_due" | "canceled"
export type BillingMethod = "convenience" | "card" | "bank_transfer"
export type AccountType = "personal" | "company"

function toDate(value: any): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value?.toDate === "function") {
    const d = value.toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isWithinFreeTrial(userDoc: any): boolean {
  const createdAt = toDate(userDoc?.createdAt)
  if (!createdAt) return false
  const oneDayMs = 24 * 60 * 60 * 1000
  return Date.now() - createdAt.getTime() <= oneDayMs
}

export function getBillingStatus(userDoc: any): BillingStatus {
  const s = userDoc?.billing?.status
  if (s === "pending" || s === "active" || s === "past_due" || s === "canceled") return s

  // 企業コードユーザーと1日無料体験中ユーザーは画面上 active 扱い
  if (userDoc?.companyCode) return "active"
  if ((userDoc?.plan ?? "trial") === "trial" && isWithinFreeTrial(userDoc)) return "active"

  return "canceled"
}

export function isAccessActive(userDoc: any): boolean {
  if (!userDoc) return false

  // 企業コード登録ユーザーは企業契約扱い
  if (userDoc.companyCode) return true

  const billing = userDoc.billing
  if (billing?.status === "active") {
    const endDate = toDate(billing.currentPeriodEnd)
    return !!endDate && endDate.getTime() > Date.now()
  }

  // billing がまだ無い個人ユーザーは1日だけ無料体験
  if (!billing && (userDoc.plan ?? "trial") === "trial") {
    return isWithinFreeTrial(userDoc)
  }

  return false
}

export function getEffectivePlanId(userDoc: any): PlanId {
  if (userDoc?.companyCode) return "7"
  const p = userDoc?.billing?.currentPlan ?? userDoc?.plan
  return p === "trial" || p === "free" || p === "3" || p === "5" || p === "7"
    ? p
    : "trial"
}
