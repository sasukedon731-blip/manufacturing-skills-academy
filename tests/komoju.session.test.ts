import assert from "node:assert/strict"
import test from "node:test"

import { normalizeSessionState } from "../app/lib/komoju"
import { verifySessionResponse, type SessionOrder } from "../app/lib/komojuSession"

const order: SessionOrder = {
  id: "order-1",
  uid: "user-1",
  sessionId: "session12345678901234567890",
  amount: 1000,
  currency: "JPY",
  planId: "7",
  durationDays: 30,
  method: "card",
}

function session(paymentStatus: string) {
  return {
    id: order.sessionId,
    amount: order.amount,
    currency: "JPY",
    status: "completed",
    external_customer_id: order.uid,
    metadata: { uid: order.uid, order_id: order.id, plan: "7", duration_days: "30" },
    payment: { id: "payment123456789012345678", status: paymentStatus, external_order_num: order.id },
  }
}

test("return session is normalized without exposing raw response", () => {
  assert.deepEqual(verifySessionResponse(session("captured"), order), { state: "paid" })
  assert.deepEqual(Object.keys(verifySessionResponse(session("captured"), order) ?? {}), ["state"])
})

test("return session rejects another user, order, amount, plan and duration", () => {
  const mutations = [
    { ...session("captured"), external_customer_id: "other" },
    { ...session("captured"), amount: 999 },
    { ...session("captured"), metadata: { ...session("captured").metadata, uid: "other" } },
    { ...session("captured"), metadata: { ...session("captured").metadata, order_id: "other" } },
    { ...session("captured"), metadata: { ...session("captured").metadata, plan: "3" } },
    { ...session("captured"), metadata: { ...session("captured").metadata, duration_days: "90" } },
  ]
  for (const value of mutations) assert.equal(verifySessionResponse(value, order), null)
})

test("session status branches cover paid, processing, konbini, failed, cancelled and unknown", () => {
  assert.equal(normalizeSessionState("completed", "captured", "card"), "paid")
  assert.equal(normalizeSessionState("pending", "pending", "card"), "processing")
  assert.equal(normalizeSessionState("completed", "authorized", "convenience"), "konbini_waiting")
  assert.equal(normalizeSessionState("completed", "failed", "card"), "failed")
  assert.equal(normalizeSessionState("cancelled", "cancelled", "card"), "cancelled")
  assert.equal(normalizeSessionState("completed", null, "card"), "unknown")
})
