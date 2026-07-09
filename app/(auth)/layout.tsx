// app/(auth)/layout.tsx
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/useAuth"
import { ensureUserProfile } from "@/app/lib/firestore"
import { loadAndRepairUserPlanState } from "@/app/lib/userPlanState"
import { assertActiveAccess } from "@/app/lib/guards"
import AchievementUnlockViewport from "@/app/components/achievements/AchievementUnlockViewport"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useAuth()

  const [stateLoaded, setStateLoaded] = useState(false)
  const isAdmin = pathname.startsWith("/admin")
  const isPlans = pathname === "/plans"
  const isGame = pathname === "/game" || pathname.startsWith("/game/")

  useEffect(() => {
    if (loading) return

    // ゲスト用ゲーム表示だけは未ログインでも許可する。
    if (isGame && !user) {
      setStateLoaded(true)
      return
    }

    if (!user) {
      router.replace("/login")
      return
    }

    let alive = true
    setStateLoaded(false)

    ;(async () => {
      try {
        await ensureUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })

        const gate = await assertActiveAccess(user.uid)

        // 管理画面とプラン画面以外は、期限切れ/未決済なら必ずプラン画面へ。
        if (!gate.ok && !isPlans && !isAdmin) {
          router.replace("/plans")
          return
        }

        // 製造版は教材選択画面を使わない。アクセス可能な時だけ全教材状態へ自動修復。
        if (gate.ok) {
          await loadAndRepairUserPlanState(user.uid)
        }
      } catch (e) {
        console.error("AuthLayout init failed:", e)
      } finally {
        if (!alive) return
        setStateLoaded(true)
      }
    })()

    return () => {
      alive = false
    }
  }, [user?.uid, user?.email, user?.displayName, loading, pathname, router, isAdmin, isPlans, isGame, user])

  if (loading) return <p style={{ textAlign: "center" }}>読み込み中…</p>
  if (!user && !isGame) return null
  if (!user && isGame) return <><>{children}</><AchievementUnlockViewport /></>
  if (!stateLoaded) return <p style={{ textAlign: "center" }}>読み込み中…</p>

  return <><>{children}</><AchievementUnlockViewport /></>
}
