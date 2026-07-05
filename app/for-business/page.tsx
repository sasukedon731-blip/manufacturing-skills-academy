import Link from "next/link"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"

const features = [
  ["個人ログインと企業ログインを分離", "学習者は通常ログイン、企業担当者は専用ログインから管理画面へ入ります。"],
  ["学習進捗を一覧化", "学習回数、平均正答率、最終学習日、主な学習項目、バッジ数を確認できます。"],
  ["製造・日本語・AI・ゲームに対応", "製造現場の日本語、JLPT、AI会話、AIスピーキング、日本語バトルをまとめて運用できます。"],
]

export default function ForBusinessPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#0f172a" }}>
      <AppHeader title="法人向け" />
      <section style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 20px" }}>
          <p style={pill}>FOR BUSINESS</p>
          <h1 style={{ margin: "16px 0 14px", fontSize: 42, lineHeight: 1.15, letterSpacing: 0 }}>
            製造現場で働く人の日本語学習を、企業側から見える化
          </h1>
          <p style={{ maxWidth: 720, color: "#475569", fontSize: 16, lineHeight: 1.8 }}>
            個人の学習体験はそのままに、企業担当者は専用管理画面で所属学習者の進捗を確認できます。
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <Link href="/contact" style={primaryLink}>導入について相談する</Link>
            <Link href="/company/login" style={subLink}>企業ログイン</Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "42px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
          {features.map(([title, text]) => (
            <div key={title} style={{ padding: 22, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>{title}</h2>
              <p style={{ margin: "10px 0 0", color: "#475569", lineHeight: 1.8 }}>{text}</p>
            </div>
          ))}
        </div>
        <LegalFooter />
      </section>
    </main>
  )
}

const pill: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#475569",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: ".12em",
}
const primaryLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 50,
  padding: "0 18px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
}
const subLink: React.CSSProperties = {
  ...primaryLink,
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
}
