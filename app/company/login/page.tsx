"use client"

import Link from "next/link"
import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { auth, db } from "@/app/lib/firebase"

type UserDoc = {
  role?: string
  companyCode?: string | null
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

function isAllowedRole(role?: string) {
  return role === "admin" || role === "company_admin"
}

export default function CompanyLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let alive = true
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!alive) return
      if (!user) {
        setChecking(false)
        return
      }
      try {
        await user.getIdToken(true)
        const snap = await getUserDocWithRetry(user.uid)
        const data = snap.exists() ? (snap.data() as UserDoc) : null
        if (isAllowedRole(data?.role)) {
          router.replace("/company")
          return
        }
        await signOut(auth)
        if (alive) setError("企業管理者アカウントでログインしてください。")
      } catch (e) {
        console.error(e)
        if (alive) setError("ログイン状態の確認に失敗しました。")
      } finally {
        if (alive) setChecking(false)
      }
    })
    return () => {
      alive = false
      unsub()
    }
  }, [router])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      await cred.user.getIdToken(true)
      const snap = await getUserDocWithRetry(cred.user.uid)
      const data = snap.exists() ? (snap.data() as UserDoc) : null
      if (!isAllowedRole(data?.role)) {
        await signOut(auth)
        setError("このアカウントは企業管理画面に入れません。")
        return
      }
      if (data?.role === "company_admin" && !data?.companyCode) {
        await signOut(auth)
        setError("企業管理者アカウントに企業コードが設定されていません。")
        return
      }
      router.replace("/company")
    } catch (err: any) {
      const code = err?.code ?? ""
      if (code === "auth/invalid-email") setError("メールアドレスの形式が正しくありません。")
      else if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) {
        setError("メールアドレスまたはパスワードが違います。")
      } else if (code === "auth/too-many-requests") {
        setError("試行回数が多いため一時的に制限されています。少し待ってから再度お試しください。")
      } else {
        console.error(err)
        setError("ログインに失敗しました。時間をおいて再度お試しください。")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <main style={centerPage}><p style={{ color: "#64748b" }}>確認中...</p></main>

  return (
    <main style={centerPage}>
      <div style={panel}>
        <p style={eyebrow}>FOR BUSINESS</p>
        <h1 style={{ margin: "12px 0 6px", fontSize: 30 }}>企業ログイン</h1>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>
          企業管理者アカウントでログインすると、学習者の進捗管理画面へ入れます。
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: 22, display: "grid", gap: 14 }}>
          <LabelInput label="メールアドレス" type="email" value={email} onChange={setEmail} placeholder="admin@example.com" autoComplete="email" />
          <LabelInput label="パスワード" type="password" value={password} onChange={setPassword} placeholder="パスワード" autoComplete="current-password" />
          {error ? <div style={errorBox}>{error}</div> : null}
          <button type="submit" disabled={loading} style={primaryBtn}>
            {loading ? "ログイン中..." : "企業管理画面へログイン"}
          </button>
        </form>
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <Link href="/login" style={subLink}>個人ログインはこちら</Link>
          <Link href="/for-business" style={{ textAlign: "center", color: "#2563eb", fontWeight: 900, textDecoration: "none" }}>
            法人向けページへ
          </Link>
        </div>
      </div>
    </main>
  )
}

function LabelInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
}) {
  return (
    <label style={{ display: "grid", gap: 8, fontSize: 14, fontWeight: 800, color: "#334155" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "12px 14px", fontSize: 14 }}
      />
    </label>
  )
}

const centerPage: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#f8fafc",
  padding: 20,
  color: "#0f172a",
}
const panel: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#fff",
  padding: 28,
  boxShadow: "0 18px 45px rgba(15,23,42,.08)",
}
const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 900,
  color: "#94a3b8",
  letterSpacing: ".16em",
}
const errorBox: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  padding: 12,
  color: "#dc2626",
  fontSize: 14,
}
const primaryBtn: React.CSSProperties = {
  minHeight: 48,
  border: "none",
  borderRadius: 8,
  background: "#0f172a",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
}
const subLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 900,
  textDecoration: "none",
}
