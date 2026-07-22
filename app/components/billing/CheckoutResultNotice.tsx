"use client"

import type { CSSProperties } from "react"
import Link from "next/link"

import type { SessionResultState } from "@/app/lib/komoju"

type Props = {
  visible: boolean
  checking: boolean
  state: SessionResultState | null
  showAiCta?: boolean
}

const copy: Record<SessionResultState, { title: string; body: string; tone: string; border: string }> = {
  paid: {
    title: "支払いが完了しました",
    body: "支払いを確認しました。利用権は決済通知の確認後に反映されます。マイページで利用状態をご確認ください。",
    tone: "#166534",
    border: "#bbf7d0",
  },
  processing: {
    title: "支払い状況を確認中です",
    body: "決済処理を確認しています。反映まで少し時間がかかる場合があります。",
    tone: "#1d4ed8",
    border: "#bfdbfe",
  },
  konbini_waiting: {
    title: "コンビニでのお支払いをお待ちしています",
    body: "店頭でのお支払い後、入金確認が完了すると利用できるようになります。",
    tone: "#92400e",
    border: "#fde68a",
  },
  failed: {
    title: "支払いを完了できませんでした",
    body: "お支払い方法をご確認のうえ、もう一度お試しください。",
    tone: "#991b1b",
    border: "#fecaca",
  },
  cancelled: {
    title: "支払いはキャンセルまたは期限切れです",
    body: "料金は確定していません。必要な場合は、もう一度プランを選択してください。",
    tone: "#374151",
    border: "#d1d5db",
  },
  unknown: {
    title: "支払い状況を確認できませんでした",
    body: "時間をおいてマイページで利用状態をご確認ください。問題が続く場合はお問い合わせください。",
    tone: "#374151",
    border: "#d1d5db",
  },
}

export default function CheckoutResultNotice({
  visible,
  checking,
  state,
  showAiCta = false,
}: Props) {
  if (!visible) return null
  const content = checking ? {
    title: "支払い状況を確認しています",
    body: "画面を閉じずにしばらくお待ちください。",
    tone: "#1d4ed8",
    border: "#bfdbfe",
  } : copy[state ?? "unknown"]

  return (
    <section style={{ border: `1px solid ${content.border}`, background: "#fff", borderRadius: 20, padding: 20 }}>
      <div style={{ fontWeight: 900, fontSize: 20, color: content.tone }}>{content.title}</div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: content.tone }}>
        {content.body}
      </div>
      {!checking ? (
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/mypage" style={primaryBtn}>マイページで確認</Link>
          <Link href="/plans" style={secondaryBtn}>プランへ戻る</Link>
          {state === "paid" ? <Link href="/select-mode" style={secondaryBtn}>学習メニュー</Link> : null}
          {state === "paid" && showAiCta ? <Link href="/conversation" style={secondaryBtn}>AI会話</Link> : null}
        </div>
      ) : null}
    </section>
  )
}

const primaryBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 14px",
  borderRadius: 12, background: "#111827", color: "#fff", fontWeight: 900, textDecoration: "none",
}
const secondaryBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "10px 14px",
  borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
  color: "#111827", fontWeight: 900, textDecoration: "none",
}
