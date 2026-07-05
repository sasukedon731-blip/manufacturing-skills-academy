"use client"

import { useRouter } from "next/navigation"

function ActionButton({
  onClick,
  variant = "btnPrimary",
  labelJa,
  labelEn,
}: {
  onClick: () => void
  variant?: "btnPrimary" | "btnSub" | "btnAccent" | "btnSuccess"
  labelJa: string
  labelEn: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn ${variant}`}
      style={{
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        textAlign: "left",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 16, fontWeight: 900 }}>{labelJa}</span>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
          {labelEn}
        </span>
      </span>
      <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{">"}</span>
    </button>
  )
}

export default function HowToUsePage() {
  const router = useRouter()

  return (
    <main>
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 8 }}>
          このアプリの使い方
        </h1>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>How to use this app</p>

        <p>
          製造現場で使う日本語、JLPT、製造用語、ゲーム学習、AI練習をまとめて学べます。
          まずは無料の日本語バトルから始められます。
        </p>
        <p style={{ color: "#6b7280" }}>
          Learn Japanese for work and exams. Start with the free Japanese Battle.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginBottom: 16,
        }}
      >
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
            無料でできること
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>What you can do for free</p>

          <ul className="stackSm" style={{ color: "#111827" }}>
            <li>・日本語バトル：1日1回</li>
            <li style={{ color: "#6b7280", fontSize: 13 }}>Play once per day</li>
          </ul>

          <ActionButton
            onClick={() => router.push("/game")}
            variant="btnPrimary"
            labelJa="無料で試す"
            labelEn="Try for free"
          />
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
            有料でできること
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 12 }}>Paid features</p>

          <ul className="stackSm" style={{ color: "#111827" }}>
            <li>・基本学習プラン：日本語・製造系・ゲーム教材</li>
            <li>・AIオプション：AI会話・AIスピーキング</li>
            <li>・1ヶ月 / 3ヶ月 / 6ヶ月から選択</li>
            <li>・自動更新なし</li>
          </ul>

          <ActionButton
            onClick={() => router.push("/plans")}
            variant="btnAccent"
            labelJa="プランを見る"
            labelEn="View plans"
          />
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>使い方の流れ</h2>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>How it works</p>

        <div className="stack">
          <div className="panel">
            <p style={{ fontWeight: 900, marginBottom: 4 }}>1. 日本語バトル</p>
            <p style={{ color: "#6b7280", margin: 0 }}>無料ゲームでレベルを確認します。</p>
          </div>

          <div className="panel">
            <p style={{ fontWeight: 900, marginBottom: 4 }}>2. 教材を選ぶ</p>
            <p style={{ color: "#6b7280", margin: 0 }}>日本語・製造系・ゲームから学習を始めます。</p>
          </div>

          <div className="panel">
            <p style={{ fontWeight: 900, marginBottom: 4 }}>3. 継続する</p>
            <p style={{ color: "#6b7280", margin: 0 }}>正解数、履歴、バッジを見ながら進めます。</p>
          </div>

          <div className="panel">
            <p style={{ fontWeight: 900, marginBottom: 4 }}>4. AIで練習する</p>
            <p style={{ color: "#6b7280", margin: 0 }}>必要な場合だけAIオプションを追加します。</p>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: 24,
          background: "#2563eb",
          color: "white",
          border: "none",
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          もっと学びたい方へ
        </h2>
        <p style={{ marginBottom: 16 }}>
          基本学習プランで教材を使い、必要に応じてAIオプションを追加できます。
        </p>

        <div className="stackSm">
          <button
            type="button"
            className="btn"
            onClick={() => router.push("/plans")}
            style={{ background: "white", color: "#2563eb", border: "none" }}
          >
            プランを見る / View plans
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => router.push("/game")}
            style={{
              background: "rgba(255,255,255,.14)",
              color: "white",
              border: "1px solid rgba(255,255,255,.4)",
            }}
          >
            無料で試す / Try for free
          </button>
        </div>
      </div>
    </main>
  )
}
