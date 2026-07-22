import {
  getNumber,
  getString,
  isDurationDays,
  isRecord,
  normalizeSessionState,
  type PaymentMethod,
  type SessionResultState,
} from "@/app/lib/komoju"

export type SessionOrder = {
  id: string
  uid: string
  sessionId: string
  amount: number
  currency: "JPY"
  planId: "7"
  durationDays: 30 | 90 | 180
  method: PaymentMethod
}

export type VerifiedSessionResult = {
  state: SessionResultState
}

export function verifySessionResponse(
  value: unknown,
  order: SessionOrder,
): VerifiedSessionResult | null {
  if (!isRecord(value)) return null
  if (getString(value, "id") !== order.sessionId) return null
  if (getNumber(value, "amount") !== order.amount) return null
  if (getString(value, "currency") !== order.currency) return null

  const externalCustomerId = getString(value, "external_customer_id")
  if (externalCustomerId && externalCustomerId !== order.uid) return null

  const metadata = isRecord(value.metadata) ? value.metadata : {}
  if (getString(metadata, "uid") !== order.uid) return null
  if (getString(metadata, "order_id") !== order.id) return null
  if (getString(metadata, "plan") !== order.planId) return null
  if (getString(metadata, "duration_days") !== String(order.durationDays)) return null

  const payment = isRecord(value.payment) ? value.payment : null
  if (payment) {
    const externalOrder = getString(payment, "external_order_num")
    if (externalOrder && externalOrder !== order.id) return null
  }

  return {
    state: normalizeSessionState(
      getString(value, "status"),
      payment ? getString(payment, "status") : null,
      order.method,
    ),
  }
}

export function parseSessionOrder(id: string, uid: string, value: unknown): SessionOrder | null {
  if (!isRecord(value)) return null
  const sessionId =
    getString(value, "sessionId") ?? getString(value, "komojuSessionId")
  const planId = getString(value, "planId") ?? getString(value, "plan")
  const amount = getNumber(value, "amount")
  const durationDays = getNumber(value, "durationDays")
  const method = getString(value, "method")
  if (
    !sessionId ||
    getString(value, "uid") !== uid ||
    planId !== "7" ||
    amount === null ||
    amount <= 0 ||
    !isDurationDays(durationDays) ||
    (method !== "card" && method !== "convenience")
  ) {
    return null
  }
  return {
    id,
    uid,
    sessionId,
    amount,
    currency: "JPY",
    planId,
    durationDays,
    method,
  }
}
