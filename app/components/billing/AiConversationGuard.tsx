"use client"

import Link from "next/link"
import {
  canUseAiConversation,
  getAiConversationDaysLeft,
  getBillingViewState,
  type BillingLike,
} from "@/app/lib/billingAccess"

type Props = {
  billing?: BillingLike | null
  children: React.ReactNode
  plansHref?: string
}

export default function AiConversationGuard({
  billing,
  children,
  plansHref = "/plans",
}: Props) {
  const billingState = getBillingViewState(billing)
  const allowed = canUseAiConversation(billing)
  const aiDaysLeft = getAiConversationDaysLeft(billing)

  if (allowed) {
    return <>{children}</>
  }

  if (billingState === "pending") {
    return (
      <BlockedCard
        title="AI会話はお支払い確認後に利用できます"
        description="コンビニ支払い確認後にAI会話オプションが有効になります。反映まで少し時間がかかる場合があります。"
        plansHref={plansHref}
        buttonLabel="プランを見る"
      />
    )
  }

  if (billingState === "past_due") {
    return (
      <BlockedCard
        title="お支払いに失敗しました"
        description="AI会話オプションを利用するには、もう一度お手続きしてください。"
        plansHref={plansHref}
        buttonLabel="もう一度購入する"
      />
    )
  }

  if (billingState === "expired" || billingState === "canceled") {
    return (
      <BlockedCard
        title="AI会話オプションの有効期限が切れています"
        description="再購入すると、すぐにAI会話を再開できます。"
        plansHref={plansHref}
        buttonLabel="プランを再購入する"
      />
    )
  }

  return (
    <BlockedCard
      title="AI会話は有料オプションです"
      description="AI会話はプラン購入時のオプション追加で利用できます。"
      plansHref={plansHref}
      buttonLabel="プランを見る"
      footerNote={aiDaysLeft > 0 ? `残り ${aiDaysLeft} 日` : undefined}
    />
  )
}

function BlockedCard({
  title,
  description,
  plansHref,
  buttonLabel,
  footerNote,
}: {
  title: string
  description: string
  plansHref: string
  buttonLabel: string
  footerNote?: string
}) {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="rounded-2xl bg-gray-50 p-5">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-gray-600">{description}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={plansHref}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {buttonLabel}
          </Link>

          <Link
            href="/mypage"
            className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            マイページへ戻る
          </Link>
        </div>

        {footerNote ? (
          <p className="mt-4 text-xs text-gray-500">{footerNote}</p>
        ) : null}
      </div>
    </section>
  )
}