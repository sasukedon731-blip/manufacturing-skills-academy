"use client"

import type { CSSProperties } from "react"
import Link from "next/link"

type Props = {
  checkout?: string | null
  showAiCta?: boolean
}

export default function CheckoutResultNotice({
  checkout,
  showAiCta = false,
}: Props) {
  if (checkout === "success") {
    return (
      <section
        style={{
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 20, color: "#166534" }}>
          購入ありがとうございます！
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.8,
            color: "#166534",
          }}
        >
          決済が完了しました。すぐに学習を開始できます。
          マイページでも利用状態を確認できます。
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <Link href="/select-mode" style={primaryBtn}>
            学習を始める
          </Link>

          <Link href="/game" style={secondaryBtn}>
            日本語バトル
          </Link>

          <Link href="/mypage" style={secondaryBtn}>
            マイページを見る
          </Link>

          {showAiCta ? (
            <Link href="/conversation" style={secondaryBtn}>
              AI会話を始める
            </Link>
          ) : null}
        </div>
      </section>
    )
  }

  if (checkout === "cancel") {
    return (
      <section
        style={{
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          borderRadius: 20,
          padding: 20,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>
          決済はまだ完了していません
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.8,
            color: "#4b5563",
          }}
        >
          もう一度プランを選び直して購入できます。
          コンビニ決済では、お支払い番号の確認後にこの画面へ自動で戻らない場合があります。
        </div>
      </section>
    )
  }

  return null
}

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 12,
  background: "#111827",
  color: "#ffffff",
  fontWeight: 900,
  textDecoration: "none",
}

const secondaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 900,
  textDecoration: "none",
}