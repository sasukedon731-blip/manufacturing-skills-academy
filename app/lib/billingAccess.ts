// app/lib/billingAccess.ts

export type BillingLike = Partial<{
  status: "pending" | "active" | "past_due" | "canceled"
  currentPlan: "trial" | "free" | "3" | "5" | "7"
  currentPeriodEnd: any
  aiConversationEnabled: boolean
  aiConversationExpiresAt: any
}>

function toDate(value: any): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value?.toDate === "function") {
    const d = value.toDate()
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000)
  }

  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isBillingActive(billing?: BillingLike | null) {
  if (!billing) return false
  if (billing.status !== "active") return false

  const end = toDate(billing.currentPeriodEnd)
  if (!end) return false

  return end.getTime() > Date.now()
}

export function canUseAiConversation(billing?: BillingLike | null) {
  if (!billing) return false
  if (!billing.aiConversationEnabled) return false
  if (billing.status !== "active") return false

  const end = toDate(billing.aiConversationExpiresAt)
  if (!end) return false

  return end.getTime() > Date.now()
}

export function getBillingDaysLeft(billing?: BillingLike | null) {
  const end = toDate(billing?.currentPeriodEnd)
  if (!end) return 0

  const diff = end.getTime() - Date.now()
  if (diff <= 0) return 0

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getAiConversationDaysLeft(billing?: BillingLike | null) {
  const end = toDate(billing?.aiConversationExpiresAt)
  if (!end) return 0

  const diff = end.getTime() - Date.now()
  if (diff <= 0) return 0

  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getBillingEndDate(billing?: BillingLike | null) {
  return toDate(billing?.currentPeriodEnd)
}

export function getAiConversationEndDate(billing?: BillingLike | null) {
  return toDate(billing?.aiConversationExpiresAt)
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
  switch (plan) {
    case "3":
    case "5":
    case "7":
      return "基本学習プラン"
    case "trial":
      return "無料体験"
    case "free":
      return "無料プラン"
    default:
      return "未契約"
  }
}

export function formatDateJP(date?: Date | null) {
  if (!date) return "-"
  return date.toLocaleDateString("ja-JP")
}
