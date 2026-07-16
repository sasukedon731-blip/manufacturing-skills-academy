// app/api/komoju/checkout/route.ts
import { NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/app/lib/firebaseAdmin"
import { setUserBillingMerge } from "@/app/lib/billingServer"

export const runtime = "nodejs"

type IndustryId =
  | "construction"
  | "manufacturing"
  | "care"
  | "driver"
  | "undecided"

type DurationDays = 30 | 90 | 180

type Body = {
  idToken: string
  plan: "3" | "5" | "7"
  method: "convenience" | "card"
  durationDays: DurationDays
  industry?: IndustryId | null
  addAiConversation?: boolean
}

type KomojuSessionResponse = {
  id?: string
  session_url?: string
  status?: string
  payment?: {
    id?: string
    status?: string
  }
  error?: unknown
  message?: string
}

const FULL_ACCESS_PLAN: Body["plan"] = "7"

const BASE_PRICE_TABLE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
}

const AI_ADDON_PRICE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function isValidDuration(v: any): v is DurationDays {
  return v === 30 || v === 90 || v === 180
}

function isIndustryId(v: any): v is IndustryId {
  return (
    v === "construction" ||
    v === "manufacturing" ||
    v === "care" ||
    v === "driver" ||
    v === "undecided"
  )
}

function hasFuturePeriodEnd(value: any) {
  if (!value) return false

  let date: Date | null = null
  if (value instanceof Date) {
    date = value
  } else if (typeof value?.toDate === "function") {
    date = value.toDate()
  } else {
    const d = new Date(value)
    date = Number.isNaN(d.getTime()) ? null : d
  }

  return !!date && date.getTime() > Date.now()
}

function basicAuth(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

async function createKomojuSession(
  payload: Record<string, unknown>,
  secretKey: string
) {
  const res = await fetch("https://komoju.com/api/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(secretKey),
    },
    body: JSON.stringify(payload),
  })

  const data = (await res.json().catch(() => ({}))) as KomojuSessionResponse

  if (!res.ok) {
    const message =
      data?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      `KOMOJU session create failed (${res.status})`
    const err = new Error(message) as Error & { status?: number; data?: any }
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!body?.idToken || !body?.plan || !body?.method) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 })
    }
    if (body.plan !== "3" && body.plan !== "5" && body.plan !== "7") {
      return NextResponse.json({ error: "Bad plan" }, { status: 400 })
    }
    if (body.method !== "convenience" && body.method !== "card") {
      return NextResponse.json({ error: "Bad method" }, { status: 400 })
    }
    if (!isValidDuration(body.durationDays)) {
      return NextResponse.json({ error: "Bad durationDays" }, { status: 400 })
    }

    const appUrl = requireEnv("NEXT_PUBLIC_APP_URL")
    const komojuSecretKey = requireEnv("KOMOJU_SECRET_KEY")

    const decoded = await adminAuth().verifyIdToken(body.idToken)
    const uid = decoded.uid
    const email = typeof decoded.email === "string" ? decoded.email : undefined
    const name =
      typeof decoded.name === "string" && decoded.name.trim()
        ? decoded.name.trim()
        : undefined
    const industry = isIndustryId(body.industry) ? body.industry : "manufacturing"

    // 企業契約ユーザーは企業側で利用料を負担するため、決済を作成しない。
    // UIを迂回してAPIを直接呼ばれた場合も、サーバー側で必ず拒否する。
    const userRef = adminDb().collection("users").doc(uid)
    const userSnap = await userRef.get()
    const userData = userSnap.exists ? userSnap.data() ?? {} : {}
    const isCompanyAccount =
      userData.accountType === "company" ||
      userData.billing?.accountType === "company" ||
      userData.billing?.method === "company_contract"

    if (isCompanyAccount) {
      return NextResponse.json(
        { error: "企業契約でご利用中のため、個人向けプランの購入は必要ありません。" },
        { status: 403 }
      )
    }

    const baseAmount = BASE_PRICE_TABLE[body.durationDays]
    const aiAmount = body.addAiConversation ? AI_ADDON_PRICE[body.durationDays] : 0
    const total = baseAmount + aiAmount

    if (total <= 0) {
      return NextResponse.json({ error: "Bad amount" }, { status: 400 })
    }

    const orderRef = adminDb().collection("paymentOrders").doc()
    const orderId = orderRef.id
    const paymentType = body.method === "convenience" ? "konbini" : "credit_card"
    const appBaseUrl = appUrl.replace(/\/+$/, "")
    const metadata: Record<string, string> = {
      uid,
      order_id: orderId,
      plan: FULL_ACCESS_PLAN,
      duration_days: String(body.durationDays),
      method: body.method,
      industry,
      add_ai: String(!!body.addAiConversation),
    }

    const sessionPayload: Record<string, unknown> = {
      mode: "payment",
      amount: total,
      currency: "JPY",
      return_url: `${appBaseUrl}/plans?checkout=return`,
      external_customer_id: uid,
      payment_types: [paymentType],
      default_locale: "ja",
      payment_data: {
        external_order_num: orderId,
        capture: "auto",
      },
      metadata,
    }
    if (email) sessionPayload.email = email
    if (name) sessionPayload.name = name

    // Hosted Page sessions collect payment details and handle 3D Secure on KOMOJU.
    // Keep payment_types aligned with the method selected in this app.
    const session = await createKomojuSession(sessionPayload, komojuSecretKey)

    if (!session?.id || !session?.session_url) {
      throw new Error("KOMOJU session_url was not returned")
    }

    await orderRef.set({
      uid,
      email: email ?? null,
      plan: FULL_ACCESS_PLAN,
      method: body.method,
      durationDays: body.durationDays,
      industry,
      addAiConversation: !!body.addAiConversation,
      amount: total,
      baseAmount,
      aiAmount,
      currency: "JPY",
      status: "pending",
      komojuSessionId: session.id,
      komojuPaymentId: session.payment?.id ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const currentBilling = userData.billing ?? {}
    const keepActive =
      currentBilling?.status === "active" &&
      hasFuturePeriodEnd(currentBilling?.currentPeriodEnd)

    await setUserBillingMerge(uid, {
      accountType: "personal",
      method: body.method,
      status: keepActive ? "active" : "pending",
      currentPlan: FULL_ACCESS_PLAN,
      komojuSessionId: session.id,
      komojuPaymentId: session.payment?.id ?? null,
      komojuOrderId: orderId,
    })

    return NextResponse.json({ url: session.session_url }, { status: 200 })
  } catch (e: any) {
    console.error("KOMOJU checkout error:", e)
    return NextResponse.json(
      { error: e?.message ?? "決済ページの作成に失敗しました" },
      { status: 500 }
    )
  }
}
