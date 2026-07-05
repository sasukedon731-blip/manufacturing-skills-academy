"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import ConversationClient from "./ConversationClient"
import AiConversationGuard from "@/app/components/billing/AiConversationGuard"
import { useAuth } from "@/app/lib/useAuth"
import { useUserBilling } from "@/app/lib/useUserBilling"

export default function ConversationPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { billing, loading: billingLoading, error } = useUserBilling()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
    }
  }, [authLoading, router, user])

  if (authLoading || billingLoading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      </main>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <AiConversationGuard billing={billing}>
        <ConversationClient />
      </AiConversationGuard>
    </main>
  )
}
