import { NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/app/lib/firebaseAdmin"
import { setUserBillingMerge } from "@/app/lib/billingServer"
import { isCompanyAccount } from "@/app/lib/account"
import {
  calculateCheckoutAmount,
  isRecord,
  parseCheckoutSelection,
} from "@/app/lib/komoju"

export const runtime = "nodejs"

type SessionResponse = {
  id?: string
  session_url?: string
  payment?: { id?: string }
}

const FULL_ACCESS_PLAN = "7" as const

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

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

function basicAuth(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

async function createSession(payload: Record<string, unknown>, secretKey: string) {
  const response = await fetch("https://komoju.com/api/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(secretKey),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`session_create_failed:${response.status}`)
  return (await response.json()) as SessionResponse
}

export async function POST(req: Request) {
  try {
    const body = parseCheckoutSelection(await req.json())
    if (!body) return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 })

    const decoded = await adminAuth().verifyIdToken(body.idToken)
    const userRef = adminDb().collection("users").doc(decoded.uid)
    const userSnapshot = await userRef.get()
    const userData = userSnapshot.exists ? userSnapshot.data() ?? {} : {}
    if (isCompanyAccount(userData)) {
      return NextResponse.json(
        { error: "企業契約でご利用中のため、個人向けプランの購入は必要ありません。" },
        { status: 403 },
      )
    }

    const { baseAmount, aiAmount, total } = calculateCheckoutAmount(
      body.durationDays,
      body.addAiConversation,
    )
    const orderRef = adminDb().collection("paymentOrders").doc()
    const orderId = orderRef.id
    const appUrl = requireEnv("NEXT_PUBLIC_APP_URL").replace(/\/+$/, "")
    const metadata: Record<string, string> = {
      uid: decoded.uid,
      order_id: orderId,
      plan: FULL_ACCESS_PLAN,
      duration_days: String(body.durationDays),
      method: body.method,
      industry: body.industry,
      add_ai: String(body.addAiConversation),
      app_name: "Manufacturing Skills Academy",
      product: "基本学習プラン",
      option: body.addAiConversation ? "AIオプションあり" : "AIオプションなし",
      tax_included_total: String(total),
    }
    const paymentType = body.method === "convenience" ? "konbini" : "credit_card"
    const sessionPayload: Record<string, unknown> = {
      mode: "payment",
      amount: total,
      currency: "JPY",
      return_url: `${appUrl}/plans?checkout=return`,
      external_customer_id: decoded.uid,
      payment_types: [paymentType],
      default_locale: "ja",
      payment_data: { external_order_num: orderId, capture: "auto" },
      metadata,
    }
    if (decoded.email) sessionPayload.email = decoded.email
    if (decoded.name) sessionPayload.name = decoded.name

    const session = await createSession(sessionPayload, requireEnv("KOMOJU_SECRET_KEY"))
    if (!session.id || !session.session_url) throw new Error("invalid_session_response")

    const now = new Date()
    await orderRef.set({
      orderId,
      uid: decoded.uid,
      email: decoded.email ?? null,
      plan: FULL_ACCESS_PLAN,
      planId: FULL_ACCESS_PLAN,
      method: body.method,
      durationDays: body.durationDays,
      industry: body.industry,
      addAiConversation: body.addAiConversation,
      amount: total,
      baseAmount,
      aiAmount,
      currency: "JPY",
      status: "pending",
      sessionId: session.id,
      paymentId: session.payment?.id ?? null,
      komojuSessionId: session.id,
      komojuPaymentId: session.payment?.id ?? null,
      processedEventIds: [],
      capturedAt: null,
      entitlementAppliedAt: null,
      refundedAt: null,
      createdAt: now,
      updatedAt: now,
    })

    const billing = isRecord(userData.billing) ? userData.billing : {}
    const currentEnd = toDate(billing.currentPeriodEnd)
    const keepActive = billing.status === "active" && !!currentEnd && currentEnd > now
    await setUserBillingMerge(decoded.uid, {
      accountType: "personal",
      method: body.method,
      status: keepActive ? "active" : "pending",
      currentPlan: FULL_ACCESS_PLAN,
      komojuSessionId: session.id,
      komojuPaymentId: session.payment?.id ?? null,
      komojuOrderId: orderId,
    })

    return NextResponse.json({ url: session.session_url }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown"
    console.error("KOMOJU checkout failed", { message })
    return NextResponse.json(
      { error: "決済ページの作成に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 },
    )
  }
}
