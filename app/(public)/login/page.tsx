"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/app/lib/firebase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/") // ログイン成功 → TOP
    } catch (err) {
      setError("メールアドレスまたはパスワードが違います")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h1>ログイン</h1>

      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <input
        type="password"
        placeholder="パスワード"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#2196f3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      {/* 👇 ここが「新規登録はこちら」 */}
      <p style={{ marginTop: "15px" }}>
        アカウントをお持ちでない方は
        <br />
        <a href="/register">新規登録はこちら</a>
      </p>
    </div>
  )
}
