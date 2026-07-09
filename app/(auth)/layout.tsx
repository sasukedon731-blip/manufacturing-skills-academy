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
  const isTrialExpired = pathname === "/trial-expired"
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

        // 管理画面・プラン画面・期限切れ説明画面以外は、期限切れ/未決済なら説明画面へ。
        // いきなり料金ページへ飛ばすと理由が伝わらないため、まず /trial-expired で案内する。
        if (!gate.ok && !isPlans && !isTrialExpired && !isAdmin) {
          router.replace("/trial-expired")
          return
        }

        // すでに利用可能なユーザーが期限切れ説明画面を開いた場合は、学習メニューへ戻す。
        if (gate.ok && isTrialExpired) {
          router.replace("/select-mode")
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
  }, [user?.uid, user?.email, user?.displayName, loading, pathname, router, isAdmin, isPlans, isTrialExpired, isGame, user])

  if (loading) return <p style={{ textAlign: "center" }}>読み込み中…</p>
  if (!user && !isGame) return null
  if (!user && isGame) return <><>{children}</><AchievementUnlockViewport /></>
  if (!stateLoaded) return <p style={{ textAlign: "center" }}>読み込み中…</p>

  return <><>{children}</><AchievementUnlockViewport /></>
}
