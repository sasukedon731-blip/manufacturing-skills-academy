"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { auth, db } from "@/app/lib/firebase"
import { quizzes } from "@/app/data/quizzes"
import { type PlanId } from "@/app/lib/plan"
import { loadAndRepairUserPlanState } from "@/app/lib/userPlanState"
import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"
import CheckoutResultNotice from "@/app/components/billing/CheckoutResultNotice"
import KonbiniGuideNotice from "@/app/components/billing/KonbiniGuideNotice"

type DurationDays = 30 | 90 | 180
type PaymentMethod = "convenience" | "card"
type IndustryId = "construction" | "manufacturing" | "care" | "driver" | "undecided"

const FULL_ACCESS_PLAN: Extract<PlanId, "7"> = "7"

const DURATION_OPTIONS: Array<{
  days: DurationDays
  label: string
  price: number
  note: string
}> = [
  { days: 30, label: "1ヶ月プラン", price: 500, note: "まず試しやすい期間" },
  { days: 90, label: "3ヶ月プラン", price: 1200, note: "続けて学ぶ方向け" },
  { days: 180, label: "6ヶ月プラン", price: 2000, note: "じっくり定着させる方向け" },
]

const AI_ADDON_PRICE: Record<DurationDays, number> = {
  30: 500,
  90: 1500,
  180: 3000,
}

const INDUSTRY_LABEL: Record<IndustryId, string> = {
  construction: "建設",
  manufacturing: "製造",
  care: "介護",
  driver: "運転・免許",
  undecided: "未定",
}

function isIndustryId(v: string | null): v is IndustryId {
  return (
    v === "construction" ||
    v === "manufacturing" ||
    v === "care" ||
    v === "driver" ||
    v === "undecided"
  )
}

function formatYen(n: number) {
  return n.toLocaleString("ja-JP")
}

function getPlanLabel(plan: PlanId) {
  if (plan === "trial") return "無料体験"
  if (plan === "free") return "無料プラン"
  return "基本学習プラン"
}

