"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { APP_MENU } from "@/app/components/appMenu"
import { onAuthStateChanged, signOut, User } from "firebase/auth"
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore"

import { auth, db } from "@/app/lib/firebase"
import type { QuizType } from "@/app/data/types"
import { quizCatalog } from "@/app/data/quizCatalog"
import { fetchMyAttackRank } from "../game/firestore"
import BillingStatusCard from "@/app/components/billing/BillingStatusCard"
import { getPlanLabel } from "@/app/lib/billingAccess"
import {
  getPreviewBadgeMeta,
  getTotalBadgeCount,
  getUnlockedBadgeCount,
  getRarityColors,
} from "@/app/lib/badges"
import PendingPaymentNotice from "@/app/components/billing/PendingPaymentNotice"

type QuizResult = {
  score: number
  total: number
  accuracy?: number
  quizType?: QuizType | string
  mode?: string
  createdAt?: any
}

type Progress = {
  totalSessions?: number
  todaySessions?: number
  streak?: number
  bestStreak?: number
  updatedAt?: any
}


type BillingData = Partial<{
  status: "pending" | "active" | "past_due" | "canceled"
  currentPlan: "trial" | "free" | "3" | "5" | "7"
  currentPeriodEnd: any
  aiConversationEnabled: boolean
  aiConversationExpiresAt: any
  method: "convenience" | "card"
}>

function toDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v?.toDate === "function") return v.toDate()
  if (typeof v?.seconds === "number") return new Date(v.seconds * 1000)
  try {
    return new Date(v)
  } catch {
    return null
  }
}

function fmtDate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`
}

function titleByQuizType(qt?: string) {
  const hit = quizCatalog.find((q) => q.id === qt)
  return hit?.title ?? qt ?? "不明"
}

function calcAcc(r: QuizResult) {
  if (typeof r.accuracy === "number") return Math.round(r.accuracy)
  if (r.total > 0) return Math.round((r.score / r.total) * 100)
  return 0
}

// =======================
// ✅ UI部品（重複なし）
// =======================
function GameRow({
  icon,
  title,
  best,
  rank,
  onClick,
}: {
  icon: string
  title: string
  best: number
  rank: number | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "white",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ fontSize: 18 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
          <div style={{ marginTop: 2, fontSize: 13, opacity: 0.75 }}>
            Best <b>{best}</b> ・ Rank <b>{rank ? `#${rank}` : "-"}</b>
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 900, opacity: 0.55 }}>▶</div>
    </button>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: 12,
        background: "white",
      }}
    >
      <div style={{ fontWeight: 900, opacity: 0.75, fontSize: 13 }}>{label}</div>
      <div style={{ fontWeight: 900, fontSize: 28, marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ marginTop: 4, fontSize: 13, opacity: 0.7 }}>{sub}</div> : null}
    </div>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const w = 260
  const h = 60
  const pad = 6
  if (!values.length) return <div style={{ opacity: 0.7 }}>データなし</div>

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(1, max - min)

  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1)
    const y = pad + (1 - (v - min) / span) * (h - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  )
}

type DetailState = {
  open: boolean
  quizType: string | null
  title: string
  results: QuizResult[]
  progress: Progress | null
}

// =======================
// ✅ 業種（マイページ最適化）
// =======================
type IndustryId = "construction" | "manufacturing" | "care" | "driver" | "undecided"

const INDUSTRY_LABEL: Record<IndustryId, string> = {
  construction: "建設",
  manufacturing: "製造",
  care: "介護",
  driver: "運転・免許",
  undecided: "未定（海外から）",
}

function isIndustryId(v: any): v is IndustryId {
  return v === "construction" || v === "manufacturing" || v === "care" || v === "driver" || v === "undecided"
}

const LS_INDUSTRY_KEY = "selected-industry"

const JAPANESE_BASE: QuizType[] = ["japanese-n4", "japanese-n3", "japanese-n2", "speaking-practice"]

