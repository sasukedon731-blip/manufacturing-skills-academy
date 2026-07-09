"use client"

import { useRouter } from "next/navigation"

export default function TrialExpiredPage() {
  const router = useRouter()

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.badge}>無料体験終了</div>
        <div style={styles.icon}>⏰</div>
        <h1 style={styles.title}>1日間の無料体験が終了しました</h1>
        <p style={styles.lead}>
          Manufacturing Skills Academy の無料体験期間が終了したため、現在は学習コンテンツを利用できません。
        </p>
        <p style={styles.body}>
          引き続き製造現場の日本語・会話・リスニング・AI練習を利用するには、プランを選択してください。
          企業コードで利用する場合は、会社から案内された企業コードで登録してください。
        </p>

        <div style={styles.actions}>
          <button style={styles.primary} onClick={() => router.push("/plans")}>
            プランを見る
          </button>
          <button style={styles.secondary} onClick={() => router.push("/")}>
            ホームへ戻る
          </button>
        </div>

        <p style={styles.note}>
          すでに支払い済みなのにこの画面が出る場合は、少し時間を置いて再読み込みするか、お問い合わせください。
        </p>
      </section>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "40px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,.22), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eef6ff 45%, #f8fafc 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 28,
    padding: "34px 28px",
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(148,163,184,.28)",
    boxShadow: "0 24px 80px rgba(15,23,42,.14)",
    textAlign: "center",
  },
  badge: {
    display: "inline-flex",
    padding: "7px 13px",
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 18,
  },
  icon: { fontSize: 46, marginBottom: 8 },
  title: {
    margin: 0,
    fontSize: "clamp(26px, 5vw, 38px)",
    lineHeight: 1.25,
    color: "#0f172a",
    letterSpacing: "-.04em",
  },
  lead: {
    margin: "18px auto 0",
    maxWidth: 560,
    color: "#334155",
    fontSize: 17,
    lineHeight: 1.8,
    fontWeight: 700,
  },
  body: {
    margin: "12px auto 0",
    maxWidth: 580,
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.9,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 28,
  },
  primary: {
    border: "none",
    borderRadius: 999,
    padding: "14px 26px",
    background: "linear-gradient(135deg, #2563eb, #0f766e)",
    color: "white",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(37,99,235,.25)",
  },
  secondary: {
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "14px 22px",
    background: "white",
    color: "#334155",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
  },
  note: {
    margin: "24px auto 0",
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 1.7,
    maxWidth: 520,
  },
}
