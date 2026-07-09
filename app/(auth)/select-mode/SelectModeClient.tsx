"use client"

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/app/lib/firebase"
import type { QuizType } from "@/app/data/types"
import { quizCatalog } from "@/app/data/quizCatalog"
import { loadAndRepairUserPlanState } from "@/app/lib/userPlanState"

function badgeByType(type: string) {
  if (type === "japanese-n4") return { title: "日本語検定N4", badge: "N4", color: "#4f46e5", icon: "あ" }
  if (type === "japanese-n3") return { title: "日本語N3", badge: "N3", color: "#2563eb", icon: "日" }
  if (type === "japanese-n2") return { title: "日本語N2", badge: "N2", color: "#1d4ed8", icon: "上" }
  if (type === "speaking-practice") return { title: "AI日本語スピーキング", badge: "AI", color: "#be185d", icon: "AI" }
  if (type === "genba-listening") return { title: "現場用語リスニング", badge: "聴く", color: "#0f766e", icon: "耳" }
  if (type === "genba-phrasebook") return { title: "現場フレーズ集", badge: "会話", color: "#9a3412", icon: "話" }
  if (type.startsWith("manufacturing")) return { title: quizCatalog.find(q => q.id === type)?.title ?? type, badge: "製造", color: "#075985", icon: "⚙" }
  if (type === "skill-test-machining") return { title: "技能検定 機械加工", badge: "検定", color: "#166534", icon: "技" }
  const fromCatalog = quizCatalog.find(q => q.id === type)
  return { title: fromCatalog?.title ?? type, badge: "教材", color: "#334155", icon: "学" }
}

function availableModes(type: QuizType) {
  const def = quizCatalog.find(q => q.id === type)
  return def?.modes ?? ["normal", "review"]
}

function ModeButton({ children, onClick, tone = "dark" }: { children: ReactNode; onClick: () => void; tone?: "dark" | "blue" | "white" }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: tone === "white" ? "1px solid #dbe3ea" : "none",
        background: tone === "dark" ? "#0f172a" : tone === "blue" ? "#2563eb" : "white",
        color: tone === "white" ? "#0f172a" : "white",
        borderRadius: 16,
        padding: "13px 14px",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: tone === "white" ? "none" : "0 12px 24px rgba(15,23,42,.14)",
      }}
    >
      {children}
    </button>
  )
}

