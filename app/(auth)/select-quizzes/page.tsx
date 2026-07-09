"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/app/lib/firebase"
import { assertActiveAccess } from "@/app/lib/guards"

export default function SelectQuizzesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login")
        return
      }

      const gate = await assertActiveAccess(user.uid)
      router.replace(gate.ok ? "/select-mode" : "/plans")
    })

    return () => unsub()
  }, [router])

  return <main style={{ padding: 24, textAlign: "center" }}>教材一覧へ移動しています...</main>
}
