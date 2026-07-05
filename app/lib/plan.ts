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

export function getBillingStatus(userDoc: any): BillingStatus {
  const s = userDoc?.billing?.status
  if (s === "pending" || s === "active" || s === "past_due" || s === "canceled") return s
  return "active"
}

export function isAccessActive(userDoc: any): boolean {
  if (getBillingStatus(userDoc) !== "active") return false

  const end = userDoc?.billing?.currentPeriodEnd
  if (!end) return true

  try {
    const endDate = typeof end?.toDate === "function" ? end.toDate() : new Date(end)
    return endDate.getTime() > Date.now()
  } catch {
    return false
  }
}

export function getEffectivePlanId(userDoc: any): PlanId {
  const p = userDoc?.billing?.currentPlan ?? userDoc?.plan
  return p === "trial" || p === "free" || p === "3" || p === "5" || p === "7"
    ? p
    : "trial"
}
