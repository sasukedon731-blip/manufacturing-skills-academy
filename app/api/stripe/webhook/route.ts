// app/api/stripe/webhook/route.ts
import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { setUserBillingMerge, setUserIndustryMerge } from "@/app/lib/billingServer"

export const runtime = "nodejs"

type PlanId = "3" | "5" | "7"
type PaymentMethodType = "convenience" | "card"
type DurationDays = 30 | 90 | 180
type IndustryId =
  | "construction"
  | "manufacturing"
  | "care"
  | "driver"
  | "undecided"

function parseDurationDays(v: unknown): DurationDays {
  const n = Number(v)
  if (n === 90) return 90
  if (n === 180) return 180
  return 30
}

function parsePlan(v: unknown): PlanId | null {
  return v === "3" || v === "5" || v === "7" ? "7" : null
}

function parseAiConversation(v: unknown): boolean {
  return v === true || v === "true"
}

function parseMethod(v: unknown): PaymentMethodType {
  return v === "convenience" ? "convenience" : "card"
}

function parseIndustry(v: unknown): IndustryId | null {
  return v === "construction" ||
    v === "manufacturing" ||
    v === "care" ||
    v === "driver" ||
    v === "undecided"
    ? v
    : null
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function getMetadataValue(
  value: Stripe.Metadata | null | undefined,
  key: string
): string | undefined {
  const v = value?.[key]
  return typeof v === "string" ? v : undefined
}

export async function POST(req: Request) {
  try {
    const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY")
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET")

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-02-25.clover",
    })

    const sig = (await headers()).get("stripe-signature")
    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature" },
        { status: 400 }
      )
    }

    const rawBody = await req.text()

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err?.message)
      return NextResponse.json({ error: "Bad signature" }, { status: 400 })
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const uid =
          getMetadataValue(session.metadata, "uid") ||
          (typeof session.client_reference_id === "string"
            ? session.client_reference_id
            : undefined)

        if (!uid) {
          console.warn("checkout.session.completed: missing uid")
          break
        }

        const plan = parsePlan(getMetadataValue(session.metadata, "plan"))
        const method = parseMethod(getMetadataValue(session.metadata, "method"))
        const durationDays = parseDurationDays(
          getMetadataValue(session.metadata, "durationDays")
        )
        const industry = parseIndustry(
          getMetadataValue(session.metadata, "industry")
        )
        const addAiConversation = parseAiConversation(
          getMetadataValue(session.metadata, "addAiConversation")
        )

        const paid = session.payment_status === "paid"

        await setUserBillingMerge(uid, {
          accountType: "personal",
          method,
          status: paid ? "active" : "pending",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          ...(plan ? { currentPlan: plan } : {}),
          aiConversationEnabled: paid ? addAiConversation : false,
          ...(paid ? { purchasedDurationDays: durationDays } : {}),
        })

        if (paid && industry) {
          await setUserIndustryMerge(uid, industry)
        }

        break
      }


      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session

        const uid =
          getMetadataValue(session.metadata, "uid") ||
          (typeof session.client_reference_id === "string"
            ? session.client_reference_id
            : undefined)

        if (!uid) {
          console.warn("checkout.session.async_payment_succeeded: missing uid")
          break
        }

        const plan = parsePlan(getMetadataValue(session.metadata, "plan"))
        const method = parseMethod(getMetadataValue(session.metadata, "method"))
        const durationDays = parseDurationDays(
          getMetadataValue(session.metadata, "durationDays")
        )
        const industry = parseIndustry(
          getMetadataValue(session.metadata, "industry")
        )
        const addAiConversation = parseAiConversation(
          getMetadataValue(session.metadata, "addAiConversation")
        )

        await setUserBillingMerge(uid, {
          accountType: "personal",
          method,
          status: "active",
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          ...(plan ? { currentPlan: plan } : {}),
          aiConversationEnabled: addAiConversation,
          purchasedDurationDays: durationDays,
        })

        if (industry) {
          await setUserIndustryMerge(uid, industry)
        }

        break
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent

        const uid = getMetadataValue(pi.metadata, "uid")
        if (!uid) {
          console.warn("payment_intent.succeeded: missing uid")
          break
        }

        const plan = parsePlan(getMetadataValue(pi.metadata, "plan"))
        const method = parseMethod(getMetadataValue(pi.metadata, "method"))
        const durationDays = parseDurationDays(
          getMetadataValue(pi.metadata, "durationDays")
        )
        const industry = parseIndustry(getMetadataValue(pi.metadata, "industry"))
        const addAiConversation = parseAiConversation(
          getMetadataValue(pi.metadata, "addAiConversation")
        )

        await setUserBillingMerge(uid, {
          accountType: "personal",
          method,
          status: "active",
          stripePaymentIntentId: pi.id,
          ...(plan ? { currentPlan: plan } : {}),
          aiConversationEnabled: addAiConversation,
          purchasedDurationDays: durationDays,
        })

        if (industry) {
          await setUserIndustryMerge(uid, industry)
        }

        break
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent
        const uid = getMetadataValue(pi.metadata, "uid")

        if (!uid) {
          console.warn("payment_intent.payment_failed: missing uid")
          break
        }

        await setUserBillingMerge(uid, {
          status: "past_due",
          stripePaymentIntentId: pi.id,
        })

        break
      }

      default: {
        break
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (e: any) {
    console.error("Webhook handler error:", e)
    return NextResponse.json(
      { error: e?.message ?? "Webhook error" },
      { status: 500 }
    )
  }
}
