import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { adminDb } from "@/app/lib/firebaseAdmin"
import {
  isRecord,
  isValidWebhookSignature,
  type KomojuEvent,
} from "@/app/lib/komoju"
import { processKomojuWebhookEvent } from "@/app/lib/komojuWebhook"

export const runtime = "nodejs"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

async function resolveOrderId(data: Record<string, unknown>) {
  const externalOrderNum =
    typeof data.external_order_num === "string" ? data.external_order_num : null
  if (externalOrderNum) {
    const snapshot = await adminDb().collection("paymentOrders").doc(externalOrderNum).get()
    if (snapshot.exists) return externalOrderNum
  }

  const sessionId = typeof data.session === "string" ? data.session : null
  if (!sessionId) return externalOrderNum

  const query = await adminDb()
    .collection("paymentOrders")
    .where("komojuSessionId", "==", sessionId)
    .limit(1)
    .get()
  return query.docs[0]?.id ?? externalOrderNum
}

export async function POST(req: Request) {
  try {
    const webhookSecret = requireEnv("KOMOJU_WEBHOOK_SECRET")
    const requestHeaders = await headers()
    const signature = requestHeaders.get("x-komoju-signature")
    const rawBody = await req.text()
    if (!isValidWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
    }

    const parsed: unknown = JSON.parse(rawBody)
    if (!isRecord(parsed)) {
      return NextResponse.json({ error: "Invalid webhook" }, { status: 400 })
    }
    const event: KomojuEvent = {
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      type:
        typeof parsed.type === "string"
          ? parsed.type
          : requestHeaders.get("x-komoju-event") ?? undefined,
      data: isRecord(parsed.data) ? parsed.data : {},
    }

    if (event.type === "ping") {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const orderId = await resolveOrderId(event.data ?? {})
    if (!orderId) {
      console.warn("KOMOJU webhook order not found", { eventType: event.type })
      return NextResponse.json({ received: true }, { status: 200 })
    }

    await processKomojuWebhookEvent(
      adminDb(),
      orderId,
      event,
      requestHeaders.get("x-komoju-id"),
    )
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown"
    console.error("KOMOJU webhook processing failed", { message })
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
