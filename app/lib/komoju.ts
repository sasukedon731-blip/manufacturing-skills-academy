import crypto from "crypto"

export type DurationDays = 30 | 90 | 180
export type PaymentMethod = "convenience" | "card"
export type IndustryId = "construction" | "manufacturing" | "care" | "driver" | "undecided"
export type CheckoutSelection = {
  idToken: string
  plan: "7"
  method: PaymentMethod
  durationDays: DurationDays
  industry: IndustryId
  addAiConversation: boolean
}
export type KomojuPaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded"

export type KomojuEvent = {
  id?: string
  type?: string
  data?: Record<string, unknown>
}

export type SessionResultState =
  | "paid"
  | "processing"
  | "konbini_waiting"
  | "failed"
  | "cancelled"
  | "unknown"

export const BASE_PRICE_TABLE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
}

export const AI_ADDON_PRICE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isDurationDays(value: unknown): value is DurationDays {
  return value === 30 || value === 90 || value === 180
}

export function calculateCheckoutAmount(durationDays: DurationDays, addAi: boolean) {
  const baseAmount = BASE_PRICE_TABLE[durationDays]
  const aiAmount = addAi ? AI_ADDON_PRICE[durationDays] : 0
  return { baseAmount, aiAmount, total: baseAmount + aiAmount }
}

export function parseCheckoutSelection(value: unknown): CheckoutSelection | null {
  if (!isRecord(value)) return null
  const industry = value.industry
  const validIndustry =
    industry === "construction" ||
    industry === "manufacturing" ||
    industry === "care" ||
    industry === "driver" ||
    industry === "undecided"
  if (
    typeof value.idToken !== "string" ||
    value.plan !== "7" ||
    (value.method !== "convenience" && value.method !== "card") ||
    !isDurationDays(value.durationDays)
  ) {
    return null
  }
  return {
    idToken: value.idToken,
    plan: "7",
    method: value.method,
    durationDays: value.durationDays,
    industry: validIndustry ? industry : "manufacturing",
    addAiConversation: value.addAiConversation === true,
  }
}

export function verifyKomojuSignature(rawBody: string, signature: string, secret: string) {
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  const expected = Buffer.from(computed, "hex")
  const supplied = Buffer.from(signature, "hex")
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied)
}

export function isValidWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  return !!signature && verifyKomojuSignature(rawBody, signature, secret)
}

export function getString(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? record[key] : null
}

export function getNumber(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "number" && Number.isFinite(record[key])
    ? record[key]
    : null
}

export function buildEventKey(
  event: KomojuEvent,
  deliveryId: string | null,
  orderId: string,
) {
  if (deliveryId) return `delivery:${deliveryId}`
  if (event.id) return `event:${event.id}`
  const data = event.data ?? {}
  return [
    event.type ?? "unknown",
    getString(data, "id") ?? "no-payment",
    orderId,
    getString(data, "status") ?? "no-status",
  ].join(":")
}

export function isKomojuResourceId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{20,40}$/i.test(value)
}

export function normalizeSessionState(
  sessionStatus: string | null,
  paymentStatus: string | null,
  method: PaymentMethod,
): SessionResultState {
  if (paymentStatus === "captured") return "paid"
  if (paymentStatus === "authorized") {
    return method === "convenience" ? "konbini_waiting" : "processing"
  }
  if (paymentStatus === "pending" || sessionStatus === "pending") return "processing"
  if (paymentStatus === "failed") return "failed"
  if (
    paymentStatus === "cancelled" ||
    paymentStatus === "expired" ||
    sessionStatus === "cancelled"
  ) {
    return "cancelled"
  }
  return "unknown"
}
