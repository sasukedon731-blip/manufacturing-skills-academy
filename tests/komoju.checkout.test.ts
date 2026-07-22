import assert from "node:assert/strict"
import test from "node:test"

import { calculateCheckoutAmount, parseCheckoutSelection } from "../app/lib/komoju"

test("checkout amounts are server-defined for 30/90/180 days", () => {
  assert.deepEqual(calculateCheckoutAmount(30, false), { baseAmount: 500, aiAmount: 0, total: 500 })
  assert.deepEqual(calculateCheckoutAmount(90, false), { baseAmount: 1500, aiAmount: 0, total: 1500 })
  assert.deepEqual(calculateCheckoutAmount(180, false), { baseAmount: 3000, aiAmount: 0, total: 3000 })
  assert.deepEqual(calculateCheckoutAmount(30, true), { baseAmount: 500, aiAmount: 500, total: 1000 })
  assert.deepEqual(calculateCheckoutAmount(90, true), { baseAmount: 1500, aiAmount: 1500, total: 3000 })
  assert.deepEqual(calculateCheckoutAmount(180, true), { baseAmount: 3000, aiAmount: 3000, total: 6000 })
})

test("checkout rejects invalid plan, method and duration and ignores client amount", () => {
  const base = { idToken: "token", plan: "7", method: "card", durationDays: 30, industry: "manufacturing" }
  assert.equal(parseCheckoutSelection({ ...base, plan: "3" }), null)
  assert.equal(parseCheckoutSelection({ ...base, method: "cash" }), null)
  assert.equal(parseCheckoutSelection({ ...base, durationDays: 31 }), null)
  const parsed = parseCheckoutSelection({ ...base, amount: 1, uid: "attacker", addAiConversation: true })
  assert.ok(parsed)
  assert.equal("amount" in parsed, false)
  assert.equal("uid" in parsed, false)
})