export default function PlansPage() {
  const router = useRouter()
  const params = useSearchParams()
  const checkout = params.get("checkout")
  const industryParamRaw = params.get("industry")
  const industry: IndustryId | null = isIndustryId(industryParamRaw)
    ? industryParamRaw
    : "manufacturing"

  const [uid, setUid] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [currentPlan, setCurrentPlan] = useState<PlanId>("trial")
  const [displayName, setDisplayName] = useState("")
  const [durationDays, setDurationDays] = useState<DurationDays>(30)
  const [billingMethod, setBillingMethod] = useState<PaymentMethod>("convenience")
  const [addAiConversation, setAddAiConversation] = useState(false)
  const [aiConversationEnabled, setAiConversationEnabled] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login")
        return
      }
      setUid(u.uid)
      setUser(u)
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    ;(async () => {
      if (!uid) return
      setLoading(true)
      setError("")
      try {
        const st = await loadAndRepairUserPlanState(uid)
        setCurrentPlan(st.plan)
        setDisplayName(st.displayName)

        const userSnap = await getDoc(doc(db, "users", uid))
        const userData = userSnap.exists() ? userSnap.data() : null
        setAiConversationEnabled(Boolean(userData?.billing?.aiConversationEnabled))
      } catch (e) {
        console.error(e)
        setError("プラン情報の読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    })()
  }, [uid])

  const selectedOption = useMemo(
    () => DURATION_OPTIONS.find((option) => option.days === durationDays) ?? DURATION_OPTIONS[0],
    [durationDays]
  )
  const allCount = useMemo(() => Object.keys(quizzes).length, [])
  const aiOptionTotal = addAiConversation ? AI_ADDON_PRICE[durationDays] : 0
  const grandTotal = selectedOption.price + aiOptionTotal

  const startCheckout = async () => {
    if (!user) return
    setSaving(true)
    setError("")

    try {
      const idToken = await user.getIdToken()
      if (!idToken) throw new Error("ログイン情報を取得できませんでした")

      const res = await fetch("/api/komoju/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          plan: FULL_ACCESS_PLAN,
          method: billingMethod,
          durationDays,
          industry,
          addAiConversation,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "決済ページの作成に失敗しました")
      if (!data?.url) throw new Error("決済URLを取得できませんでした")

      window.location.href = data.url
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? "決済ページの作成に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24 }}>読み込み中...</div>

  return (
    <main style={styles.main}>
      <AppHeader title="プラン" />

      <CheckoutResultNotice
        checkout={checkout}
        showAiCta={aiConversationEnabled || addAiConversation}
      />
      <KonbiniGuideNotice />

      <section style={styles.hero}>
        <div style={styles.eyebrow}>製造・日本語・ゲーム・AI</div>
        <h1 style={styles.heroTitle}>基本学習はひとつのプラン、AIだけ別料金</h1>
        <p style={styles.heroLead}>
          日本語、製造用語、ゲーム学習は基本学習プランで利用できます。
          AI会話・AIスピーキングは必要な方だけ追加できる有料オプションです。
        </p>
        <div style={styles.heroGrid}>
          <InfoCard title="基本学習プラン" text={`${allCount}教材を期間中利用できます。教材数で料金を分けません。`} />
          <InfoCard title="AIオプション" text="AI会話・AIスピーキングを使う場合だけ追加料金がかかります。" />
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.cardTitle}>現在のプラン</div>
        <p style={styles.cardText}>
          {displayName ? `${displayName} さん：` : ""}
          <b>{getPlanLabel(currentPlan)}</b>
          {aiConversationEnabled ? " / AIオプション有効" : ""}
        </p>
      </section>

      {industry ? (
        <section style={{ ...styles.card, background: "#eff6ff", borderColor: "rgba(37,99,235,.28)" }}>
          <div style={styles.cardTitle}>選択中のカテゴリ</div>
          <p style={styles.cardText}>{INDUSTRY_LABEL[industry]}向けの内容で申し込みます。</p>
        </section>
      ) : null}

      {error ? <p style={styles.error}>{error}</p> : null}

      <section style={styles.card}>
        <div style={styles.sectionHead}>
          <div>
            <div style={styles.cardTitle}>利用期間</div>
            <p style={styles.cardText}>基本学習プランの利用期間を選んでください。</p>
          </div>
        </div>
        <div style={styles.optionGrid}>
          {DURATION_OPTIONS.map((option) => {
            const selected = option.days === durationDays
            return (
              <button
                key={option.days}
                type="button"
                onClick={() => setDurationDays(option.days)}
                style={{
                  ...styles.optionButton,
                  ...(selected ? styles.optionButtonSelected : null),
                }}
              >
                <span style={styles.optionTitle}>{option.label}</span>
                <span style={styles.optionPrice}>¥{formatYen(option.price)}</span>
                <span style={styles.optionNote}>{option.note}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section style={styles.card}>
        <div style={styles.cardTitle}>お支払い方法</div>
        <div style={styles.paymentGrid}>
          <PaymentOption
            checked={billingMethod === "convenience"}
            label="コンビニ払い"
            text="カードがなくても現金で支払いできます。"
            onChange={() => setBillingMethod("convenience")}
          />
          <PaymentOption
            checked={billingMethod === "card"}
            label="カード払い"
            text="決済後すぐに利用開始できます。"
            onChange={() => setBillingMethod("card")}
          />
        </div>
      </section>

      <section style={{ ...styles.card, background: "#ecfdf5", borderColor: "rgba(16,185,129,.35)" }}>
        <div style={styles.cardTitle}>AIオプション</div>
        <p style={styles.cardText}>
          AI会話・AIスピーキングは基本学習プランには含まれません。
          必要な場合だけ、同じ利用期間で追加できます。
        </p>
        <label style={{ ...styles.checkCard, ...(addAiConversation ? styles.checkCardOn : null) }}>
          <input
            type="checkbox"
            checked={addAiConversation}
            onChange={(e) => setAddAiConversation(e.target.checked)}
            style={styles.checkbox}
          />
          <span style={styles.checkBody}>
            <b>AIオプションを追加する</b>
            <span>+ ¥{formatYen(AI_ADDON_PRICE[durationDays])} / {selectedOption.label}</span>
          </span>
        </label>
        {aiConversationEnabled ? (
          <p style={styles.activeNote}>現在AIオプションは有効です。追加購入すると有効期限が延長されます。</p>
        ) : null}
      </section>

      <section style={styles.totalCard}>
        <div style={styles.cardTitle}>お支払い合計</div>
        <div style={styles.totalRow}>
          <span>基本学習プラン（{selectedOption.label}）</span>
          <b>¥{formatYen(selectedOption.price)}</b>
        </div>
        <div style={styles.totalRow}>
          <span>AIオプション</span>
          <b>{addAiConversation ? `¥${formatYen(aiOptionTotal)}` : "¥0"}</b>
        </div>
        <div style={styles.totalDivider} />
        <div style={styles.totalBottom}>
          <span>今回のお支払い</span>
          <b>¥{formatYen(grandTotal)}</b>
        </div>
        <p style={styles.smallNote}>
          買い切り型の期間利用プランです。自動更新はありません。期間終了後は必要に応じて再購入してください。
        </p>
        <button
          type="button"
          onClick={startCheckout}
          disabled={saving}
          style={{
            ...styles.checkoutButton,
            opacity: saving ? 0.75 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "決済ページへ移動中..." : "この内容で決済に進む"}
        </button>
      </section>

      <LegalFooter compact />
    </main>
  )
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoTitle}>{title}</div>
      <div style={styles.infoText}>{text}</div>
    </div>
  )
}

function PaymentOption({
  checked,
  label,
  text,
  onChange,
}: {
  checked: boolean
  label: string
  text: string
  onChange: () => void
}) {
  return (
    <label style={{ ...styles.paymentOption, ...(checked ? styles.paymentOptionOn : null) }}>
      <input type="radio" name="payment" checked={checked} onChange={onChange} style={styles.radio} />
      <span>
        <b>{label}</b>
        <span>{text}</span>
      </span>
    </label>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "16px 14px 40px",
  },
  hero: {
    marginTop: 12,
    padding: 18,
    border: "1px solid rgba(37,99,235,.24)",
    borderRadius: 8,
    background: "#f8fbff",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#2563eb",
  },
  heroTitle: {
    margin: "8px 0 0",
    fontSize: 26,
    lineHeight: 1.25,
    fontWeight: 900,
  },
  heroLead: {
    margin: "10px 0 0",
    fontSize: 14,
    lineHeight: 1.8,
    color: "#374151",
  },
  heroGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },
  infoCard: {
    padding: 14,
    border: "1px solid rgba(17,24,39,.10)",
    borderRadius: 8,
    background: "#fff",
  },
  infoTitle: {
    fontWeight: 900,
  },
  infoText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  card: {
    marginTop: 12,
    padding: 16,
    border: "1px solid rgba(17,24,39,.10)",
    borderRadius: 8,
    background: "#fff",
  },
  cardTitle: {
    fontWeight: 900,
    fontSize: 16,
  },
  cardText: {
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.7,
    color: "#374151",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  optionGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 10,
  },
  optionButton: {
    minHeight: 116,
    padding: 14,
    border: "1px solid rgba(17,24,39,.12)",
    borderRadius: 8,
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  optionButtonSelected: {
    borderColor: "#2563eb",
    boxShadow: "0 0 0 2px rgba(37,99,235,.12)",
  },
  optionTitle: {
    display: "block",
    fontWeight: 900,
  },
  optionPrice: {
    display: "block",
    marginTop: 10,
    fontSize: 26,
    fontWeight: 900,
    color: "#111827",
  },
  optionNote: {
    display: "block",
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },
  paymentGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  paymentOption: {
    display: "flex",
    gap: 10,
    padding: 14,
    border: "1px solid rgba(17,24,39,.12)",
    borderRadius: 8,
    cursor: "pointer",
  },
  paymentOptionOn: {
    borderColor: "#2563eb",
    background: "#eff6ff",
  },
  radio: {
    width: 18,
    height: 18,
    marginTop: 2,
  },
  checkCard: {
    marginTop: 12,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: 14,
    border: "1px solid rgba(17,24,39,.12)",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
  },
  checkCardOn: {
    borderColor: "#059669",
    boxShadow: "0 0 0 2px rgba(16,185,129,.12)",
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
  },
  checkBody: {
    display: "grid",
    gap: 5,
    fontSize: 14,
  },
  activeNote: {
    margin: "10px 0 0",
    color: "#047857",
    fontWeight: 800,
    fontSize: 13,
  },
  totalCard: {
    marginTop: 12,
    padding: 16,
    border: "1px solid rgba(37,99,235,.22)",
    borderRadius: 8,
    background: "#f8fafc",
  },
  totalRow: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
  },
  totalDivider: {
    height: 1,
    background: "rgba(17,24,39,.12)",
    margin: "14px 0",
  },
  totalBottom: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "baseline",
    fontSize: 18,
    fontWeight: 900,
  },
  smallNote: {
    margin: "12px 0 0",
    fontSize: 12,
    lineHeight: 1.7,
    color: "#6b7280",
  },
  checkoutButton: {
    width: "100%",
    marginTop: 14,
    padding: 14,
    border: "none",
    borderRadius: 8,
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    fontSize: 16,
  },
  error: {
    margin: "12px 0 0",
    color: "#dc2626",
    fontWeight: 800,
  },
}
