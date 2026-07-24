"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { isCompanyAccount } from "@/app/lib/account"
import {
  formatDateJP,
  getAccountUsageView,
  type BillingLike,
  type DateLike,
  type PeriodView,
} from "@/app/lib/billingAccess"

type AccountData = {
  accountType?: unknown
  companyCode?: unknown
  billing?: BillingLike | null
  trialEndsAt?: DateLike
}

type Props = {
  userData?: AccountData | null
  plansHref?: string
}

export default function BillingStatusCard({ userData, plansHref = "/plans" }: Props) {
  const [nowMs, setNowMs] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setNowMs(Date.now())
    update()
    const timer = window.setInterval(update, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const company = isCompanyAccount(userData)
  const usage = useMemo(
    () => getAccountUsageView(
      {
        isCompany: company,
        billing: userData?.billing,
        trialEndsAt: userData?.trialEndsAt,
      },
      nowMs ?? 0,
    ),
    [company, nowMs, userData?.billing, userData?.trialEndsAt],
  )

  if (nowMs === null) {
    return <section style={cardStyle} aria-busy="true">ご利用状況を確認しています...</section>
  }

  if (usage.kind === "company") {
    return (
      <section style={cardStyle}>
        <Heading />
        <StateBox
          title="企業契約でご利用中です"
          description="利用料金は企業契約に含まれています。"
        />
      </section>
    )
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Heading />
        <Link href={plansHref} style={linkStyle}>プランを見る</Link>
      </div>

      {usage.kind === "active" ? (
        <>
          <PeriodSection title="基本学習プラン：利用中" period={usage.plan} />
          <div style={renewalStyle}><b>自動更新：</b>なし</div>
          {usage.ai.enabled ? (
            <PeriodSection title="AIオプション：利用中" period={usage.ai} />
          ) : (
            <StateBox title="AIオプション：未契約" description="AIオプションの利用期限は設定されていません。" />
          )}
        </>
      ) : null}

      {usage.kind === "pending" ? (
        <StateBox title="お支払い確認待ち" description="入金確認後にプランが有効になります。" />
      ) : null}
      {usage.kind === "expired" ? (
        <StateBox title="基本学習プラン：期限切れ" description="プランを購入すると学習を再開できます。" />
      ) : null}
      {usage.kind === "past_due" ? (
        <StateBox title="お支払いを確認できませんでした" description="お支払い方法をご確認のうえ、もう一度お手続きください。" />
      ) : null}
      {usage.kind === "canceled" ? (
        <StateBox title="プランは利用停止中です" description="必要な場合はプランを再購入してください。" />
      ) : null}
      {usage.kind === "trial" ? (
        <TrialSection period={usage.trial} />
      ) : null}
      {usage.kind === "trial_expired" ? (
        <StateBox title="無料体験は終了しました" description="プランを購入すると学習を再開できます。" />
      ) : null}
      {usage.kind === "none" ? (
        <StateBox title="現在有効なプランはありません" description="プランを購入すると学習を開始できます。" />
      ) : null}
    </section>
  )
}

function Heading() {
  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>現在のご利用状況</div>
      <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>契約内容と実際の利用期限を確認できます</div>
    </div>
  )
}

function PeriodSection({ title, period }: { title: string; period: PeriodView }) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      {period.active ? (
        <>
          <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.2, fontWeight: 900 }}>
            残り{period.remainingDays}日
          </div>
          {period.expiringSoon ? (
            <div style={warningStyle}>まもなく期限です</div>
          ) : null}
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
            <b>利用期限：</b>{formatDateJP(period.end)}（日本時間）
          </div>
        </>
      ) : (
        <div style={{ marginTop: 8, fontWeight: 800 }}>期限切れ、または利用期限を確認できません</div>
      )}
    </div>
  )
}

function TrialSection({ period }: { period: PeriodView }) {
  const remaining = period.remainingHours < 24
    ? `残り${period.remainingHours}時間`
    : `残り${period.remainingDays}日`
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 900 }}>無料体験中</div>
      <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.2, fontWeight: 900 }}>{remaining}</div>
      <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
        <b>体験終了日時：</b>{formatDateJP(period.end)}（日本時間）
      </div>
    </div>
  )
}

function StateBox({ title, description }: { title: string; description: string }) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 900, fontSize: 17 }}>{title}</div>
      <div style={{ marginTop: 7, fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{description}</div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(15,23,42,.10)", borderRadius: 20, background: "white", padding: 18,
}
const sectionStyle: React.CSSProperties = {
  marginTop: 14, border: "1px solid rgba(15,23,42,.10)", borderRadius: 16, background: "#f8fafc", padding: 15,
}
const warningStyle: React.CSSProperties = {
  display: "inline-block", marginTop: 8, borderRadius: 999, padding: "6px 10px",
  background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa", fontSize: 13, fontWeight: 900,
}
const renewalStyle: React.CSSProperties = {
  marginTop: 10, fontSize: 14, color: "#334155",
}
const linkStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", border: "1px solid rgba(0,0,0,.12)", borderRadius: 12,
  padding: "10px 14px", fontSize: 13, fontWeight: 900, textDecoration: "none", color: "#111", background: "white",
}
