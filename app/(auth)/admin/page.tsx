"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore"
import { useAuth } from "@/app/lib/useAuth"
import { db } from "@/app/lib/firebase"
import { ensureUserProfile, getUserRole } from "@/app/lib/firestore"

// ✅ 追加：quizCatalog から教材一覧を作る
import { quizCatalog } from "@/app/data/quizCatalog"

type UserRole = "admin" | "user"

type UserDocData = {
  email?: string | null
  displayName?: string | null
  role?: UserRole
}

type StudyProgress = {
  totalSessions: number
  todaySessions: number
  lastStudyDate: string
  streak: number
  streakUpdatedDate: string
  bestStreak: number
}

type ExamAvg = {
  count: number
  avgScore: number
  avgTotal: number
  avgAcc: number // 0-1
}

type Row = {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole | null
  progress: Record<string, StudyProgress | null>
  examAvg: Record<string, ExamAvg | null>
}

/**
 * 🎯 有効な教材ID一覧（quizCatalog基準）
 * - enabled=false の教材は自動的に除外
 * - order 順で統一
 */
const QUIZ_TYPES = quizCatalog
  .filter((q) => q.enabled)
  .sort((a, b) => a.order - b.order)
  .map((q) => q.id)

function jstDayKey(d = new Date()) {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)
  } catch {
    const local = new Date(d.getTime() + 9 * 60 * 60 * 1000)
    return local.toISOString().slice(0, 10)
  }
}

function safeProgress(p: any): StudyProgress {
  const base: StudyProgress = {
    totalSessions: 0,
    todaySessions: 0,
    lastStudyDate: "",
    streak: 0,
    streakUpdatedDate: "",
    bestStreak: 0,
  }
  if (!p) return base
  return {
    totalSessions: typeof p.totalSessions === "number" ? p.totalSessions : 0,
    todaySessions: typeof p.todaySessions === "number" ? p.todaySessions : 0,
    lastStudyDate: typeof p.lastStudyDate === "string" ? p.lastStudyDate : "",
    streak: typeof p.streak === "number" ? p.streak : 0,
    streakUpdatedDate:
      typeof p.streakUpdatedDate === "string" ? p.streakUpdatedDate : "",
    bestStreak: typeof p.bestStreak === "number" ? p.bestStreak : 0,
  }
}

// ✅ accuracy が 0-1 / 0-100 の混在でも必ず 0-1 に揃える
function normalizeAcc(value: unknown, score: number, total: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    // 0〜1
    if (value >= 0 && value <= 1.2) return value
    // 0〜100(%) っぽい値
    if (value > 1.2 && value <= 100) return value / 100
  }
  // accuracy が無い/壊れてる → score/total
  return total > 0 ? score / total : 0
}

async function fetchProgress(uid: string, quizType: string): Promise<StudyProgress | null> {
  try {
    const ref = doc(db, "users", uid, "progress", quizType)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return safeProgress(snap.data())
  } catch {
    return null
  }
}

async function fetchExamAverage(uid: string, quizType: string): Promise<ExamAvg | null> {
  try {
    const col = collection(db, "users", uid, "results")
    const qy = query(col, where("quizType", "==", quizType))
    const snap = await getDocs(qy)

    if (snap.empty) return null

    let sumScore = 0
    let sumTotal = 0
    let sumAcc = 0
    let count = 0

    snap.forEach((d) => {
      const r = d.data() as any
      const score = typeof r.score === "number" ? r.score : 0
      const total = typeof r.total === "number" ? r.total : 0
      const acc = normalizeAcc(r.accuracy, score, total)

      sumScore += score
      sumTotal += total
      sumAcc += acc
      count += 1
    })

    return {
      count,
      avgScore: sumScore / count,
      avgTotal: sumTotal / count,
      avgAcc: sumAcc / count,
    }
  } catch {
    return null
  }
}

