import type { Firestore } from "firebase-admin/firestore"

import { buildEntitledQuizTypes, normalizeSelectedForPlan } from "@/app/lib/plan"
import { isCompanyAccount } from "@/app/lib/account"
import {
  buildEventKey,
  getNumber,
  getString,
  isDurationDays,
  type KomojuEvent,
} from "@/app/lib/komoju"
import type { QuizType } from "@/app/data/types"

type StoredOrder = {
  uid?: string
  plan?: string
  planId?: string
  method?: string
  durationDays?: number
  amount?: number
  addAiConversation?: boolean
  status?: string
  komojuSessionId?: string | null
  sessionId?: string | null
  komojuPaymentId?: string | null
  paymentId?: string | null
  entitlementAppliedAt?: unknown
  processedEventIds?: unknown
}

type StoredUser = {
  accountType?: string
  companyCode?: string | null
  billing?: Record<string, unknown>
  selectedQuizTypes?: QuizType[]
}

type WebhookResult = {
  outcome: "applied" | "duplicate" | "updated" | "ignored" | "review_required"
  orderId: string
}

const OFFICIAL_EVENTS = new Set([
  "payment.authorized",
  "payment.captured",
  "payment.updated",
  "payment.expired",
  "payment.cancelled",
  "payment.refund.created",
  "payment.refunded",
  "payment.failed",
])

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    const date = value.toDate()
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function addDays(from: Date, days: number) {
  const next = new Date(from)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function processedIds(order: StoredOrder) {
  return Array.isArray(order.processedEventIds)
    ? order.processedEventIds.filter((value): value is string => typeof value === "string")
    : []
}

function withEvent(ids: string[], eventKey: string) {
  return [...new Set([...ids, eventKey])].slice(-100)
}

function nextOrderFields(
  orderId: string,
  order: StoredOrder,
  eventKey: string,
  paymentId: string | null,
  now: Date,
) {
  return {
    orderId,
    uid: order.uid,
    sessionId: order.sessionId ?? order.komojuSessionId ?? null,
    paymentId: paymentId ?? order.paymentId ?? order.komojuPaymentId ?? null,
    planId: order.planId ?? order.plan ?? "7",
    durationDays: order.durationDays ?? null,
    amount: order.amount ?? null,
    processedEventIds: withEvent(processedIds(order), eventKey),
    updatedAt: now,
  }
}

export function isOfficialPaymentEvent(eventType: string) {
  return OFFICIAL_EVENTS.has(eventType)
}

export async function processKomojuWebhookEvent(
  db: Firestore,
  orderId: string,
  event: KomojuEvent,
  deliveryId: string | null,
  now = new Date(),
): Promise<WebhookResult> {
  const eventType = event.type ?? ""
  if (!isOfficialPaymentEvent(eventType)) return { outcome: "ignored", orderId }

  const data = event.data ?? {}
  const paymentId = getString(data, "id")
  const paymentStatus = getString(data, "status")
  const eventKey = buildEventKey(event, deliveryId, orderId)
  const orderRef = db.collection("paymentOrders").doc(orderId)

  return db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef)
    if (!orderSnapshot.exists) return { outcome: "ignored", orderId }

    const order = orderSnapshot.data() as StoredOrder
    if (!order.uid) {
      transaction.set(
        orderRef,
        {
          status: "review_required",
          reviewRequiredReason: "missing_uid",
          ...nextOrderFields(orderId, order, eventKey, paymentId, now),
        },
        { merge: true },
      )
      return { outcome: "review_required", orderId }
    }

    const ids = processedIds(order)
    if (ids.includes(eventKey)) return { outcome: "duplicate", orderId }

    const userRef = db.collection("users").doc(order.uid)
    const userSnapshot = await transaction.get(userRef)
    const user = (userSnapshot.exists ? userSnapshot.data() : {}) as StoredUser
    const common = nextOrderFields(orderId, order, eventKey, paymentId, now)

    if (isCompanyAccount(user)) {
      transaction.set(
        orderRef,
        { ...common, status: "ignored_company_account" },
        { merge: true },
      )
      return { outcome: "ignored", orderId }
    }

    const storedPaymentId = order.paymentId ?? order.komojuPaymentId ?? null
    if (storedPaymentId && paymentId && storedPaymentId !== paymentId) {
      transaction.set(
        orderRef,
        {
          ...common,
          status: "review_required",
          reviewRequiredReason: "payment_id_mismatch",
        },
        { merge: true },
      )
      return { outcome: "review_required", orderId }
    }

    if (eventType === "payment.captured") {
      if (order.entitlementAppliedAt) return { outcome: "duplicate", orderId }
      if (order.status === "captured") {
        transaction.set(
          orderRef,
          {
            ...common,
            status: "review_required",
            reviewRequiredReason: "legacy_captured_without_entitlement_marker",
          },
          { merge: true },
        )
        return { outcome: "review_required", orderId }
      }

      const durationDays = order.durationDays
      const amount = order.amount
      const eventAmount = getNumber(data, "amount")
      if (
        !isDurationDays(durationDays) ||
        typeof amount !== "number" ||
        amount <= 0 ||
        (eventAmount !== null && eventAmount !== amount)
      ) {
        transaction.set(
          orderRef,
          {
            ...common,
            status: "review_required",
            reviewRequiredReason: "invalid_or_mismatched_order_amount",
          },
          { merge: true },
        )
        return { outcome: "review_required", orderId }
      }

      const userOrders = await transaction.get(
        db.collection("paymentOrders").where("uid", "==", order.uid),
      )
      const unresolvedRefund = userOrders.docs.some((document) => {
        if (document.id === orderId) return false
        const value = document.data()
        return value.status === "refunded" || value.refundDisposition === "review_required"
      })
      if (unresolvedRefund) {
        transaction.set(
          orderRef,
          {
            ...common,
            status: "review_required",
            reviewRequiredReason: "unresolved_refund_before_entitlement_extension",
          },
          { merge: true },
        )
        return { outcome: "review_required", orderId }
      }

      const billing = user.billing ?? {}
      const currentEnd = toDate(billing.currentPeriodEnd)
      const base = currentEnd && currentEnd > now ? currentEnd : now
      const addAi = order.addAiConversation === true
      const currentAiEnd = toDate(billing.aiConversationExpiresAt)
      const aiBase = currentAiEnd && currentAiEnd > now ? currentAiEnd : now
      const nextBilling: Record<string, unknown> = {
        ...billing,
        accountType: "personal",
        method: order.method === "convenience" ? "convenience" : "card",
        status: "active",
        currentPlan: "7",
        currentPeriodEnd: addDays(base, durationDays),
        purchasedDurationDays: durationDays,
        komojuPaymentId: paymentId,
        komojuSessionId: order.sessionId ?? order.komojuSessionId ?? null,
        komojuOrderId: orderId,
      }
      if (addAi) {
        nextBilling.aiConversationEnabled = true
        nextBilling.aiConversationExpiresAt = addDays(aiBase, durationDays)
      }

      const entitled = buildEntitledQuizTypes("7")
      const selected = normalizeSelectedForPlan(
        user.selectedQuizTypes ?? [],
        entitled,
        "7",
      )
      transaction.set(
        userRef,
        {
          billing: nextBilling,
          plan: "7",
          entitledQuizTypes: entitled,
          selectedQuizTypes: selected,
          updatedAt: now,
        },
        { merge: true },
      )
      transaction.set(
        orderRef,
        {
          ...common,
          status: "captured",
          capturedAt: now,
          entitlementAppliedAt: now,
          rawStatus: paymentStatus,
        },
        { merge: true },
      )
      return { outcome: "applied", orderId }
    }

    if (eventType === "payment.refunded") {
      transaction.set(
        orderRef,
        {
          ...common,
          status: "refunded",
          refundedAt: now,
          refundDisposition: "review_required",
          reviewRequiredReason: "recalculate_entitlements_without_revoking_other_orders",
          rawStatus: paymentStatus,
        },
        { merge: true },
      )
      return { outcome: "review_required", orderId }
    }

    if (eventType === "payment.refund.created") {
      transaction.set(
        orderRef,
        {
          ...common,
          status: "review_required",
          refundRequestedAt: now,
          reviewRequiredReason: "partial_or_pending_refund",
          rawStatus: paymentStatus,
        },
        { merge: true },
      )
      return { outcome: "review_required", orderId }
    }

    const directStatus: Record<string, string> = {
      "payment.authorized": "authorized",
      "payment.failed": "failed",
      "payment.cancelled": "cancelled",
      "payment.expired": "expired",
    }
    const status = directStatus[eventType]
    if (status) {
      transaction.set(orderRef, { ...common, status, rawStatus: paymentStatus }, { merge: true })
      const billing = user.billing ?? {}
      if (billing.komojuOrderId === orderId && billing.status !== "active") {
        const billingStatus = status === "failed"
          ? "past_due"
          : status === "cancelled" || status === "expired"
            ? "canceled"
            : "pending"
        transaction.set(
          userRef,
          { billing: { ...billing, status: billingStatus }, updatedAt: now },
          { merge: true },
        )
      }
      return { outcome: "updated", orderId }
    }

    if (eventType === "payment.updated") {
      const safeStatus = paymentStatus === "pending" || paymentStatus === "authorized"
        ? paymentStatus
        : order.status ?? "pending"
      transaction.set(
        orderRef,
        { ...common, status: safeStatus, rawStatus: paymentStatus },
        { merge: true },
      )
      const billing = user.billing ?? {}
      if (
        billing.komojuOrderId === orderId &&
        billing.status !== "active" &&
        (paymentStatus === "pending" || paymentStatus === "authorized")
      ) {
        transaction.set(
          userRef,
          { billing: { ...billing, status: "pending" }, updatedAt: now },
          { merge: true },
        )
      }
      return { outcome: "updated", orderId }
    }

    return { outcome: "ignored", orderId }
  })
}
