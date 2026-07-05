"use client"

import { useState } from "react"
import { FirebaseError } from "firebase/app"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/app/lib/firebase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const trimmedCompanyCode = companyCode.trim().toUpperCase()
      let companyName: string | null = null

      if (trimmedCompanyCode) {
        const companySnap = await getDoc(doc(db, "companies", trimmedCompanyCode))

        if (!companySnap.exists()) {
          setError("企業コードが正しくありません")
          setLoading(false)
          return
        }

        const companyData = companySnap.data()
        if (companyData?.status && companyData.status !== "active") {
          setError("この企業コードは現在利用できません")
          setLoading(false)
          return
        }

        companyName = companyData?.name ?? companyData?.companyName ?? null
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)

      if (trimmedCompanyCode) {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          companyCode: trimmedCompanyCode,
          companyName,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      }

      router.push("/") // ログイン成功 → TOP
    } catch (err: unknown) {
      const code = err instanceof FirebaseError ? err.code : ""
      if (code === "permission-denied") {
        setError("企業コードの紐づけ権限がありません。Firestoreルールを確認してください")
      } else {
        setError("メールアドレスまたはパスワードが違います")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div className="card-header" style={{ textAlign: "center" }}>
          <p className="badge" style={{ marginBottom: 10 }}>LOGIN</p>
          <h1 className="card-title">ログイン</h1>
          <p className="card-subtitle" style={{ lineHeight: 1.8 }}>
            企業から案内された方は、企業コードを入力してログインすると企業管理画面に紐づきます。
          </p>
        </div>

        <div className="card-body stack">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div>
            <label
              htmlFor="loginCompanyCode"
              style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 900 }}
            >
              企業コード（任意）
            </label>
            <input
              id="loginCompanyCode"
              type="text"
              placeholder="例：COMPANY001"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              autoComplete="organization"
            />
            <p className="note">
              個人利用の方は空欄のままログインできます。
            </p>
          </div>

          {error && <div className="noticeNg">{error}</div>}

          <button
            className="btn btnPrimary"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>
            <p>アカウントをお持ちでない方は</p>
            <a href="/register" style={{ color: "#2563eb", fontWeight: 900, textDecoration: "underline" }}>
              新規登録はこちら
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
