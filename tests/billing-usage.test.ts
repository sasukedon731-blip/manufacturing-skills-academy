import assert from "node:assert/strict"
import test from "node:test"

import { getAccountUsageView, getPeriodView, normalizeDate } from "../app/lib/billingAccess"

const now = Date.parse("2026-07-24T00:00:00.000Z")
const afterDays = (days: number) => new Date(now + days * 86_400_000)

test("30, 90 and 180 day purchases use the actual stored deadline", () => {
  for (const days of [30, 90, 180]) {
    const view = getPeriodView(afterDays(days), now)
    assert.equal(view.active, true)
    assert.equal(view.remainingDays, days)
  }
})

test("less than one day remains one day, exact deadline and expired are zero", () => {
  assert.equal(getPeriodView(new Date(now + 1), now).remainingDays, 1)
  assert.equal(getPeriodView(new Date(now), now).active, false)
  assert.equal(getPeriodView(new Date(now - 1), now).remainingDays, 0)
})

test("invalid and missing dates do not produce Invalid Date", () => {
  assert.equal(normalizeDate("not-a-date"), null)
  assert.equal(getPeriodView(undefined, now).end, null)
  assert.equal(getPeriodView({ seconds: Number.NaN }, now).end, null)
})

test("Timestamp, seconds, ISO string and Date formats are normalized", () => {
  const expected = afterDays(30).getTime()
  assert.equal(normalizeDate({ toDate: () => afterDays(30) })?.getTime(), expected)
  assert.equal(normalizeDate({ seconds: expected / 1000 })?.getTime(), expected)
  assert.equal(normalizeDate(afterDays(30).toISOString())?.getTime(), expected)
  assert.equal(normalizeDate(afterDays(30))?.getTime(), expected)
})

test("pending payment never displays purchased duration", () => {
  const usage = getAccountUsageView({
    isCompany: false,
    billing: { status: "pending", currentPeriodEnd: afterDays(30) },
  }, now)
  assert.equal(usage.kind, "pending")
})

test("active billing with an exact, expired, invalid or missing deadline is expired", () => {
  for (const currentPeriodEnd of [new Date(now), new Date(now - 1), "invalid", undefined]) {
    const usage = getAccountUsageView({
      isCompany: false,
      billing: { status: "active", currentPeriodEnd },
      trialEndsAt: afterDays(1),
    }, now)
    assert.equal(usage.kind, "expired")
  }
})

test("free trial active and expired states are distinct", () => {
  const active = getAccountUsageView({ isCompany: false, trialEndsAt: new Date(now + 6 * 3_600_000) }, now)
  const expired = getAccountUsageView({ isCompany: false, trialEndsAt: new Date(now - 1) }, now)
  assert.equal(active.kind, "trial")
  assert.equal(active.trial.remainingHours, 6)
  assert.equal(expired.kind, "trial_expired")
})

test("basic-only purchase does not enable AI", () => {
  const usage = getAccountUsageView({
    isCompany: false,
    billing: { status: "active", currentPeriodEnd: afterDays(30), aiConversationEnabled: false },
  }, now)
  assert.equal(usage.kind, "active")
  assert.equal(usage.ai.enabled, false)
})

test("basic plus AI and different AI deadline are calculated independently", () => {
  const usage = getAccountUsageView({
    isCompany: false,
    billing: {
      status: "active",
      currentPeriodEnd: afterDays(90),
      aiConversationEnabled: true,
      aiConversationExpiresAt: afterDays(7),
    },
  }, now)
  assert.equal(usage.plan.remainingDays, 90)
  assert.equal(usage.ai.enabled, true)
  assert.equal(usage.ai.remainingDays, 7)
  assert.equal(usage.ai.expiringSoon, true)
})

test("company contract hides personal and trial states", () => {
  const usage = getAccountUsageView({
    isCompany: true,
    billing: { status: "active", currentPeriodEnd: afterDays(30) },
    trialEndsAt: afterDays(1),
  }, now)
  assert.equal(usage.kind, "company")
})

test("active paid contract wins over stale trial fields", () => {
  const usage = getAccountUsageView({
    isCompany: false,
    billing: { status: "active", currentPeriodEnd: afterDays(180) },
    trialEndsAt: afterDays(1),
  }, now)
  assert.equal(usage.kind, "active")
  assert.equal(usage.plan.remainingDays, 180)
})
