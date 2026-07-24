export type DateLike =
  | Date
  | string
  | number
  | { seconds?: number; toDate?: () => Date }
  | null

export type BillingLike = Partial<{
  status: "pending" | "active" | "past_due" | "canceled"
  currentPlan: "trial" | "free" | "3" | "5" | "7"
  currentPeriodEnd: DateLike
  aiConversationEnabled: boolean
  aiConversationExpiresAt: DateLike
}>

export type AccountUsageInput = {
  isCompany: boolean
  billing?: BillingLike | null
  trialEndsAt?: DateLike
}

export type PeriodView = {
  end: Date | null
  remainingDays: number
  remainingHours: number
  active: boolean
  expiringSoon: boolean
}

export type AccountUsageView = {
  kind: "company" | "active" | "expired" | "pending" | "past_due" | "canceled" | "trial" | "trial_expired" | "none"
  plan: PeriodView
  ai: PeriodView & { enabled: boolean }
  trial: PeriodView
}

export function normalizeDate(value: DateLike | unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === "object" && value !== null) {
    if ("toDate" in value && typeof value.toDate === "function") {
      const date = value.toDate()
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
    }
    if ("seconds" in value && typeof value.seconds === "number" && Number.isFinite(value.seconds)) {
      const date = new Date(value.seconds * 1000)
      return Number.isNaN(date.getTime()) ? null : date
    }
    return null
  }
  if (typeof value !== "string" && typeof value !== "number") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getPeriodView(value: DateLike | unknown, nowMs = Date.now()): PeriodView {
  const end = normalizeDate(value)
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now()
  if (!end) return { end: null, remainingDays: 0, remainingHours: 0, active: false, expiringSoon: false }
  const diff = end.getTime() - safeNow
  if (!Number.isFinite(diff) || diff <= 0) {
    return { end, remainingDays: 0, remainingHours: 0, active: false, expiringSoon: false }
  }
  const remainingDays = Math.max(1, Math.ceil(diff / 86_400_000))
  const remainingHours = Math.max(1, Math.ceil(diff / 3_600_000))
  return { end, remainingDays, remainingHours, active: true, expiringSoon: remainingDays <= 7 }
}

export function getAccountUsageView(input: AccountUsageInput, nowMs = Date.now()): AccountUsageView {
  const plan = getPeriodView(input.billing?.currentPeriodEnd, nowMs)
  const aiPeriod = getPeriodView(input.billing?.aiConversationExpiresAt, nowMs)
  const trial = getPeriodView(input.trialEndsAt, nowMs)
  const ai = { ...aiPeriod, enabled: input.billing?.aiConversationEnabled === true && aiPeriod.active }

  let kind: AccountUsageView["kind"]
  if (input.isCompany) kind = "company"
  else if (input.billing?.status === "active" && plan.active) kind = "active"
  else if (input.billing?.status === "active") kind = "expired"
  else if (input.billing?.status === "pending") kind = "pending"
  else if (input.billing?.status === "past_due") kind = "past_due"
  else if (input.billing?.status === "canceled") kind = "canceled"
  else if (trial.active) kind = "trial"
  else if (normalizeDate(input.trialEndsAt)) kind = "trial_expired"
  else kind = "none"

  return { kind, plan, ai, trial }
}

export function isBillingActive(billing?: BillingLike | null) {
  return billing?.status === "active" && getPeriodView(billing.currentPeriodEnd).active
}

export function canUseAiConversation(billing?: BillingLike | null) {
  return billing?.status === "active" && billing.aiConversationEnabled === true && getPeriodView(billing.aiConversationExpiresAt).active
}

export function getBillingDaysLeft(billing?: BillingLike | null) {
  return getPeriodView(billing?.currentPeriodEnd).remainingDays
}

export function getAiConversationDaysLeft(billing?: BillingLike | null) {
  return getPeriodView(billing?.aiConversationExpiresAt).remainingDays
}

export function getBillingEndDate(billing?: BillingLike | null) {
  return normalizeDate(billing?.currentPeriodEnd)
}

export function getAiConversationEndDate(billing?: BillingLike | null) {
  return normalizeDate(billing?.aiConversationExpiresAt)
}

export function getBillingViewState(billing?: BillingLike | null) {
  if (!billing) return "none" as const
  if (billing.status === "pending") return "pending" as const
  if (billing.status === "past_due") return "past_due" as const
  if (billing.status === "canceled") return "canceled" as const
  if (isBillingActive(billing)) return "active" as const
  return "expired" as const
}

export function getPlanLabel(plan?: string | null) {
  if (plan === "3" || plan === "5" || plan === "7") return "基本学習プラン"
  if (plan === "trial") return "無料体験"
  if (plan === "free") return "無料プラン"
  return "未契約"
}

export function formatDateJP(date?: Date | null) {
  if (!date || Number.isNaN(date.getTime())) return "日時を確認できません"
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}
