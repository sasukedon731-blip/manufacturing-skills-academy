import { NextResponse } from "next/server"

import { adminAuth, adminDb } from "@/app/lib/firebaseAdmin"
import { isKomojuResourceId, isRecord } from "@/app/lib/komoju"
import { parseSessionOrder, verifySessionResponse } from "@/app/lib/komojuSession"

export const runtime = "nodejs"

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function basicAuth(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    if (!isRecord(body)) {
      return NextResponse.json({ state: "unknown" }, { status: 400 })
    }
    const idToken = typeof body.idToken === "string" ? body.idToken : null
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null
    if (!idToken || !isKomojuResourceId(sessionId)) {
      return NextResponse.json({ state: "unknown" }, { status: 400 })
    }

    const decoded = await adminAuth().verifyIdToken(idToken)
    const query = await adminDb()
      .collection("paymentOrders")
      .where("komojuSessionId", "==", sessionId)
      .limit(1)
      .get()
    const orderDocument = query.docs[0]
    if (!orderDocument) {
      return NextResponse.json({ state: "unknown" }, { status: 404 })
    }
    const order = parseSessionOrder(orderDocument.id, decoded.uid, orderDocument.data())
    if (!order || order.sessionId !== sessionId) {
      return NextResponse.json({ state: "unknown" }, { status: 404 })
    }

    const response = await fetch(`https://komoju.com/api/v1/sessions/${sessionId}`, {
      headers: { Authorization: basicAuth(requireEnv("KOMOJU_SECRET_KEY")) },
      cache: "no-store",
    })
    if (!response.ok) {
      return NextResponse.json({ state: "unknown" }, { status: 502 })
    }
    const rawSession: unknown = await response.json()
    const result = verifySessionResponse(rawSession, order)
    if (!result) {
      return NextResponse.json({ state: "unknown" }, { status: 409 })
    }
    return NextResponse.json(result, { status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown"
    console.error("KOMOJU session status check failed", { message })
    return NextResponse.json({ state: "unknown" }, { status: 500 })
  }
}
