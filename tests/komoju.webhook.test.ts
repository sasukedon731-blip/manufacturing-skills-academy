import assert from "node:assert/strict"
import crypto from "node:crypto"
import test, { after, beforeEach } from "node:test"
import { deleteApp, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

import { isValidWebhookSignature, type KomojuEvent } from "../app/lib/komoju"
import { processKomojuWebhookEvent } from "../app/lib/komojuWebhook"

const projectId = "demo-manufacturing-skills-academy"
const app = getApps().find((item) => item.name === "komoju-tests") ?? initializeApp({ projectId }, "komoju-tests")
const db = getFirestore(app)
const now = new Date("2026-07-22T00:00:00.000Z")

after(async () => deleteApp(app))
beforeEach(async () => clearFirestore(db))

async function clearFirestore(firestore: Firestore) {
  for (const name of ["paymentOrders", "users"]) {
    const snapshot = await firestore.collection(name).get()
    await Promise.all(snapshot.docs.map((document) => document.ref.delete()))
  }
}

async function seed(orderId = "order-1", uid = "user-1", paymentId: string | null = null) {
  await db.collection("users").doc(uid).set({
    uid,
    accountType: "personal",
    selectedQuizTypes: [],
    billing: {},
  })
  await db.collection("paymentOrders").doc(orderId).set({
    orderId,
    uid,
    plan: "7",
    planId: "7",
    method: "card",
    durationDays: 30,
    amount: 500,
    status: "pending",
    sessionId: `session-${orderId}`,
    komojuSessionId: `session-${orderId}`,
    paymentId,
    komojuPaymentId: paymentId,
    addAiConversation: false,
    processedEventIds: [],
    entitlementAppliedAt: null,
  })
}

function event(type: string, id = "payment-1", status = type.replace("payment.", "")): KomojuEvent {
  return { id: `event-${type}-${id}`, type, data: { id, status, amount: 500, external_order_num: "order-1" } }
}

test("missing and invalid signatures are rejected; valid signature is accepted", () => {
  const raw = JSON.stringify(event("payment.captured"))
  const secret = "test-webhook-secret"
  const signature = crypto.createHmac("sha256", secret).update(raw).digest("hex")
  assert.equal(isValidWebhookSignature(raw, null, secret), false)
  assert.equal(isValidWebhookSignature(raw, "00", secret), false)
  assert.equal(isValidWebhookSignature(raw, signature, secret), true)
})

test("unknown order and unknown event are safely ignored", async () => {
  assert.equal((await processKomojuWebhookEvent(db, "missing", event("payment.captured"), "d1", now)).outcome, "ignored")
  await seed()
  assert.equal((await processKomojuWebhookEvent(db, "order-1", event("customer.created"), "d2", now)).outcome, "ignored")
})

test("captured applies entitlement exactly once for duplicate deliveries", async () => {
  await seed()
  const captured = event("payment.captured", "payment-1", "captured")
  assert.equal((await processKomojuWebhookEvent(db, "order-1", captured, "delivery-1", now)).outcome, "applied")
  const firstEnd = (await db.collection("users").doc("user-1").get()).data()?.billing.currentPeriodEnd.toDate()
  assert.equal((await processKomojuWebhookEvent(db, "order-1", captured, "delivery-1", now)).outcome, "duplicate")
  assert.equal((await processKomojuWebhookEvent(db, "order-1", captured, "delivery-2", now)).outcome, "duplicate")
  const secondEnd = (await db.collection("users").doc("user-1").get()).data()?.billing.currentPeriodEnd.toDate()
  assert.equal(firstEnd.toISOString(), secondEnd.toISOString())
})

test("parallel captured deliveries apply entitlement once", async () => {
  await seed()
  const captured = event("payment.captured", "payment-1", "captured")
  const results = await Promise.all([
    processKomojuWebhookEvent(db, "order-1", captured, "parallel-1", now),
    processKomojuWebhookEvent(db, "order-1", captured, "parallel-2", now),
  ])
  assert.equal(results.filter((result) => result.outcome === "applied").length, 1)
  const order = (await db.collection("paymentOrders").doc("order-1").get()).data()
  assert.equal(order?.status, "captured")
  assert.ok(order?.entitlementAppliedAt)
})

test("different payment IDs on separate orders are processed separately", async () => {
  await seed("order-1", "user-1")
  await seed("order-2", "user-2")
  await processKomojuWebhookEvent(db, "order-1", event("payment.captured", "payment-1", "captured"), "a", now)
  await processKomojuWebhookEvent(db, "order-2", event("payment.captured", "payment-2", "captured"), "b", now)
  assert.equal((await db.collection("paymentOrders").doc("order-1").get()).data()?.status, "captured")
  assert.equal((await db.collection("paymentOrders").doc("order-2").get()).data()?.status, "captured")
})

test("company account billing is not changed", async () => {
  await seed()
  await db.collection("users").doc("user-1").set({ accountType: "company", companyCode: "COMPANY" }, { merge: true })
  await processKomojuWebhookEvent(db, "order-1", event("payment.captured", "payment-1", "captured"), "company", now)
  const user = (await db.collection("users").doc("user-1").get()).data()
  assert.equal(user?.billing.status, undefined)
})

test("official non-capture states and full refund are recorded safely", async () => {
  const cases = [
    ["payment.authorized", "authorized"],
    ["payment.updated", "pending"],
    ["payment.failed", "failed"],
    ["payment.cancelled", "cancelled"],
    ["payment.expired", "expired"],
  ] as const
  for (const [type, status] of cases) {
    await clearFirestore(db)
    await seed()
    await db.collection("users").doc("user-1").set(
      { billing: { status: "pending", komojuOrderId: "order-1" } },
      { merge: true },
    )
    await processKomojuWebhookEvent(db, "order-1", event(type, "payment-1", status), type, now)
    assert.equal((await db.collection("paymentOrders").doc("order-1").get()).data()?.status, status)
    const billingStatus = (await db.collection("users").doc("user-1").get()).data()?.billing.status
    assert.equal(
      billingStatus,
      status === "failed" ? "past_due" : status === "cancelled" || status === "expired" ? "canceled" : "pending",
    )
  }
  await clearFirestore(db)
  await seed()
  await processKomojuWebhookEvent(db, "order-1", event("payment.refunded", "payment-1", "refunded"), "refund", now)
  const refunded = (await db.collection("paymentOrders").doc("order-1").get()).data()
  assert.equal(refunded?.status, "refunded")
  assert.equal(refunded?.refundDisposition, "review_required")
  assert.equal((await db.collection("users").doc("user-1").get()).data()?.billing.status, undefined)
})

test("legacy captured order without marker is not added again", async () => {
  await seed()
  await db.collection("paymentOrders").doc("order-1").set({ status: "captured", entitlementAppliedAt: null }, { merge: true })
  const result = await processKomojuWebhookEvent(db, "order-1", event("payment.captured", "payment-1", "captured"), "legacy", now)
  assert.equal(result.outcome, "review_required")
  assert.equal((await db.collection("users").doc("user-1").get()).data()?.billing.currentPeriodEnd, undefined)
})

test("a new purchase is held for review while an older refund is unresolved", async () => {
  await seed("old-order", "user-1")
  await db.collection("paymentOrders").doc("old-order").set(
    { status: "refunded", refundDisposition: "review_required" },
    { merge: true },
  )
  await db.collection("paymentOrders").doc("order-1").set({
    orderId: "order-1",
    uid: "user-1",
    plan: "7",
    method: "card",
    durationDays: 30,
    amount: 500,
    status: "pending",
    processedEventIds: [],
  })
  const result = await processKomojuWebhookEvent(
    db,
    "order-1",
    event("payment.captured", "payment-new", "captured"),
    "after-refund",
    now,
  )
  assert.equal(result.outcome, "review_required")
  assert.equal((await db.collection("users").doc("user-1").get()).data()?.billing.currentPeriodEnd, undefined)
})
