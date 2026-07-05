"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"
import { auth, db } from "@/app/lib/firebase"
import { getQuizDef } from "@/app/data/quizCatalog"

type UserDoc = {
  displayName?: string
  email?: string
  role?: string
  accountType?: string
  companyCode?: string | null
  companyName?: string | null
}
type ResultDoc = {
  score?: number
  total?: number
  correctCount?: number
  totalQuestions?: number
  accuracy?: number
  quizType?: string
  createdAt?: any
  updatedAt?: any
}
type ProgressDoc = {
  quizType?: string
  totalSessions?: number
  todaySessions?: number
  streak?: number
  bestStreak?: number
  lastStudyDate?: string
  lastStudiedAt?: any
  updatedAt?: any
}
type LearnerRow = {
  uid: string
  displayName: string
  email: string
  companyCode: string
  companyName: string
  studyCount: number
  averageAccuracy: number | null
  lastStudiedAt: Date | null
  badgeCount: number
  mainLearning: string
  status: "未学習" | "学習中" | "7日以上未学習"
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function getUserDocWithRetry(uid: string, maxRetry = 5) {
  for (let i = 0; i < maxRetry; i += 1) {
    const snap = await getDoc(doc(db, "users", uid))
    if (snap.exists()) return snap
    await sleep(250 * (i + 1))
  }
  return getDoc(doc(db, "users", uid))
}

function parseDate(value: any): Date | null {
  if (!value) return null
  try {
    if (typeof value?.toDate === "function") return value.toDate()
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function formatDate(value: Date | null) {
  return value ? value.toLocaleString("ja-JP") : "-"
}

function formatPercent(value: number | null) {
  return value == null || Number.isNaN(value) ? "-" : `${Math.round(value)}%`
}

function getStatus(last: Date | null, count: number): LearnerRow["status"] {
  if (!last || count === 0) return "未学習"
  return Date.now() - last.getTime() > 1000 * 60 * 60 * 24 * 7 ? "7日以上未学習" : "学習中"
}

function getAccuracy(r: ResultDoc) {
  if (typeof r.accuracy === "number") return r.accuracy
  if (typeof r.correctCount === "number" && typeof r.totalQuestions === "number" && r.totalQuestions > 0) {
    return (r.correctCount / r.totalQuestions) * 100
  }
  if (typeof r.score === "number" && typeof r.total === "number" && r.total > 0) {
    return (r.score / r.total) * 100
  }
  return null
}

function quizLabel(quizType?: string) {
  if (!quizType) return "未設定"
  return getQuizDef(quizType)?.title ?? quizType
}

export default function CompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [companyName, setCompanyName] = useState("企業管理画面")
  const [rows, setRows] = useState<LearnerRow[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/company/login")
        return
      }
      try {
        setLoading(true)
        setError("")
        await firebaseUser.getIdToken(true)
        const meSnap = await getUserDocWithRetry(firebaseUser.uid)
        if (!meSnap.exists()) {
          setError("管理者情報が見つかりません。")
          setLoading(false)
          return
        }
        const me = meSnap.data() as UserDoc
        const role = me.role ?? ""
        const code = me.companyCode ?? ""
        if (role !== "admin" && role !== "company_admin") {
          setError("この画面を見る権限がありません。")
          setLoading(false)
          return
        }
        if (role === "company_admin" && !code) {
          setError("企業コードが設定されていません。")
          setLoading(false)
          return
        }

        setCompanyCode(code || "ALL")
        setCompanyName(me.companyName || "企業管理画面")

        const usersSnap =
          role === "admin" && !code
            ? await getDocs(collection(db, "users"))
            : await getDocs(query(collection(db, "users"), where("companyCode", "==", code)))

        const learners = usersSnap.docs
          .map((d) => ({ uid: d.id, ...(d.data() as UserDoc) }))
          .filter((u) => u.uid !== firebaseUser.uid && u.role !== "admin" && u.role !== "company_admin")

        const built: LearnerRow[] = []
        for (const learner of learners) {
          const [resultsSnap, progressSnap, achievementSnap] = await Promise.all([
            getDocs(collection(db, "users", learner.uid, "results")).catch(() => null),
            getDocs(collection(db, "users", learner.uid, "progress")).catch(() => null),
            getDocs(collection(db, "users", learner.uid, "achievements")).catch(() => null),
          ])
          const results = resultsSnap?.docs.map((d) => d.data() as ResultDoc) ?? []
          const progresses = progressSnap?.docs.map((d) => ({ quizType: d.id, ...(d.data() as ProgressDoc) })) ?? []
          const accs = results.map(getAccuracy).filter((v): v is number => typeof v === "number")
          const averageAccuracy = accs.length ? accs.reduce((a, b) => a + b, 0) / accs.length : null

          let last: Date | null = null
          for (const r of results) {
            const d = parseDate(r.createdAt ?? r.updatedAt)
            if (d && (!last || d > last)) last = d
          }
          for (const p of progresses) {
            const d = parseDate(p.lastStudiedAt ?? p.updatedAt ?? (p.lastStudyDate ? `${p.lastStudyDate}T00:00:00+09:00` : null))
            if (d && (!last || d > last)) last = d
          }

          const progressSessions = progresses.reduce((sum, p) => sum + (typeof p.totalSessions === "number" ? p.totalSessions : 0), 0)
          const studyCount = results.length + progressSessions
          const topProgress = [...progresses].sort((a, b) => (b.totalSessions ?? 0) - (a.totalSessions ?? 0))[0]
          built.push({
            uid: learner.uid,
            displayName: learner.displayName || "-",
            email: learner.email || "-",
            companyCode: learner.companyCode || "-",
            companyName: learner.companyName || "-",
            studyCount,
            averageAccuracy,
            lastStudiedAt: last,
            badgeCount: achievementSnap?.size ?? 0,
            mainLearning: topProgress ? quizLabel(topProgress.quizType) : results[0]?.quizType ? quizLabel(results[0].quizType) : "-",
            status: getStatus(last, studyCount),
          })
        }
        setRows(built.sort((a, b) => (b.lastStudiedAt?.getTime() ?? 0) - (a.lastStudiedAt?.getTime() ?? 0)))
      } catch (e) {
        console.error(e)
        setError("企業管理画面の読み込みに失敗しました。")
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [router])

  const summary = useMemo(() => {
    const total = rows.length
    const active = rows.filter((r) => r.status === "学習中").length
    const noStudy = rows.filter((r) => r.status === "未学習").length
    const avgValues = rows.map((r) => r.averageAccuracy).filter((v): v is number => typeof v === "number")
    const avg = avgValues.length ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length : null
    return { total, active, noStudy, avg }
  }, [rows])

  function exportCsv() {
    const header = ["名前", "メール", "企業コード", "学習回数", "平均正答率", "最終学習日", "進行中の学習", "バッジ数", "状態"]
    const body = rows.map((r) => [
      r.displayName,
      r.email,
      r.companyCode,
      String(r.studyCount),
      formatPercent(r.averageAccuracy),
      formatDate(r.lastStudiedAt),
      r.mainLearning,
      String(r.badgeCount),
      r.status,
    ])
    const csv = [header, ...body].map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `manufacturing-japanese-company-${companyCode || "all"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyCode() {
    if (!companyCode || companyCode === "ALL") return
    await navigator.clipboard.writeText(companyCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <AppHeader title="企業管理画面" />
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", padding: "18px 0" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#64748b", letterSpacing: ".14em" }}>MANUFACTURING JAPANESE</p>
            <h1 style={{ margin: "8px 0 6px", fontSize: 34 }}>{companyName}</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              {loading ? "読み込み中..." : error || `${summary.total}名の学習者を表示しています。`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copyCode} style={subBtn} disabled={!companyCode || companyCode === "ALL"}>
              {copied ? "コピーしました" : `企業コード ${companyCode || "-"}`}
            </button>
            <button onClick={exportCsv} style={primaryBtn} disabled={!rows.length}>CSV出力</button>
            <Link href="/company/setup" style={subLink}>設定メモ</Link>
          </div>
        </div>

        {error ? <div style={errorBox}>{error}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
          <Stat title="学習者数" value={`${summary.total}名`} />
          <Stat title="学習中" value={`${summary.active}名`} />
          <Stat title="未学習" value={`${summary.noStudy}名`} />
          <Stat title="平均正答率" value={formatPercent(summary.avg)} />
        </div>

        <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 12px 30px rgba(15,23,42,.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr>
                <Th>名前</Th>
                <Th>メール</Th>
                <Th>状態</Th>
                <Th>学習回数</Th>
                <Th>平均正答率</Th>
                <Th>最終学習日</Th>
                <Th>進行中の学習</Th>
                <Th>バッジ</Th>
                <Th>詳細</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uid}>
                  <Td>{r.displayName}</Td>
                  <Td>{r.email}</Td>
                  <Td><Status label={r.status} /></Td>
                  <Td>{r.studyCount}</Td>
                  <Td>{formatPercent(r.averageAccuracy)}</Td>
                  <Td>{formatDate(r.lastStudiedAt)}</Td>
                  <Td>{r.mainLearning}</Td>
                  <Td>{r.badgeCount}</Td>
                  <Td><Link href={`/company/${r.uid}`} style={{ color: "#2563eb", fontWeight: 900, textDecoration: "none" }}>見る</Link></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !rows.length ? (
            <div style={{ padding: 24, color: "#64748b" }}>
              まだ学習者が表示されていません。学習者のユーザー情報に企業コードを設定すると、ここに表示されます。
            </div>
          ) : null}
        </div>
        <LegalFooter />
      </section>
    </main>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  )
}

function Status({ label }: { label: LearnerRow["status"] }) {
  const bg = label === "学習中" ? "#ecfdf5" : label === "7日以上未学習" ? "#fffbeb" : "#f1f5f9"
  const color = label === "学習中" ? "#047857" : label === "7日以上未学習" ? "#b45309" : "#475569"
  return <span style={{ display: "inline-flex", padding: "5px 9px", borderRadius: 999, background: bg, color, fontWeight: 900, fontSize: 12 }}>{label}</span>
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: 13, borderBottom: "1px solid #e2e8f0", fontSize: 13, color: "#475569" }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: 13, borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>{children}</td>
}

const primaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "none",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
}
const subBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 900,
  cursor: "pointer",
}
const subLink: React.CSSProperties = { ...subBtn, display: "inline-flex", textDecoration: "none" }
const errorBox: React.CSSProperties = {
  marginBottom: 16,
  padding: 14,
  borderRadius: 8,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#dc2626",
  fontWeight: 800,
}
