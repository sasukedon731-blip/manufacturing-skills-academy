"use client"

import { useState } from "react"
import { FirebaseError } from "firebase/app"
import { createUserWithEmailAndPassword, deleteUser, updateProfile, type User } from "firebase/auth"
import { Timestamp, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"

import { auth, db } from "@/app/lib/firebase"
import { buildEntitledQuizTypes, normalizeSelectedForPlan, type PlanId } from "@/app/lib/plan"

export default function RegisterPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    const trimmedName = username.trim()
    const trimmedEmail = email.trim()
    const normalizedCompanyCode = companyCode.trim().toUpperCase()

    if (!trimmedName) {
      setError("ユーザーネームを入力してください")
      setLoading(false)
      return
    }
    if (!trimmedEmail) {
      setError("メールアドレスを入力してください")
      setLoading(false)
      return
    }
    if (!password || password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      setLoading(false)
      return
    }

    let createdUser: User | null = null
    try {
      let companyName: string | null = null
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      createdUser = userCredential.user

      if (normalizedCompanyCode) {
        const companySnap = await getDoc(doc(db, "companies", normalizedCompanyCode))
        if (!companySnap.exists()) throw new Error("企業コードが正しくありません")
        const companyData = companySnap.data()
        if (companyData?.status && companyData.status !== "active") {
          throw new Error("この企業コードは現在利用できません")
        }
        companyName = companyData?.name ?? companyData?.companyName ?? null
      }

      await updateProfile(userCredential.user, { displayName: trimmedName })

      const uid = userCredential.user.uid

      // ✅ 初期プラン（1日無料体験）
      const plan: PlanId = "trial"

      // ✅ planから entitlement を自動生成
      const entitledQuizTypes = buildEntitledQuizTypes(plan)

      // ✅ selected も安全に正規化（基本は entitlement と同じでOK）
      const selectedQuizTypes = normalizeSelectedForPlan([], entitledQuizTypes, plan)

      const now = new Date()
      const trialEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const accountType = normalizedCompanyCode ? "company" : "personal"

      await setDoc(doc(db, "users", uid), {
        uid,
        email: userCredential.user.email ?? trimmedEmail,
        displayName: trimmedName,
        role: "user",
        accountType,
        companyCode: normalizedCompanyCode || null,
        companyName,

        // ---- プラン運用 ----
        plan,
        trialStartedAt: Timestamp.fromDate(now),
        trialEndsAt: normalizedCompanyCode ? null : Timestamp.fromDate(trialEndsAt),
        entitledQuizTypes,
        selectedQuizTypes,

        // 初期状態は全教材を選択済みにする。ロックは教材画面で変更した時だけ開始。
        nextChangeAllowedAt: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      createdUser = null

      router.push("/") // or /select-mode でもOK
    } catch (err: unknown) {
      if (createdUser) {
        try { await deleteUser(createdUser) } catch (cleanupError) { console.error("Failed to roll back Auth user", cleanupError) }
      }
      console.error(err)
      const code = err instanceof FirebaseError ? err.code : ""
      if (code === "auth/email-already-in-use") setError("このメールアドレスは既に登録されています")
      else if (code === "auth/invalid-email") setError("メールアドレスの形式が正しくありません")
      else if (code === "auth/weak-password") setError("パスワードが弱すぎます（6文字以上）")
      else setError(code || "登録に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 440 }}>
        <div className="card-header" style={{ textAlign: "center" }}>
          <p className="badge" style={{ marginBottom: 10 }}>CREATE ACCOUNT</p>
          <h1 className="card-title">新規登録</h1>
          <p className="card-subtitle" style={{ lineHeight: 1.8 }}>
            個人利用の方は企業コードを空欄のまま登録できます。
            企業から案内された方は企業コードを入力してください。
          </p>
        </div>

        <div className="card-body stack">
          <input
            type="text"
            placeholder="ユーザーネーム"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="パスワード（6文字以上）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div>
            <label
              htmlFor="companyCode"
              style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 900 }}
            >
              企業コード（任意）
            </label>
            <input
              id="companyCode"
              type="text"
              placeholder="例：COMPANY001"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              autoComplete="organization"
            />
            <p className="note">
              企業コードを入力すると、企業管理画面の学習者一覧に紐づきます。
            </p>
          </div>

          {error && <div className="noticeNg">{error}</div>}

          <button
            className="btn btnSuccess"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "登録中..." : "新規登録"}
          </button>

          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, fontWeight: 700 }}>
            <p>すでにアカウントをお持ちですか？</p>
            <a href="/login" style={{ color: "#2563eb", fontWeight: 900, textDecoration: "underline" }}>
              ログインはこちら
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
