"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, User, signOut } from "firebase/auth"
import { auth } from "@/app/lib/firebase"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setChecking(false)
      if (!u) router.replace("/register")
    })
    return () => unsubscribe()
  }, [router])

  if (checking) return <main style={S.page}><div style={S.loading}>読み込み中…</div></main>
  if (!user) return null

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/login")
  }

  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div style={S.brandRow}>
          <div style={S.logo}>⚙</div>
          <div>
            <div style={S.brand}>Manufacturing Skills Academy</div>
            <div style={S.subBrand}>Japanese × AI × Manufacturing</div>
          </div>
        </div>
        <h1 style={S.title}>製造現場で使う日本語を、実務に近い形で学ぶ。</h1>
        <p style={S.text}>ようこそ {user.displayName || user.email || "ユーザー"} さん。学習、ゲーム、AI練習をここから始められます。</p>
      </section>

      <section style={S.grid}>
        <button style={S.card} onClick={() => router.push("/select-mode")}>
          <div style={S.cardIcon}>📘</div>
          <h2 style={S.cardTitle}>学習を始める</h2>
          <p style={S.cardText}>製造用語・会話・リスニング・技能検定対策を選んで学習します。</p>
          <div style={S.cardLink}>教材一覧へ →</div>
        </button>

        <button style={S.card} onClick={() => router.push("/game")}>
          <div style={S.cardIcon}>🎮</div>
          <h2 style={S.cardTitle}>ゲームで復習</h2>
          <p style={S.cardText}>短時間でテンポよく、日本語と現場用語を反復できます。</p>
          <div style={S.cardLink}>ゲームへ →</div>
        </button>

        <button style={S.card} onClick={() => router.push("/mypage")}>
          <div style={S.cardIcon}>📊</div>
          <h2 style={S.cardTitle}>マイページ</h2>
          <p style={S.cardText}>学習履歴、契約状態、バッジ、進捗を確認します。</p>
          <div style={S.cardLink}>確認する →</div>
        </button>
      </section>

      <section style={S.actions}>
        <button style={S.secondary} onClick={() => router.push("/plans")}>プラン / 支払い</button>
        <button style={S.secondary} onClick={() => router.push("/for-business")}>企業向け</button>
        <button style={S.logout} onClick={handleLogout}>ログアウト</button>
      </section>
    </main>
  )
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", padding: 18, background: "linear-gradient(180deg,#f8fafc,#eef6ff)", maxWidth: 1040, margin: "0 auto" },
  loading: { margin: "60px auto", background: "white", border: "1px solid #dbe3ea", borderRadius: 18, padding: 18, fontWeight: 900, maxWidth: 420, textAlign: "center" },
  hero: { marginTop: 12, background: "linear-gradient(135deg,#0f172a,#1d4ed8)", color: "white", borderRadius: 30, padding: 26, boxShadow: "0 18px 44px rgba(15,23,42,.20)" },
  brandRow: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 18, display: "grid", placeItems: "center", background: "rgba(255,255,255,.14)", fontSize: 26 },
  brand: { fontWeight: 950, letterSpacing: ".02em" },
  subBrand: { fontSize: 12, opacity: .75, marginTop: 3, fontWeight: 800 },
  title: { fontSize: "clamp(28px,5vw,46px)", lineHeight: 1.15, margin: "22px 0 10px", fontWeight: 950 },
  text: { margin: 0, lineHeight: 1.8, opacity: .86, fontWeight: 700 },
  grid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 },
  card: { textAlign: "left", border: "1px solid #dbe3ea", background: "rgba(255,255,255,.94)", borderRadius: 24, padding: 18, cursor: "pointer", boxShadow: "0 12px 30px rgba(15,23,42,.08)" },
  cardIcon: { width: 48, height: 48, borderRadius: 16, background: "#eff6ff", display: "grid", placeItems: "center", fontSize: 24 },
  cardTitle: { margin: "14px 0 8px", fontSize: 20, fontWeight: 950, color: "#0f172a" },
  cardText: { margin: 0, lineHeight: 1.7, color: "#64748b", fontWeight: 700 },
  cardLink: { marginTop: 14, color: "#2563eb", fontWeight: 950 },
  actions: { marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  secondary: { border: "1px solid #dbe3ea", background: "white", borderRadius: 16, padding: "12px 14px", fontWeight: 900, cursor: "pointer" },
  logout: { border: "1px solid #fecaca", background: "#fff1f2", color: "#991b1b", borderRadius: 16, padding: "12px 14px", fontWeight: 900, cursor: "pointer" },
}
