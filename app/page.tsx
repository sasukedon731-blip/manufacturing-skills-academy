"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"
import { quizCatalog } from "@/app/data/quizCatalog"
import { auth } from "@/app/lib/firebase"
import { useAuth } from "@/app/lib/useAuth"

const featuredQuizIds = [
  "japanese-n4",
  "japanese-n3",
  "japanese-n2",
  "speaking-practice",
  "manufacturing-meaning",
  "manufacturing-word",
  "manufacturing-listening",
  "manufacturing-conversation",
  "manufacturing-conversation-50",
  "skill-test-machining",
]

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isNarrow, setIsNarrow] = useState(false)

  const quizzes = useMemo(() => {
    const order = new Map(featuredQuizIds.map((id, index) => [id, index]))
    return quizCatalog
      .filter((quiz) => quiz.enabled && order.has(quiz.id))
      .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))
  }, [])

  useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth < 900)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return (
    <main style={styles.page}>
      <AppHeader />

      <section style={styles.shell}>
        <div style={{ ...styles.hero, ...(isNarrow ? styles.heroNarrow : null) }}>
          <div>
            <p style={styles.kicker}>MANUFACTURING SKILLS ACADEMY</p>
            <h1 style={styles.title}>製造現場で使う日本語を、AIとゲームで身につける</h1>
            <p style={styles.lead}>
              製造用語、JLPT、リスニング、AI会話、AIスピーキング、日本語バトルをまとめて練習できます。
            </p>

            <div style={styles.quickActions}>
              {loading ? null : user ? (
                <>
                  <button type="button" onClick={() => router.push("/select-mode")} style={styles.primaryButton}>
                    学習を続ける
                  </button>
                  <button type="button" onClick={() => router.push("/mypage")} style={styles.secondaryButton}>
                    マイページ
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut(auth)
                      router.push("/")
                    }}
                    style={styles.secondaryButton}
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={styles.primaryLink}>個人ログイン</Link>
                  <Link href="/company/login" style={styles.businessLink}>企業ログイン</Link>
                </>
              )}
            </div>
          </div>


          <div style={styles.heroRight}>
            <div style={styles.heroVisual} aria-label="Manufacturing Skills Academy visual">
            <div style={styles.machineCard}>
              <div style={styles.machineTop}>
                <span style={styles.machineBadge}>製造 × 日本語 × AI</span>
                <span style={styles.machineStatus}>LIVE</span>
              </div>
              <div style={styles.gearWrap}>
                <span style={styles.bigGear}>⚙</span>
                <span style={styles.aiMark}>AI</span>
                <span style={styles.jaMark}>あ</span>
              </div>
              <div className="factoryLines" style={styles.factoryLines}>
                <span />
                <span />
                <span />
              </div>
              <p style={styles.machineText}>安全・品質・報連相に必要な日本語を、現場目線で反復学習。</p>
            </div>
            </div>

            <div style={{ ...styles.loginCards, ...(isNarrow ? styles.loginCardsNarrow : null) }}>
            <EntryCard
              badge="PERSONAL"
              title="個人で学習する"
              description="自分のアカウントでログインして、学習項目・模擬試験・復習・バッジ・学習履歴を使います。"
              primaryHref={user ? "/select-mode" : "/login"}
              primaryLabel={user ? "学習メニューへ" : "個人ログイン"}
              secondaryHref="/register"
              secondaryLabel="新規登録"
              accent="#2563eb"
            />
            <EntryCard
              badge="FOR BUSINESS"
              title="企業として管理する"
              description="企業管理者アカウントでログインして、所属学習者の学習回数・正答率・最終学習日・バッジ数を確認します。"
              primaryHref="/company/login"
              primaryLabel="企業ログイン"
              secondaryHref="/for-business"
              secondaryLabel="法人向け説明"
              accent="#0f766e"
            />
            </div>
          </div>
        </div>

        <section style={styles.featureBand}>
          <h2 style={styles.sectionTitle}>主な学習項目</h2>
          <div style={styles.featureGrid}>
            <Feature href="/select-mode" label="日本語" title="JLPT N4 / N3 / N2" text="文字・語彙・文法・読解・聴解を練習。" />
            <Feature href="/select-mode" label="製造系" title="製造用語・会話" text="現場用語、会話、技能検定を学習。" />
            <Feature href="/game" label="ゲーム" title="日本語バトル" text="タイル・瞬間判定・記憶ゲームで反復。" />
            <Feature href="/speaking" label="AI" title="AIスピーキング" text="生成文、文字起こし、評価で発話練習。" />
          </div>
        </section>

        <section style={styles.listSection}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>収録コンテンツ</h2>
            <Link href="/select-mode" style={styles.textLink}>すべて見る</Link>
          </div>
          <div style={styles.quizList}>
            {quizzes.map((quiz) => (
              <Link key={quiz.id} href={`/select-mode?type=${quiz.id}&industry=manufacturing`} style={styles.quizItem}>
                <span style={styles.quizTitle}>{quiz.title}</span>
                <span style={styles.quizDescription}>{quiz.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <LegalFooter />
      </section>
    </main>
  )
}

function EntryCard({
  badge,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  accent,
}: {
  badge: string
  title: string
  description: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
  accent: string
}) {
  return (
    <div style={styles.entryCard}>
      <div style={{ ...styles.entryAccent, background: accent }} />
      <p style={{ ...styles.entryBadge, color: accent }}>{badge}</p>
      <h2 style={styles.entryTitle}>{title}</h2>
      <p style={styles.entryText}>{description}</p>
      <div style={styles.entryActions}>
        <Link href={primaryHref} style={{ ...styles.entryPrimary, background: accent }}>{primaryLabel}</Link>
        <Link href={secondaryHref} style={styles.entrySecondary}>{secondaryLabel}</Link>
      </div>
    </div>
  )
}

function Feature({ href, label, title, text }: { href: string; label: string; title: string; text: string }) {
  return (
    <Link href={href} style={styles.featureCard}>
      <span style={styles.cardLabel}>{label}</span>
      <strong style={styles.cardTitle}>{title}</strong>
      <span style={styles.cardText}>{text}</span>
    </Link>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 78% 8%, rgba(15,118,110,.16), transparent 30%), linear-gradient(135deg,#f8fafc 0%,#eef6ff 48%,#f8fafc 100%)",
    color: "#172033",
  },
  shell: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "22px 18px 42px",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(480px, 1.15fr) minmax(320px, .85fr)",
    gap: 26,
    alignItems: "start",
  },
  heroNarrow: {
    gridTemplateColumns: "1fr",
  },
  heroRight: {
    display: "grid",
    gap: 16,
  },
  kicker: {
    margin: "0 0 8px",
    fontSize: 12,
    fontWeight: 900,
    color: "#2563eb",
    letterSpacing: ".12em",
  },
  title: {
    margin: 0,
    maxWidth: 720,
    fontSize: "clamp(36px, 4.1vw, 56px)",
    lineHeight: 1.14,
    letterSpacing: 0,
  },
  lead: {
    margin: "14px 0 0",
    maxWidth: 620,
    color: "#526174",
    fontSize: 16,
    lineHeight: 1.65,
  },
  quickActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  primaryLink: {
    padding: "13px 17px",
    borderRadius: 999,
    background: "linear-gradient(135deg,#0f4c5c,#0f766e)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },
  businessLink: {
    padding: "13px 17px",
    borderRadius: 999,
    background: "#172033",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },
  primaryButton: {
    padding: "13px 17px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "13px 17px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#172033",
    fontWeight: 900,
    cursor: "pointer",
  },
  heroVisual: {
    minHeight: 138,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  machineCard: {
    width: "100%",
    minHeight: 138,
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 18,
    color: "#fff",
    background: "linear-gradient(135deg,#0f4c5c 0%,#155e75 48%,#0f766e 100%)",
    boxShadow: "0 26px 64px rgba(15,76,92,.26)",
    border: "1px solid rgba(255,255,255,.28)",
  },
  machineTop: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  machineBadge: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: ".08em",
    opacity: .92,
  },
  machineStatus: {
    borderRadius: 999,
    padding: "5px 9px",
    background: "rgba(255,255,255,.18)",
    fontSize: 11,
    fontWeight: 900,
  },
  gearWrap: {
    position: "relative",
    zIndex: 2,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  bigGear: {
    fontSize: 40,
    lineHeight: 1,
    opacity: .94,
    filter: "drop-shadow(0 12px 24px rgba(0,0,0,.24))",
  },
  aiMark: {
    position: "absolute",
    right: "30%",
    top: 0,
    borderRadius: 10,
    padding: "4px 7px",
    background: "rgba(255,255,255,.95)",
    color: "#0f4c5c",
    fontWeight: 1000,
  },
  jaMark: {
    position: "absolute",
    left: "30%",
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 10,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,.92)",
    color: "#0f766e",
    fontSize: 18,
    fontWeight: 1000,
  },
  factoryLines: {
    display: "none",
    position: "relative",
    zIndex: 2,
    gap: 6,
  },
  machineText: {
    position: "relative",
    zIndex: 2,
    margin: "10px 0 0",
    color: "rgba(255,255,255,.86)",
    lineHeight: 1.45,
    fontSize: 14,
    fontWeight: 800,
  },
  loginCards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  loginCardsNarrow: {
    gridTemplateColumns: "1fr",
  },
  entryCard: {
    position: "relative",
    overflow: "hidden",
    padding: 18,
    borderRadius: 16,
    background: "rgba(255,255,255,.94)",
    border: "1px solid #dbe3ef",
    boxShadow: "0 18px 40px rgba(15,23,42,.09)",
  },
  entryAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  entryBadge: {
    margin: "4px 0 8px",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: ".14em",
  },
  entryTitle: {
    margin: 0,
    fontSize: 21,
    letterSpacing: 0,
  },
  entryText: {
    margin: "8px 0 0",
    color: "#526174",
    lineHeight: 1.55,
    fontSize: 13,
  },
  entryActions: {
    marginTop: 12,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  entryPrimary: {
    padding: "10px 12px",
    borderRadius: 8,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },
  entrySecondary: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #cbd5e1",
    color: "#172033",
    textDecoration: "none",
    fontWeight: 900,
  },
  featureBand: {
    marginTop: 30,
    padding: 18,
    borderRadius: 8,
    border: "1px solid rgba(148,163,184,.30)",
    background: "rgba(255,255,255,.78)",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 10,
  },
  featureCard: {
    minHeight: 116,
    padding: 16,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e1e6ef",
    color: "#172033",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#0f766e",
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 1.35,
  },
  cardText: {
    color: "#5b6878",
    fontSize: 14,
    lineHeight: 1.55,
  },
  listSection: {
    marginTop: 28,
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 22,
    letterSpacing: 0,
  },
  textLink: {
    color: "#2563eb",
    fontWeight: 900,
    textDecoration: "none",
  },
  quizList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 10,
  },
  quizItem: {
    minHeight: 86,
    padding: 14,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e1e6ef",
    color: "#172033",
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  quizTitle: {
    fontWeight: 900,
  },
  quizDescription: {
    color: "#5b6878",
    fontSize: 13,
    lineHeight: 1.45,
  },
}
