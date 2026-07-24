"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { collection, doc, getDoc, getDocs } from "firebase/firestore"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"
import { auth, db } from "@/app/lib/firebase"
import { getQuizDef } from "@/app/data/quizCatalog"

type UserDoc = {
  displayName?: string
  email?: string
  role?: string
  companyCode?: string | null
  companyName?: string | null
}
type ResultDoc = {
  quizType?: string
  score?: number
  total?: number
  correctCount?: number
  totalQuestions?: number
  accuracy?: number
  createdAt?: any
  updatedAt?: any
}
type ProgressDoc = {
  quizType?: string
  totalSessions?: number
  lastStudyDate?: string
  lastStudiedAt?: any
  updatedAt?: any
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

function formatDate(value: any) {
  const d = parseDate(value)
  return d ? d.toLocaleString("ja-JP") : "-"
}

function percent(r: ResultDoc) {
  if (typeof r.accuracy === "number") return `${Math.round(r.accuracy)}%`
  if (typeof r.correctCount === "number" && typeof r.totalQuestions === "number" && r.totalQuestions > 0) {
    return `${Math.round((r.correctCount / r.totalQuestions) * 100)}%`
  }
  if (typeof r.score === "number" && typeof r.total === "number" && r.total > 0) {
    return `${Math.round((r.score / r.total) * 100)}%`
  }
  return "-"
}

function quizLabel(id?: string) {
  return id ? getQuizDef(id)?.title ?? id : "-"
}

export default function CompanyUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ uid: string }>()
  const uid = params.uid

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null)
  const [results, setResults] = useState<ResultDoc[]>([])
  const [progresses, setProgresses] = useState<ProgressDoc[]>([])
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/company/login")
        return
      }
      try {
        setLoading(true)
        setError("")
        const meSnap = await getDoc(doc(db, "users", currentUser.uid))
        const me = meSnap.exists() ? (meSnap.data() as UserDoc) : null
        if (me?.role !== "admin" && me?.role !== "company_admin") {
          setError("この画面を見る権限がありません。")
          setLoading(false)
          return
        }

        const targetSnap = await getDoc(doc(db, "users", uid))
        if (!targetSnap.exists()) {
          setError("学習者が見つかりません。")
          setLoading(false)
          return
        }
        const target = targetSnap.data() as UserDoc
        if (me.role === "company_admin" && me.companyCode && target.companyCode !== me.companyCode) {
          setError("この学習者を見る権限がありません。")
          setLoading(false)
          return
        }

        const [resultsSnap, progressSnap, achievementSnap] = await Promise.all([
          getDocs(collection(db, "users", uid, "results")).catch(() => null),
          getDocs(collection(db, "users", uid, "progress")).catch(() => null),
          getDocs(collection(db, "users", uid, "achievements")).catch(() => null),
        ])
        setUserDoc(target)
        setResults(
          (resultsSnap?.docs.map((d) => d.data() as ResultDoc) ?? [])
            .filter((result) => Boolean(result.quizType && getQuizDef(result.quizType)))
            .sort(
              (a, b) =>
                (parseDate(b.createdAt ?? b.updatedAt)?.getTime() ?? 0) -
                (parseDate(a.createdAt ?? a.updatedAt)?.getTime() ?? 0),
            ),
        )
        setProgresses(
          (progressSnap?.docs.map((d) => ({ quizType: d.id, ...(d.data() as ProgressDoc) })) ?? [])
            .filter((progress) => Boolean(progress.quizType && getQuizDef(progress.quizType))),
        )
        setBadgeCount(achievementSnap?.size ?? 0)
      } catch (e) {
        console.error(e)
        setError("学習者詳細の読み込みに失敗しました。")
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [router, uid])

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <AppHeader title="学習者詳細" />
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: 20 }}>
        <Link href="/company" style={{ color: "#2563eb", fontWeight: 900, textDecoration: "none" }}>企業管理画面へ戻る</Link>
        <h1 style={{ margin: "18px 0 6px", fontSize: 32 }}>{userDoc?.displayName ?? "学習者"}</h1>
        <p style={{ margin: 0, color: "#64748b" }}>
          {loading ? "読み込み中..." : error || `${userDoc?.email ?? "-"} / バッジ ${badgeCount}個`}
        </p>

        {error ? <div style={errorBox}>{error}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
          <Stat title="企業コード" value={userDoc?.companyCode ?? "-"} />
          <Stat title="企業名" value={userDoc?.companyName ?? "-"} />
          <Stat title="結果件数" value={`${results.length}件`} />
          <Stat title="進捗項目" value={`${progresses.length}件`} />
        </div>

        <h2 style={{ marginTop: 28 }}>最近の結果</h2>
        <div style={tableBox}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead><tr><Th>学習項目</Th><Th>正答率</Th><Th>得点</Th><Th>日時</Th></tr></thead>
            <tbody>
              {results.slice(0, 30).map((r, index) => (
                <tr key={`${r.quizType}-${index}`}>
                  <Td>{quizLabel(r.quizType)}</Td>
                  <Td>{percent(r)}</Td>
                  <Td>{typeof r.score === "number" && typeof r.total === "number" ? `${r.score}/${r.total}` : "-"}</Td>
                  <Td>{formatDate(r.createdAt ?? r.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !results.length ? <div style={{ padding: 18, color: "#64748b" }}>結果はまだありません。</div> : null}
        </div>

        <h2 style={{ marginTop: 28 }}>進捗</h2>
        <div style={tableBox}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead><tr><Th>学習項目</Th><Th>学習回数</Th><Th>最終学習日</Th></tr></thead>
            <tbody>
              {progresses.map((p) => (
                <tr key={p.quizType}>
                  <Td>{quizLabel(p.quizType)}</Td>
                  <Td>{p.totalSessions ?? 0}</Td>
                  <Td>{formatDate(p.lastStudiedAt ?? p.updatedAt ?? p.lastStudyDate)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !progresses.length ? <div style={{ padding: 18, color: "#64748b" }}>進捗はまだありません。</div> : null}
        </div>

        <LegalFooter />
      </section>
    </main>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ padding: 16, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900 }}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: 13 }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>{children}</td>
}

const tableBox: React.CSSProperties = {
  overflowX: "auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
}
const errorBox: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 8,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#dc2626",
  fontWeight: 800,
}