// ✅ role の更新（adminのみ可能：Rulesで制御）
async function setUserRole(targetUid: string, role: UserRole) {
  const ref = doc(db, "users", targetUid)
  await setDoc(
    ref,
    {
      role,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// ✅ 見出しを「最大2行」で省略表示
const ThText = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      wordBreak: "break-word",
      lineHeight: 1.2,
      fontSize: 13,
    }}
  >
    {children}
  </span>
)

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [rows, setRows] = useState<Row[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [showOnlyNotStudiedToday, setShowOnlyNotStudiedToday] = useState(false)

  const today = jstDayKey()

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"))

    const baseList: Row[] = snap.docs.map((d) => {
      const data = d.data() as UserDocData
      const progress: Record<string, StudyProgress | null> = {}
      const examAvg: Record<string, ExamAvg | null> = {}
      for (const t of QUIZ_TYPES) {
        progress[t] = null
        examAvg[t] = null
      }
      return {
        uid: d.id,
        email: data.email ?? null,
        displayName: data.displayName ?? null,
        role: data.role ?? null,
        progress,
        examAvg,
      }
    })

    const enriched = await Promise.all(
      baseList.map(async (u) => {
        const progEntries = await Promise.all(
          QUIZ_TYPES.map(async (t) => [t, await fetchProgress(u.uid, t)] as const)
        )
        const avgEntries = await Promise.all(
          QUIZ_TYPES.map(async (t) => [t, await fetchExamAverage(u.uid, t)] as const)
        )

        const progress: Record<string, StudyProgress | null> = {}
        const examAvg: Record<string, ExamAvg | null> = {}
        for (const [t, p] of progEntries) progress[t] = p
        for (const [t, a] of avgEntries) examAvg[t] = a

        return { ...u, progress, examAvg }
      })
    )

    setRows(enriched)
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login")
      return
    }

    const init = async () => {
      setError(null)
      setReady(false)

      try {
        await ensureUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })

        const role = await getUserRole(user.uid)
        if (role !== "admin") {
          router.replace("/")
          return
        }

        await loadUsers()
      } catch (e: any) {
        setError(e?.code ? `${e.code}: ${e.message ?? ""}` : e?.message ?? "不明なエラー")
      } finally {
        setReady(true)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = rows

    if (needle) {
      list = list.filter((r) => {
        const s = `${r.displayName ?? ""} ${r.email ?? ""} ${r.uid}`.toLowerCase()
        return s.includes(needle)
      })
    }

    if (showOnlyNotStudiedToday) {
      list = list.filter((r) => {
        // いずれかの教材で今日やっていれば除外
        const didAny = QUIZ_TYPES.some((t) => {
          const p = r.progress[t]
          return (p?.lastStudyDate ?? "") === today && (p?.todaySessions ?? 0) > 0
        })
        return !didAny
      })
    }

    return list
  }, [rows, q, showOnlyNotStudiedToday, today])

  if (loading || !ready) return <p style={{ textAlign: "center" }}>読み込み中…</p>

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: "30px auto", padding: 16 }}>
        <h1>管理者ページ</h1>
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            border: "1px solid #fca5a5",
            background: "#fef2f2",
            color: "#991b1b",
            fontWeight: 800,
            whiteSpace: "pre-wrap",
          }}
        >
          エラー：
          {"\n"}
          {error}
        </div>
      </div>
    )
  }

  const label = (t: string) => {
    if (t === "japanese-n4") return "N4"
    if (t === "genba-listening") return "現場リスニング"
    return "外国免許"
  }

  const cell = (p: StudyProgress | null) => {
    if (!p) return { today: 0, total: 0, last: "-" }
    return {
      today: p.lastStudyDate === today ? (p.todaySessions ?? 0) : 0,
      total: p.totalSessions ?? 0,
      last: p.lastStudyDate || "-",
    }
  }

  const avgText = (a: ExamAvg | null) => {
    if (!a || a.count === 0) return "-"
    const score = Number.isFinite(a.avgScore) ? a.avgScore.toFixed(1) : "0.0"
    const total = Number.isFinite(a.avgTotal) ? a.avgTotal.toFixed(1) : "0.0"
    const acc = Number.isFinite(a.avgAcc) ? Math.round(a.avgAcc * 100) : 0
    return `${score}/${total}（${acc}%）`
  }

  const thStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: 8,
    textAlign: "center",
    background: "#f9fafb",
    whiteSpace: "normal",
    overflow: "hidden",
  }

  const tdStyle: React.CSSProperties = {
    border: "1px solid #ccc",
    padding: 8,
    verticalAlign: "middle",
    textAlign: "center",
    whiteSpace: "nowrap",
  }

  const tdLeft: React.CSSProperties = {
    ...tdStyle,
    textAlign: "left",
    whiteSpace: "normal",
    wordBreak: "break-word",
  }

  const onPromote = async (targetUid: string) => {
    if (!user) return
    const ok = confirm(`UID: ${targetUid}\nこのユーザーを admin にしますか？`)
    if (!ok) return

    try {
      await setUserRole(targetUid, "admin")
      await loadUsers()
      alert("admin に変更しました")
    } catch (e: any) {
      alert(e?.code ? `${e.code}: ${e.message ?? ""}` : e?.message ?? "更新に失敗しました")
    }
  }

  const onDemote = async (targetUid: string) => {
    if (!user) return
    if (targetUid === user.uid) {
      const okSelf = confirm("自分を user に戻すと管理画面に入れなくなります。\n本当に実行しますか？")
      if (!okSelf) return
    } else {
      const ok = confirm(`UID: ${targetUid}\nこのユーザーを user に戻しますか？`)
      if (!ok) return
    }

    try {
      await setUserRole(targetUid, "user")
      await loadUsers()
      alert("user に変更しました")
    } catch (e: any) {
      alert(e?.code ? `${e.code}: ${e.message ?? ""}` : e?.message ?? "更新に失敗しました")
    }
  }

  return (
    <div style={{ maxWidth: 1300, margin: "30px auto", padding: 16 }}>
      <h1>管理者ページ</h1>

      <div style={{ display: "flex", gap: 10, margin: "12px 0 12px", flexWrap: "wrap" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="検索（名前 / メール / UID）"
          style={{
            flex: "1 1 320px",
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
          <input
            type="checkbox"
            checked={showOnlyNotStudiedToday}
            onChange={(e) => setShowOnlyNotStudiedToday(e.target.checked)}
          />
          今日未学習のみ（{today}）
        </label>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          戻る
        </button>
      </div>

      {filtered.length === 0 ? (
        <p>表示できるユーザーがいません。</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 1300,
              borderCollapse: "collapse",
              tableLayout: "fixed",
            }}
          >
            <colgroup>
              <col style={{ width: 120 }} /> {/* 名前 */}
              <col style={{ width: 240 }} /> {/* メール */}
              <col style={{ width: 260 }} /> {/* UID */}
              <col style={{ width: 90 }} /> {/* role */}

              {/* 今日（3） */}
              <col style={{ width: 100 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 120 }} />

              {/* 累計（3） */}
              <col style={{ width: 100 }} />
              <col style={{ width: 90 }} />
              <col style={{ width: 120 }} />

              {/* 模擬平均（3） */}
              <col style={{ width: 150 }} />
              <col style={{ width: 140 }} />
              <col style={{ width: 170 }} />

              {/* 操作 */}
              <col style={{ width: 140 }} />
            </colgroup>

            <thead>
              <tr>
                <th style={thStyle}><ThText>名前</ThText></th>
                <th style={thStyle}><ThText>メール</ThText></th>
                <th style={thStyle}><ThText>UID</ThText></th>
                <th style={thStyle}><ThText>role</ThText></th>

                {QUIZ_TYPES.map((t) => (
                  <th key={`${t}-today`} style={thStyle}>
                    <ThText>{label(t)} 今日</ThText>
                  </th>
                ))}
                {QUIZ_TYPES.map((t) => (
                  <th key={`${t}-total`} style={thStyle}>
                    <ThText>{label(t)} 累計</ThText>
                  </th>
                ))}
                {QUIZ_TYPES.map((t) => (
                  <th key={`${t}-avg`} style={thStyle}>
                    <ThText>{label(t)} 模擬平均</ThText>
                  </th>
                ))}

                <th style={thStyle}><ThText>操作</ThText></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const didToday = QUIZ_TYPES.some((t) => cell(u.progress[t]).today > 0)

                return (
                  <tr key={u.uid} style={{ background: didToday ? "#ecfdf5" : "#fff" }}>
                    <td style={tdLeft}>{u.displayName ?? "-"}</td>
                    <td style={tdLeft}>{u.email ?? "-"}</td>
                    <td style={{ ...tdLeft, fontSize: 12 }}>{u.uid}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{u.role ?? "-"}</td>

                    {QUIZ_TYPES.map((t) => (
                      <td key={`${u.uid}-${t}-today`} style={{ ...tdStyle, fontWeight: 800 }}>
                        {cell(u.progress[t]).today}
                      </td>
                    ))}

                    {QUIZ_TYPES.map((t) => (
                      <td key={`${u.uid}-${t}-total`} style={tdStyle}>
                        {cell(u.progress[t]).total}
                      </td>
                    ))}

                    {QUIZ_TYPES.map((t) => (
                      <td key={`${u.uid}-${t}-avg`} style={tdStyle}>
                        {avgText(u.examAvg[t])}
                        {u.examAvg[t]?.count ? (
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                            （{u.examAvg[t]!.count}回）
                          </div>
                        ) : null}
                      </td>
                    ))}

                    <td style={{ ...tdStyle, padding: 8 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <button
                          onClick={() => router.push(`/admin/${u.uid}`)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #ccc",
                            cursor: "pointer",
                            background: "#fff",
                            fontWeight: 700,
                          }}
                        >
                          詳細
                        </button>

                        {u.role !== "admin" ? (
                          <button
                            onClick={() => onPromote(u.uid)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #16a34a",
                              cursor: "pointer",
                              background: "#ecfdf5",
                              fontWeight: 800,
                            }}
                          >
                            adminにする
                          </button>
                        ) : (
                          <button
                            onClick={() => onDemote(u.uid)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #ef4444",
                              cursor: "pointer",
                              background: "#fef2f2",
                              fontWeight: 800,
                            }}
                          >
                            userに戻す
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        ※ progress は users/{`{uid}`}/progress/{`{quizType}`}、模擬平均は users/{`{uid}`}/results を quizType で集計
      </p>
    </div>
  )
}
