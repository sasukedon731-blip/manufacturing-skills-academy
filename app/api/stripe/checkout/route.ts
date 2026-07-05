// app/api/stripe/checkout/route.ts
import Stripe from "stripe"
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

const FULL_ACCESS_PLAN: Body["plan"] = "7"

const BASE_PRICE_TABLE: Record<DurationDays, number> = {
  30: 500,
  90: 1200,
  180: 2000,
}

const AI_ADDON_PRICE_TABLE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
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

function durationLabel(days: DurationDays) {
  if (days === 30) return "1ヶ月"
  if (days === 90) return "3ヶ月"
  return "6ヶ月"
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

    const industry = isIndustryId(body.industry) ? body.industry : "manufacturing"
    const decoded = await adminAuth().verifyIdToken(body.idToken)
    const uid = decoded.uid
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL")
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    })

    const amount = BASE_PRICE_TABLE[body.durationDays]
    const aiConversationAmount = body.addAiConversation
      ? AI_ADDON_PRICE_TABLE[body.durationDays]
      : 0
    const label = durationLabel(body.durationDays)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `基本学習プラン（${label}）`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
        ...(body.addAiConversation
          ? [
              {
                price_data: {
                  currency: "jpy",
                  product_data: {
                    name: `AIオプション（${label}）`,
                  },
                  unit_amount: aiConversationAmount,
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      payment_method_types:
        body.method === "convenience" ? ["konbini"] : ["card"],
      success_url: `${appUrl}/plans?checkout=success`,
      cancel_url: `${appUrl}/plans?checkout=cancel`,
      client_reference_id: uid,
      metadata: {
        uid,
        plan: FULL_ACCESS_PLAN,
        method: body.method,
        durationDays: String(body.durationDays),
        industry,
        addAiConversation: body.addAiConversation ? "true" : "false",
      },
      payment_intent_data: {
        metadata: {
          uid,
          plan: FULL_ACCESS_PLAN,
          method: body.method,
          durationDays: String(body.durationDays),
          industry,
          addAiConversation: body.addAiConversation ? "true" : "false",
        },
      },
    })

    const userSnap = await adminDb().collection("users").doc(uid).get()
    const currentBilling = userSnap.exists
      ? (userSnap.data()?.billing ?? {})
      : {}

    const keepActive =
      currentBilling?.status === "active" &&
      hasFuturePeriodEnd(currentBilling?.currentPeriodEnd)

    await setUserBillingMerge(uid, {
      accountType: "personal",
      method: body.method,
      status: keepActive ? "active" : "pending",
      currentPlan: FULL_ACCESS_PLAN,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    )
  }
}