const INDUSTRY_EXTRA: Record<IndustryId, QuizType[]> = {
  construction: [],
  manufacturing: [
    "genba-listening",
    "genba-phrasebook",
    "kansai-listening",
    "dialect-listening",
    "dialect-meaning",
    "confusing-japanese",
    "manufacturing-meaning",
    "manufacturing-word",
    "manufacturing-listening",
    "manufacturing-conversation",
    "manufacturing-conversation-50",
    "skill-test-machining",
  ],
  care: [],
  driver: [],
  undecided: ["kansai-listening", "dialect-listening", "dialect-meaning", "confusing-japanese"],
}

function buildAllowed(industry: IndustryId | null): Set<string> {
  if (!industry) return new Set()
  const extra = INDUSTRY_EXTRA[industry] ?? []
  return new Set<string>([...JAPANESE_BASE, ...extra])
}

export default function MyPage() {
  const router = useRouter()

  const [user, setUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [attackRanks, setAttackRanks] = useState<Record<string, { rank: number | null; bestScore: number }>>({})

  // ✅ ユーザーの業種（Firestore優先、無ければ localStorage）
  const [industry, setIndustry] = useState<IndustryId | null>(null)
  const [showAllCards, setShowAllCards] = useState(false)
  const [badges, setBadges] = useState<string[]>([])
  const [billing, setBilling] = useState<BillingData | null>(null)

  const withIndustry = (path: string) => {
    if (!industry) return path
    const join = path.includes("?") ? "&" : "?"
    return `${path}${join}industry=${encodeURIComponent(industry)}`
  }

  // ✅ インデックス不要：結果まとめ持ち
  const [allResults, setAllResults] = useState<QuizResult[]>([])

  // summary
  const [latestResults, setLatestResults] = useState<QuizResult[]>([]) // global latest 10
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({})
  const [latestByQuiz, setLatestByQuiz] = useState<Record<string, QuizResult | null>>({})

  // detail modal
  const [detail, setDetail] = useState<DetailState>({
    open: false,
    quizType: null,
    title: "",
    results: [],
    progress: null,
  })
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null)

  // =======================
  // Auth
  // =======================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login")
        return
      }
      setUser(u)
    })
    return () => unsub()
  }, [router])

  // =======================
  // Attack rank（3ゲーム）
  // =======================
  useEffect(() => {
    if (!user) {
      setAttackRanks({})
      return
    }
    let cancelled = false
    ;(async () => {
      const uid = user.uid
      const games = ["tile-drop", "flash-judge", "memory-burst"] as const
      const next: Record<string, { rank: number | null; bestScore: number }> = {}
      for (const gameId of games) {
        try {
          const me = await fetchMyAttackRank({ gameId, uid })
          next[gameId] = { rank: me.rank, bestScore: me.bestScore }
        } catch {
          next[gameId] = { rank: null, bestScore: 0 }
        }
      }
      if (!cancelled) setAttackRanks(next)
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  // =======================
  // 業種ロード（Firestore → localStorage）
  // =======================
  useEffect(() => {
    ;(async () => {
      if (!user?.uid) return
      try {
        const userRef = doc(db, "users", user.uid)
        const snap = await getDoc(userRef)
        const userData = snap.exists() ? ((snap.data() as any) ?? {}) : {}
        const v = userData?.industry ?? null
        const badgeList = Array.isArray(userData?.badges) ? userData.badges.filter((x: any) => typeof x === "string") : []
        setBadges(badgeList)
        const billingData = userData?.billing && typeof userData.billing === "object" ? userData.billing as BillingData : null
        setBilling(billingData)
        if (isIndustryId(v)) {
          setIndustry(v)
          try {
            localStorage.setItem(LS_INDUSTRY_KEY, v)
          } catch {}
          return
        }
      } catch {
        // ignore
      }

      try {
        const saved = localStorage.getItem(LS_INDUSTRY_KEY)
        if (isIndustryId(saved)) setIndustry(saved)
      } catch {}
    })()
  }, [user?.uid])

  // =======================
  // Load summary（results/progress）
  // =======================
  useEffect(() => {
    ;(async () => {
      if (!user?.uid) return
      setLoading(true)
      setError("")
      try {
        const resultsRef = collection(db, "users", user.uid, "results")
        const qAll = query(resultsRef, orderBy("createdAt", "desc"), limit(200))
        const snapAll = await getDocs(qAll)

        const all: QuizResult[] = snapAll.docs.map((d) => {
          const data = d.data() as any
          return {
            score: Number(data.score ?? 0),
            total: Number(data.total ?? 0),
            accuracy: typeof data.accuracy === "number" ? data.accuracy : undefined,
            quizType: data.quizType ?? undefined,
            mode: data.mode ?? undefined,
            createdAt: data.createdAt ?? null,
          }
        })

        setAllResults(all)
        setLatestResults(all.slice(0, 10))

        const byQuiz: Record<string, QuizResult | null> = {}
        for (const r of all) {
          const qt = String(r.quizType ?? "")
          if (!qt) continue
          if (byQuiz[qt] == null) byQuiz[qt] = r
        }
        setLatestByQuiz(byQuiz)

        const prog: Record<string, Progress> = {}
        await Promise.all(
          quizCatalog.map(async (q) => {
            try {
              const pRef = doc(db, "users", user.uid, "progress", q.id)
              const pSnap = await getDoc(pRef)
              prog[q.id] = pSnap.exists() ? ((pSnap.data() as any) ?? {}) : {}
            } catch {
              prog[q.id] = {}
            }
          })
        )
        setProgressMap(prog)
      } catch (e) {
        console.error(e)
        setError("読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.uid])

  // =======================
  // detail open/close
  // =======================
  const openDetail = async (quizType: string, title: string) => {
    if (!user?.uid) return
    setDetailLoading(true)
    setDetailTargetId(quizType)
    try {
      // ✅ まず allResults から10件切り出し（軽い）
      const fromCache = allResults.filter((r) => String(r.quizType ?? "") === quizType).slice(0, 10)

      // ✅ progress は正確に取る
      const pRef = doc(db, "users", user.uid, "progress", quizType)
      const pSnap = await getDoc(pRef)
      const prog = pSnap.exists() ? ((pSnap.data() as any) ?? {}) : null

      setDetail({
        open: true,
        quizType,
        title,
        results: fromCache,
        progress: prog,
      })
    } catch (e) {
      console.error(e)
      setError("詳細の取得に失敗しました")
    } finally {
      setDetailLoading(false)
      setDetailTargetId(null)
    }
  }

  const closeDetail = () => setDetail((d) => ({ ...d, open: false }))

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } finally {
      router.push("/")
    }
  }

  // =======================
  // catalog visible by industry
  // =======================
  const allowedSet = useMemo(() => buildAllowed(industry), [industry])

  const visibleCatalog = useMemo(() => {
    const enabled = quizCatalog.filter((q) => q.enabled).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    if (!industry || showAllCards) return enabled
    return enabled.filter((q) => allowedSet.has(q.id))
  }, [industry, showAllCards, allowedSet])

  const badgeItems = useMemo(() => {
  return getPreviewBadgeMeta(badges, 8)
}, [badges])

const unlockedBadgeCount = useMemo(() => getUnlockedBadgeCount(badges), [badges])
const totalBadgeCount = useMemo(() => getTotalBadgeCount(), [badges])
const currentPlanLabel = useMemo(() => getPlanLabel(billing?.currentPlan ?? null), [billing])

  // =======================
  // summaries
  // =======================
  const totalSessionsAll = useMemo(() => {
    return Object.values(progressMap).reduce((sum, p) => sum + Number(p.totalSessions ?? 0), 0)
  }, [progressMap])

  const todaySessionsAll = useMemo(() => {
    return Object.values(progressMap).reduce((sum, p) => sum + Number(p.todaySessions ?? 0), 0)
  }, [progressMap])

  const streakMax = useMemo(() => {
    const all = Object.values(progressMap).map((p) => Number(p.bestStreak ?? 0))
    return all.length ? Math.max(...all) : 0
  }, [progressMap])

  const latestAcc = useMemo(() => {
    const r = latestResults[0]
    return r ? calcAcc(r) : null
  }, [latestResults])

  // =======================
  // render
  // =======================
  if (loading) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <div style={S.card}>読み込み中...</div>
        </div>
      </main>
    )
  }

  return (
    <main style={S.page}>
      {/* Drawer overlay */}
      {drawerOpen ? <div style={S.drawerOverlay} onClick={() => setDrawerOpen(false)} /> : null}

      {/* Drawer */}
      {drawerOpen ? (
        <aside style={S.drawer} aria-label="menu" onClick={(e) => e.stopPropagation()}>
          <div style={S.drawerHead}>
            <div style={{ fontWeight: 900 }}>メニュー</div>
            <button style={S.drawerClose} onClick={() => setDrawerOpen(false)} type="button">
              ✕
            </button>
          </div>

          <nav style={S.nav}>
            {APP_MENU.map((it) => {
              const href =
                it.href === "/select-mode" ? withIndustry(it.href) : it.href
              return (
                <Link
                  key={it.href}
                  style={S.navItem}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                >
                  {it.icon} {it.label}
                </Link>
              )
            })}
          </nav>
        </aside>
      ) : null}

      <div style={S.wrap}>
        {/* Header */}
        <header style={S.header}>
          <div style={S.brand}>
            <div style={S.logo}>📚</div>
            <div>
              <div style={S.brandName}>マイページ</div>
              <div style={S.brandSub}>進捗・履歴・教材一覧</div>
            </div>
          </div>

          <button style={S.burgerBtn} onClick={() => setDrawerOpen(true)} type="button" aria-label="menu">
            ☰
          </button>
        </header>

        {error ? <div style={S.alert}>{error}</div> : null}

        {/* 🏆 アタック戦績（縦並び） */}
        <section style={S.card}>
          <div style={S.cardHeadRow}>
            <div style={S.cardTitle}>🏆 アタック戦績</div>
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <GameRow
              icon="🔨"
              title="文字ブレイク"
              best={attackRanks["tile-drop"]?.bestScore ?? 0}
              rank={attackRanks["tile-drop"]?.rank ?? null}
              onClick={() => router.push(`/game?type=japanese-n4&kind=tile-drop&mode=attack`)}
            />
            <GameRow
              icon="⚡"
              title="瞬判ジャッジ"
              best={attackRanks["flash-judge"]?.bestScore ?? 0}
              rank={attackRanks["flash-judge"]?.rank ?? null}
              onClick={() => router.push(`/game?type=japanese-n4&kind=flash-judge&mode=attack`)}
            />
            <GameRow
              icon="🧠"
              title="フラッシュ記憶"
              best={attackRanks["memory-burst"]?.bestScore ?? 0}
              rank={attackRanks["memory-burst"]?.rank ?? null}
              onClick={() => router.push(`/game?type=japanese-n4&kind=memory-burst&mode=attack`)}
            />
          </div>
        </section>

        {/* ✅ あなたの設定 */}
        <section style={S.card}>
          <div style={S.cardHeadRow}>
            <div style={S.cardTitle}>あなたの設定</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.linkBtn} onClick={() => router.push(withIndustry("/select-quizzes"))} title="教材選択へ">
                教材を変更 →
              </button>

              <button style={S.linkBtn} onClick={() => setShowAllCards((v) => !v)} title="教材カードの表示切替">
                {showAllCards ? "業種で絞る" : "すべて表示"}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <div style={S.kv}>
              <div style={S.kvLabel}>選択中の業種</div>
              <div style={S.kvValue}>{industry ? INDUSTRY_LABEL[industry] : "未設定"}</div>
              <div style={S.kvHint}>
                {industry
                  ? "マイページの教材カードは業種で最適化されています（日本語基礎は常に表示）"
                  : "業種を選ぶと、教材カードが最適化されます"}
              </div>
            </div>

            <div style={S.kv}>
              <div style={S.kvLabel}>現在のプラン</div>
              <div style={S.kvValue}>{currentPlanLabel}</div>
              <div style={S.kvHint}>契約状態や有効期限は下の「ご利用プラン」で確認できます</div>
            </div>

            {/* ✅ 進捗（2列・コンパクト） */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <MiniStat label="総学習回数" value={`${totalSessionsAll}`} sub="全教材合計" />
              <MiniStat label="最新の合格率" value={latestAcc === null ? "—" : `${latestAcc}%`} sub="直近の結果" />
              <MiniStat label="今日の学習" value={`${todaySessionsAll}`} sub="今日の回数" />
              <MiniStat label="最大streak" value={streakMax ? String(streakMax) : "—"} sub="教材別の最大streak" />
            </div>
          </div>
        </section>

        <section style={S.card}>
          <PendingPaymentNotice billing={billing} />
          <BillingStatusCard billing={billing} plansHref="/plans" />
        </section>

        {/* AI学習履歴 */}
        <section style={S.card}>
          <div style={S.cardHeadRow}>
            <div>
              <div style={S.cardTitle}>AI学習履歴</div>
              <div style={S.miniNote}>会話・スピーキングの結果を確認</div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/mypage/conversation-history")}
              style={{
                textAlign: "left",
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                会
              </div>

              <div
                style={{
                  fontWeight: 900,
                  fontSize: 17,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                AI会話履歴
              </div>

              <div
                style={{
                  fontSize: 13,
                  opacity: 0.75,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                会話レッスンの履歴、スコア、会話ログを確認できます。
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#1d4ed8",
                }}
              >
                履歴を見る →
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/mypage/speaking-history")}
              style={{
                textAlign: "left",
                background: "white",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 16,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#f0fdf4",
                  color: "#15803d",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                話
              </div>

              <div
                style={{
                  fontWeight: 900,
                  fontSize: 17,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                AIスピーキング履歴
              </div>

              <div
                style={{
                  fontSize: 13,
                  opacity: 0.75,
                  lineHeight: 1.7,
                  marginBottom: 12,
                }}
              >
                スピーキング練習の結果や評価の推移を確認できます。
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#15803d",
                }}
              >
                履歴を見る →
              </div>
            </button>
          </div>
        </section>
        <section style={S.card}>
  <div style={S.cardHeadRow}>
    <div>
      <div style={S.cardTitle}>実績バッジ</div>
      <div style={S.miniNote}>
        {unlockedBadgeCount} / {totalBadgeCount} 獲得
      </div>
    </div>

    <button
      style={S.linkBtn}
      onClick={() => router.push("/mypage/achievements")}
    >
      実績一覧 →
    </button>
  </div>

  {badgeItems.length === 0 ? (
    <div style={{ marginTop: 10, opacity: 0.75 }}>
      まだ獲得済みバッジはありません。学習やゲームを進めて集めよう！
    </div>
  ) : (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      {badgeItems.map((b) => {
        const c = getRarityColors(b.rarity)

        return (
          <div
            key={b.id}
            style={{
              border: `1px solid ${c.border}`,
              background: c.bg,
              borderRadius: 18,
              padding: 12,
              boxShadow: `0 10px 22px ${c.glow}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                margin: "0 auto",
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.7)",
                fontSize: 28,
              }}
            >
              {b.icon}
            </div>

            <div
              style={{
                marginTop: 8,
                fontWeight: 900,
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              {b.label}
            </div>
          </div>
        )
      })}
    </div>
  )}
</section>

        {/* 教材カード：業種で最適化（最強：行タップで詳細） */}
        <section style={S.card}>
          <div style={S.cardHeadRow}>
            <div style={S.cardTitle}>教材</div>
            <button style={S.linkBtn} onClick={() => router.push("/contents")}>
              教材一覧 →
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {visibleCatalog.map((q) => {
              const p = progressMap[q.id] ?? {}
              const last = latestByQuiz[q.id] ?? null

              const totalSessions = Number(p.totalSessions ?? 0)
              const streak = Number(p.streak ?? 0)
              const lastAcc = last ? calcAcc(last as any) : null

              const isThisLoading = detailLoading && detailTargetId === q.id

              return (
                <div
                  key={q.id}
                  style={{
                    ...S.compactRow,
                    cursor: detailLoading ? "wait" : "pointer",
                    opacity: isThisLoading ? 0.7 : 1,
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (detailLoading) return
                    openDetail(q.id, q.title)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      if (detailLoading) return
                      openDetail(q.id, q.title)
                    }
                  }}
                  aria-label={`${q.title} の詳細`}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={S.rowTitle}>{q.title}</div>
                    <div style={S.rowSub}>
                      {lastAcc === null ? "最新：—" : `最新：${lastAcc}%`} ・ 総回数：{totalSessions} ・ streak：
                      {streak || "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={S.pillSmall}>{isThisLoading ? "読込中..." : "詳細"}</span>
                    <span style={{ fontWeight: 900, opacity: 0.55 }}>▶</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 最新10件（全体） */}
        <section style={S.card}>
          <div style={S.cardHeadRow}>
            <div style={S.cardTitle}>最新の結果（直近10件）</div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {latestResults.length === 0 ? (
              <div style={S.miniNote}>まだ結果がありません。</div>
            ) : (
              latestResults.map((r, i) => {
                const qt = String(r.quizType ?? "")
                const title = titleByQuizType(qt)
                const d = toDate(r.createdAt)
                const acc = calcAcc(r)
                return (
                  <div key={i} style={S.resultRow}>
                    <div style={{ minWidth: 0 }}>
                      <div style={S.resultTitle}>{title}</div>
                      <div style={S.resultSub}>
                        {d ? fmtDate(d) : "—"} ・ {r.score}/{r.total} ・ {acc}%
                      </div>
                    </div>
                    <div style={S.resultPill}>{r.mode ?? "—"}</div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Detail modal */}
        {detail.open ? (
          <div style={S.modalOverlay} onClick={closeDetail}>
            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
              <div style={S.modalHead}>
                <div style={{ fontWeight: 900 }}>{detail.title}</div>
                <button style={S.modalClose} onClick={closeDetail} type="button">
                  ✕
                </button>
              </div>

              <div style={S.modalBody}>
                <div style={S.modalGrid}>
                  <div style={S.modalCard}>
                    <div style={S.modalLabel}>総回数</div>
                    <div style={S.modalValue}>{Number(detail.progress?.totalSessions ?? 0)}</div>
                  </div>
                  <div style={S.modalCard}>
                    <div style={S.modalLabel}>今日</div>
                    <div style={S.modalValue}>{Number(detail.progress?.todaySessions ?? 0)}</div>
                  </div>
                  <div style={S.modalCard}>
                    <div style={S.modalLabel}>streak</div>
                    <div style={S.modalValue}>{Number(detail.progress?.streak ?? 0)}</div>
                  </div>
                  <div style={S.modalCard}>
                    <div style={S.modalLabel}>best</div>
                    <div style={S.modalValue}>{Number(detail.progress?.bestStreak ?? 0)}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>点数推移（直近10件）</div>
                  <div style={{ color: "#111" }}>
                    <Sparkline values={detail.results.slice().reverse().map((r) => calcAcc(r))} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>直近10件</div>
                  {detail.results.length === 0 ? (
                    <div style={S.miniNote}>まだ結果がありません。</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {detail.results.map((r, idx) => {
                        const d = toDate(r.createdAt)
                        const acc = calcAcc(r)
                        return (
                          <div key={idx} style={S.resultRow}>
                            <div style={{ minWidth: 0 }}>
                              <div style={S.resultTitle}>{d ? fmtDate(d) : "—"}</div>
                              <div style={S.resultSub}>
                                {r.score}/{r.total} ・ {acc}%
                              </div>
                            </div>
                            <div style={S.resultPill}>{r.mode ?? "—"}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f6f7fb", padding: 18 },
  wrap: { maxWidth: 980, margin: "0 auto" },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  brand: { display: "flex", alignItems: "center", gap: 10 },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: "#111827",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  },
  brandName: { fontWeight: 900, fontSize: 16 },
  brandSub: { opacity: 0.7, fontSize: 12 },

  burgerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    boxShadow: "0 6px 14px rgba(0,0,0,0.04)",
    fontSize: 22,
    fontWeight: 900,
    cursor: "pointer",
  },

  alert: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#991b1b",
    fontWeight: 800,
  },

  card: {
    marginTop: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  },
  cardHeadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  cardTitle: { fontWeight: 900, fontSize: 16 },

  linkBtn: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  kvRow: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  kv: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 16,
    padding: 12,
  },
  kvLabel: { fontSize: 12, opacity: 0.7, fontWeight: 900 },
  kvValue: { marginTop: 6, fontSize: 22, fontWeight: 900 },
  kvHint: { marginTop: 6, fontSize: 12, opacity: 0.75, lineHeight: 1.5 },

  compactRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
  },
  rowTitle: { fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rowSub: { marginTop: 4, fontSize: 12, opacity: 0.75 },

  pillSmall: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#111827",
    color: "white",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  smallBtn: {
    border: "none",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
  },
  smallGhostBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 900,
    background: "#fff",
    cursor: "pointer",
  },

  miniNote: { fontSize: 12, opacity: 0.7 },

  resultRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#f9fafb",
  },
  resultTitle: { fontWeight: 900, fontSize: 13 },
  resultSub: { marginTop: 4, fontSize: 12, opacity: 0.75 },
  resultPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#111827",
    color: "white",
    fontWeight: 900,
    fontSize: 12,
    whiteSpace: "nowrap",
  },

  // Drawer
  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000 },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(320px, 86vw)",
    height: "100vh",
    background: "#fff",
    zIndex: 1001,
    padding: 16,
    boxShadow: "-6px 0 22px rgba(0,0,0,0.18)",
  },
  drawerHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  drawerClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 900,
  },
  nav: { display: "flex", flexDirection: "column", gap: 10 },
  navItem: {
    textDecoration: "none",
    color: "#111",
    fontWeight: 900,
    padding: "10px 10px",
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  divider: { height: 1, background: "#e5e7eb", margin: "6px 0" },
  dangerBtn: {
    border: "none",
    borderRadius: 14,
    padding: "12px 12px",
    fontWeight: 900,
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 2000,
    display: "grid",
    placeItems: "center",
    padding: 14,
  },
  modal: {
    width: "min(720px, 92vw)",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 48px rgba(0,0,0,0.20)",
  },
  modalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottom: "1px solid #e5e7eb",
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 900,
  },
  modalBody: { padding: 14 },
  modalGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 },
  modalCard: { border: "1px solid #e5e7eb", borderRadius: 16, padding: 12, background: "#f9fafb" },
  modalLabel: { fontSize: 12, opacity: 0.7, fontWeight: 900 },
  modalValue: { marginTop: 6, fontSize: 22, fontWeight: 900 },
}
