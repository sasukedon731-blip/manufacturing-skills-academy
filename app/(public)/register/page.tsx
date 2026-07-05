"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"

import { auth, db } from "@/app/lib/firebase"
import { buildEntitledQuizTypes, normalizeSelectedForPlan, type PlanId } from "@/app/lib/plan"

export default function RegisterPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError("")
    setLoading(true)

    if (!username) {
      setError("ユーザーネームを入力してください")
      setLoading(false)
      return
    }
    if (!email) {
      setError("メールアドレスを入力してください")
      setLoading(false)
      return
    }
    if (!password || password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      await updateProfile(userCredential.user, { displayName: username })

      const uid = userCredential.user.uid

      // ✅ 初期プラン（おすすめ：trial）
      const plan: PlanId = "trial"

      // ✅ planから entitlement を自動生成
      const entitledQuizTypes = buildEntitledQuizTypes(plan)

      // ✅ selected も安全に正規化（基本は entitlement と同じでOK）
      const selectedQuizTypes = normalizeSelectedForPlan([], entitledQuizTypes, plan)

      await setDoc(doc(db, "users", uid), {
        email: userCredential.user.email ?? email,
        displayName: username,
        role: "user",

        // ---- プラン運用 ----
        plan,
        entitledQuizTypes,
        selectedQuizTypes,

        // 初回はすぐ変更できる扱い（select-quizzesで制御）
        nextChangeAllowedAt: serverTimestamp(),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      router.push("/") // or /select-mode でもOK
    } catch (err: any) {
      console.error(err)
      const code = err?.code ?? ""
      if (code === "auth/email-already-in-use") setError("このメールアドレスは既に登録されています")
      else if (code === "auth/invalid-email") setError("メールアドレスの形式が正しくありません")
      else if (code === "auth/weak-password") setError("パスワードが弱すぎます（6文字以上）")
      else setError(code || "登録に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h1>新規登録</h1>

      <input
        type="text"
        placeholder="ユーザーネーム"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="パスワード（6文字以上）"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        {loading ? "登録中..." : "新規登録（お試し開始）"}
      </button>

      <p style={{ marginTop: "15px" }}>
        すでにアカウントをお持ちですか？
        <br />
        <a href="/login">ログインはこちら</a>
      </p>
    </div>
  )
}
