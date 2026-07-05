"use client"

import Link from "next/link"
import {
  canUseAiConversation,
  formatDateJP,
  getAiConversationDaysLeft,
  getAiConversationEndDate,
  getBillingDaysLeft,
  getBillingEndDate,
  getBillingViewState,
  getPlanLabel,
  type BillingLike,
} from "@/app/lib/billingAccess"

type Props = {
  billing?: BillingLike | null
  plansHref?: string
}

export default function BillingStatusCard({
  billing,
  plansHref = "/plans",
}: Props) {
  const billingState = getBillingViewState(billing)
  const planLabel = getPlanLabel(billing?.currentPlan)
  const billingDaysLeft = getBillingDaysLeft(billing)
  const billingEndDate = getBillingEndDate(billing)

  const aiEnabled = canUseAiConversation(billing)
  const aiDaysLeft = getAiConversationDaysLeft(billing)
  const aiEndDate = getAiConversationEndDate(billing)

  return (
    <section
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 20,
        background: "white",
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>ご利用プラン</div>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.7 }}>
            契約状態と有効期限を確認できます
          </div>
        </div>

        <Link
          href={plansHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 900,
            textDecoration: "none",
            color: "#111",
            background: "white",
          }}
        >
          プランを見る
        </Link>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(0,0,0,0.06)",
          borderRadius: 16,
          background: "#f8fafc",
          padding: 14,
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.7 }}>現在のプラン</div>
        <div style={{ marginTop: 6, fontWeight: 900, fontSize: 18 }}>{planLabel}</div>

        <div style={{ marginTop: 14 }}>
          {billingState === "none" && (
            <StateBox
              title="未契約"
              description="まだプラン購入はありません。購入すると教材と機能が解放されます。"
            />
          )}

          {billingState === "pending" && (
            <StateBox
              title="お支払い確認待ち"
              description="コンビニ支払い確認後に利用可能になります。反映まで少し時間がかかる場合があります。"
            />
          )}

          {billingState === "past_due" && (
            <StateBox
              title="お支払いエラー"
              description="お支払いに失敗しました。もう一度お手続きください。"
            />
          )}

          {billingState === "canceled" && (
            <StateBox
              title="利用停止中"
              description="現在このプランは利用停止中です。必要に応じて再購入してください。"
            />
          )}

          {billingState === "expired" && (
            <StateBox
              title="有効期限切れ"
              description="有効期限が切れています。再購入でそのまま再開できます。"
            />
          )}

          {billingState === "active" && (
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <InfoBox label="残り日数" value={`${billingDaysLeft}日`} />
              <InfoBox label="有効期限" value={formatDateJP(billingEndDate)} />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          background: "white",
          padding: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900 }}>AI会話オプション</div>
            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.7 }}>
              AI会話機能の利用状態
            </div>
          </div>

          <div
            style={{
              borderRadius: 999,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 900,
              border: "1px solid rgba(0,0,0,0.08)",
              background: aiEnabled ? "#ecfdf5" : "#f3f4f6",
              color: aiEnabled ? "#047857" : "#4b5563",
            }}
          >
            {aiEnabled ? "利用可能" : "未加入 / 期限切れ"}
          </div>
        </div>

        {aiEnabled ? (
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <InfoBox label="残り日数" value={`${aiDaysLeft}日`} />
            <InfoBox label="有効期限" value={formatDateJP(aiEndDate)} />
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            AI会話は有料オプションです。必要な場合はプラン購入時に追加してください。
          </div>
        )}
      </div>
    </section>
  )
}

function StateBox({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        background: "white",
        padding: 14,
      }}
    >
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75, lineHeight: 1.7 }}>
        {description}
      </div>
    </div>
  )
}

function InfoBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        background: "white",
        padding: 14,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 900, fontSize: 20 }}>{value}</div>
    </div>
  )
}