export default function SelectModeClient() {
  const router = useRouter()
  const params = useSearchParams()
  const type = params.get("type") as QuizType | null
  const [selected, setSelected] = useState<QuizType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login")
        return
      }
      try {
        const st = await loadAndRepairUserPlanState(u.uid)
        setSelected(st.selectedQuizTypes ?? [])
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [router])

  const currentMeta = type ? badgeByType(type) : null
  const modes = type ? availableModes(type) : []
  const selectedCards = useMemo(() => {
    const ids = selected.length ? selected : (quizCatalog.map(q => q.id) as QuizType[])
    return ids
      .map(id => quizCatalog.find(q => q.id === id))
      .filter(Boolean)
      .sort((a, b) => (a!.order ?? 0) - (b!.order ?? 0))
  }, [selected])

  if (loading) {
    return <main style={S.page}><div style={S.shell}><div style={S.loading}>読み込み中...</div></div></main>
  }

  if (!type) {
    return (
      <main style={S.page}>
        <div style={S.shell}>
          <section style={S.hero}>
            <div>
              <div style={S.eyebrow}>Manufacturing Skills Academy</div>
              <h1 style={S.heroTitle}>学習する教材を選んでください</h1>
              <p style={S.heroText}>製造現場の日本語、会話、リスニング、技能検定対策まで一つの画面から始められます。</p>
            </div>
            <button style={S.changeBtn} onClick={() => router.push("/plans")}>プラン確認</button>
          </section>

          <section style={S.grid}>
            {selectedCards.map((q) => {
              const meta = badgeByType(q!.id)
              return (
                <button key={q!.id} style={S.lessonCard} onClick={() => router.push(`/select-mode?type=${encodeURIComponent(q!.id)}`)}>
                  <div style={{ ...S.icon, background: `${meta.color}14`, color: meta.color }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={S.lessonTop}>
                      <h2 style={S.lessonTitle}>{q!.title}</h2>
                      <span style={{ ...S.badge, color: meta.color, borderColor: `${meta.color}44`, background: `${meta.color}0d` }}>{meta.badge}</span>
                    </div>
                    <p style={S.lessonDesc}>{q!.description ?? "製造現場で使う日本語を練習します。"}</p>
                    <div style={S.startLine}>タップしてモード選択へ →</div>
                  </div>
                </button>
              )
            })}
          </section>

          <div style={S.bottomNav}>
            <ModeButton tone="white" onClick={() => router.push("/mypage")}>マイページ</ModeButton>
            <ModeButton tone="white" onClick={() => router.push("/")}>TOPへ戻る</ModeButton>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={S.page}>
      <div style={S.shellSmall}>
        <section style={S.modeHero}>
          <div style={{ ...S.iconLarge, background: `${currentMeta!.color}16`, color: currentMeta!.color }}>{currentMeta!.icon}</div>
          <div>
            <div style={{ ...S.badge, color: currentMeta!.color, borderColor: `${currentMeta!.color}44`, background: `${currentMeta!.color}0d`, width: "fit-content" }}>{currentMeta!.badge}</div>
            <h1 style={S.heroTitle}>{currentMeta!.title}</h1>
            <p style={S.heroText}>学び方を選んでスタートします。迷ったら「標準問題」から始めるのがおすすめです。</p>
          </div>
        </section>

        <section style={S.modeGrid}>
          {modes.includes("normal") && <ModeButton onClick={() => router.push(`/normal?type=${encodeURIComponent(type)}`)}>標準問題で学習する</ModeButton>}
          {modes.includes("exam") && <ModeButton tone="blue" onClick={() => router.push(`/exam?type=${encodeURIComponent(type)}`)}>模擬試験に挑戦する</ModeButton>}
          {modes.includes("review") && <ModeButton tone="white" onClick={() => router.push(`/review?type=${encodeURIComponent(type)}`)}>間違えた問題を復習する</ModeButton>}
        </section>

        <div style={S.bottomNav}>
          <ModeButton tone="white" onClick={() => router.push("/select-mode")}>教材一覧へ戻る</ModeButton>
          <ModeButton tone="white" onClick={() => router.push("/mypage")}>マイページ</ModeButton>
        </div>
      </div>
    </main>
  )
}

const S: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", padding: 18, background: "linear-gradient(180deg,#f8fafc 0%,#eef6ff 100%)" },
  shell: { maxWidth: 1120, margin: "0 auto" },
  shellSmall: { maxWidth: 760, margin: "0 auto" },
  loading: { background: "white", border: "1px solid #dbe3ea", borderRadius: 18, padding: 18, fontWeight: 900 },
  hero: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "linear-gradient(135deg,#0f172a,#1e3a8a)", color: "white", borderRadius: 28, padding: 24, boxShadow: "0 18px 42px rgba(15,23,42,.18)" },
  modeHero: { display: "flex", gap: 16, alignItems: "center", background: "white", border: "1px solid #dbe3ea", borderRadius: 28, padding: 22, boxShadow: "0 18px 42px rgba(15,23,42,.08)" },
  eyebrow: { fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", opacity: .8, fontWeight: 900 },
  heroTitle: { margin: "6px 0 8px", fontSize: "clamp(24px,4vw,38px)", lineHeight: 1.15, fontWeight: 950 },
  heroText: { margin: 0, lineHeight: 1.8, opacity: .82, fontWeight: 700 },
  changeBtn: { border: "1px solid rgba(255,255,255,.35)", background: "rgba(255,255,255,.12)", color: "white", borderRadius: 16, padding: "12px 14px", fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" },
  grid: { marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 },
  lessonCard: { display: "flex", gap: 14, textAlign: "left", border: "1px solid #dbe3ea", background: "rgba(255,255,255,.92)", borderRadius: 22, padding: 16, cursor: "pointer", boxShadow: "0 10px 28px rgba(15,23,42,.07)" },
  icon: { width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", fontWeight: 950, flex: "0 0 auto" },
  iconLarge: { width: 68, height: 68, borderRadius: 22, display: "grid", placeItems: "center", fontWeight: 950, fontSize: 24, flex: "0 0 auto" },
  lessonTop: { display: "flex", alignItems: "start", justifyContent: "space-between", gap: 10 },
  lessonTitle: { margin: 0, fontSize: 17, lineHeight: 1.35, fontWeight: 950, color: "#0f172a" },
  lessonDesc: { margin: "8px 0 0", color: "#64748b", lineHeight: 1.65, fontSize: 13, fontWeight: 700 },
  badge: { border: "1px solid", borderRadius: 999, padding: "5px 9px", fontSize: 12, fontWeight: 950, whiteSpace: "nowrap" },
  startLine: { marginTop: 12, color: "#2563eb", fontWeight: 900, fontSize: 13 },
  bottomNav: { marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  modeGrid: { marginTop: 14, display: "grid", gap: 12 },
}
