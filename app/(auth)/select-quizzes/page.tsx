"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/app/lib/firebase"
import { quizzes } from "@/app/data/quizzes"
import type { QuizType } from "@/app/data/types"
import { getSelectLimit, type PlanId } from "@/app/lib/plan"
import {
  loadAndRepairUserPlanState,
  saveSelectedQuizTypesWithLock,
} from "@/app/lib/userPlanState"
import AppHeader from "@/app/components/AppHeader"

function canChange(now: Date, nextAllowedAt?: Date | null) {
  if (!nextAllowedAt) return true
  return now.getTime() >= nextAllowedAt.getTime()
}

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}/${m}/${day}`
}

type IndustryId = "construction" | "manufacturing" | "care" | "driver" | "undecided"

const INDUSTRY_LABEL: Record<IndustryId, string> = {
  construction: "建設",
  manufacturing: "製造",
  care: "介護",
  driver: "運転・免許",
  undecided: "未定（海外から）",
}

function isIndustryId(v: any): v is IndustryId {
  return (
    v === "construction" ||
    v === "manufacturing" ||
    v === "care" ||
    v === "driver" ||
    v === "undecided"
  )
}

const JAPANESE_BASE_IDS: QuizType[] = [
  "japanese-n4",
  "japanese-n3",
  "japanese-n2",
  "speaking-practice",
]

const INDUSTRY_EXTRA: Record<IndustryId, QuizType[]> = {
  construction: [],
  manufacturing: [
    "genba-listening",
    "genba-phrasebook",
    "kansai-listening",
    "dialect-listening",
    "dialect-meaning",
    "confusing-japanese",
    "manufacturing-meaning",
    "manufacturing-word",
    "manufacturing-listening",
    "manufacturing-conversation",
    "manufacturing-conversation-50",
    "skill-test-machining",
  ],
  care: [],
  driver: [],
  undecided: ["kansai-listening", "dialect-listening", "dialect-meaning", "confusing-japanese"],
}

function buildIndustryAllowed(industry: IndustryId | null): QuizType[] {
  if (!industry) return []
  const extra = INDUSTRY_EXTRA[industry] ?? []
  return Array.from(new Set<QuizType>([...JAPANESE_BASE_IDS, ...extra]))
}

export default function SelectQuizzesPage() {
  const router = useRouter()
  const params = useSearchParams()

  const LS_INDUSTRY_KEY = "selected-industry"

  const industryParam = (params.get("industry") as IndustryId | null) ?? null
  const [industryReady, setIndustryReady] = useState(false)

  // ✅ URLに無ければ localStorage から復元してURLを正にする
  useEffect(() => {
    if (industryParam && isIndustryId(industryParam)) {
      try {
        localStorage.setItem(LS_INDUSTRY_KEY, industryParam)
      } catch {}
      setIndustryReady(true)
      return
    }

    try {
      const saved = localStorage.getItem(LS_INDUSTRY_KEY)
      if (saved && isIndustryId(saved)) {
        router.replace(`/select-quizzes?industry=${encodeURIComponent(saved)}`)
        return
      }
    } catch {}

    setIndustryReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [showAll, setShowAll] = useState(false)

  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [plan, setPlan] = useState<PlanId>("trial")
  const [entitled, setEntitled] = useState<QuizType[]>([])
  const [selected, setSelected] = useState<QuizType[]>([])
  const [nextAllowedAt, setNextAllowedAt] = useState<Date | null>(null)
  const [devUnlockAll, setDevUnlockAll] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/login")
        return
      }
      setUid(u.uid)
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    ;(async () => {
      if (!uid) return
      setLoading(true)
      setError("")
      try {
        const state = await loadAndRepairUserPlanState(uid)
        setPlan(state.plan)
        setEntitled(state.entitledQuizTypes)
        setSelected(state.selectedQuizTypes)
        setNextAllowedAt(state.nextChangeAllowedAt)
        setDevUnlockAll((state as any)?.devUnlockAll === true)
      } catch (e) {
        console.error(e)
        setError("読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    })()
  }, [uid])

  const now = new Date()
  const changeOk = devUnlockAll ? true : canChange(now, nextAllowedAt)

  const limit = useMemo(() => (devUnlockAll ? "ALL" : getSelectLimit(plan)), [plan, devUnlockAll])
  const maxCount = limit === "ALL" ? entitled.length : limit

  const requiredCount = useMemo(() => {
    if (plan === "3") return 3
    if (plan === "5") return 5
    if (plan === "7") return 7
    return 1
  }, [plan, entitled.length])

  const editable = changeOk || selected.length < requiredCount

  const remaining = useMemo(() => {
    if (limit === "ALL") return "∞"
    return Math.max(0, maxCount - selected.length)
  }, [limit, maxCount, selected.length])

  const industryAllowed = useMemo(
    () => buildIndustryAllowed(industryParam && isIndustryId(industryParam) ? industryParam : null),
    [industryParam]
  )

  const entitledList = useMemo(() => {
    const base = entitled.filter((id) => (quizzes as any)[id] != null)

    const filtered =
      !industryParam || showAll
        ? base
        : base.filter((id) => industryAllowed.includes(id) || selected.includes(id))

    return filtered.map((id) => {
      const q = (quizzes as any)[id]
      return {
        id,
        title: q.title as string,
        description: (q.description as string | undefined) ?? "",
      }
    })
  }, [entitled, industryParam, showAll, industryAllowed, selected])

  const toggle = (q: QuizType) => {
    if (!editable) return

    setSelected((prev) => {
      const has = prev.includes(q)
      if (has) return prev.filter((x) => x !== q)
      if (limit !== "ALL" && prev.length >= maxCount) return prev
      return [...prev, q]
    })
  }

  const handleSave = async () => {
    if (!uid) return
    setSaving(true)
    setError("")
    try {
      if (!devUnlockAll) {
        await saveSelectedQuizTypesWithLock({
          uid,
          selectedQuizTypes: selected,
        })
      }
      if (industryParam) router.replace(`/select-mode?industry=${industryParam}`)
      else router.replace("/select-mode")
    } catch (e) {
      console.error(e)
      setError("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

  if (!industryReady) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.card}>読み込み中...</div>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.card}>読み込み中...</div>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <AppHeader title="教材を選択" />

        {industryParam && isIndustryId(industryParam) ? (
          <section style={styles.industryBar}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>
                業種：{INDUSTRY_LABEL[industryParam]}（日本語基礎は必ず含まれます）
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.5 }}>
                ※ 表示は業種で絞っています。選択済みの教材は業種外でも見えるようにしています。
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              style={{
                ...styles.filterBtn,
                ...(showAll ? styles.filterBtnOn : styles.filterBtnOff),
              }}
            >
              {showAll ? "業種で絞る" : "すべて表示"}
            </button>
          </section>
        ) : null}

        <section style={styles.summaryCard}>
          <div style={{ fontWeight: 900 }}>
            プラン：{plan} ・ 選択上限：{limit === "ALL" ? "ALL" : `${limit}つ`} ・ 選択中：{selected.length} ・ 残り：{remaining}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            保存後は一定期間ロックされます（初回確定までは例外）。
          </div>
        </section>

        <section style={styles.infoCard}>
          {!changeOk && nextAllowedAt && selected.length >= requiredCount ? (
            <div style={{ ...styles.notice, ...styles.noticeWarn }}>
              変更ロック中：次に変更できる日 <b>{formatDate(nextAllowedAt)}</b>
            </div>
          ) : null}

          {!changeOk && selected.length < requiredCount ? (
            <div style={{ ...styles.notice, ...styles.noticeOk }}>
              ※ 初回の教材確定がまだなので、今だけ編集できます（保存後に1ヶ月ロック）
            </div>
          ) : null}

          <div style={styles.mini}>
            推奨：{plan === "3" ? "3つ" : plan === "5" ? "5つ" : plan === "7" ? "7つ" : "1つ"} 選ぶ
          </div>
        </section>

        {error ? <div style={styles.alert}>{error}</div> : null}

        <section style={{ marginTop: 12 }}>
          <div style={styles.grid}>
            {entitledList.map((q) => {
              const checked = selected.includes(q.id as QuizType)
              const disabled =
                !editable || (!checked && limit !== "ALL" && selected.length >= maxCount)

              return (
                <button
                  key={q.id}
                  onClick={() => toggle(q.id as QuizType)}
                  disabled={disabled}
                  style={{
                    ...styles.quizCard,
                    ...(checked ? styles.quizCardChecked : null),
                    ...(disabled ? styles.quizCardDisabled : null),
                  }}
                >
                  <div style={styles.quizHead}>
                    <div style={styles.quizTitle}>{q.title}</div>
                    <div style={{ ...styles.pill, ...(checked ? styles.pillChecked : styles.pillEmpty) }}>
                      {checked ? "選択中" : "未選択"}
                    </div>
                  </div>

                  {q.description ? (
                    <div style={styles.quizDesc}>{q.description}</div>
                  ) : (
                    <div style={styles.quizDescMuted}>（説明なし）</div>
                  )}

                  <div style={styles.quizMeta}>ID: {q.id}</div>

                  <div style={styles.quizActions}>
                    <div style={styles.ctaRow}>
                      <span style={styles.ctaLabel}>ここを押して</span>
                      <span style={styles.ctaStrong}>{checked ? "解除" : "追加"}</span>
                    </div>
                    {!editable ? (
                      <div style={styles.ctaNote}>ロック中のため編集できません</div>
                    ) : disabled ? (
                      <div style={styles.ctaNote}>上限に達しています</div>
                    ) : (
                      <div style={styles.ctaNote}>タップで切替</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <footer style={styles.footer}>
          <button
            onClick={handleSave}
            disabled={!editable || saving}
            style={{
              ...styles.saveBtn,
              ...(editable ? styles.saveBtnOn : styles.saveBtnOff),
              ...(saving ? styles.saveBtnSaving : null),
            }}
          >
            {saving ? "保存中..." : editable ? "この内容で保存して進む" : "変更可能日まで編集できません"}
          </button>
        </footer>
      </div>
    </main>
  )
}

const styles: any = {
  page: { padding: 18 },
  shell: { maxWidth: 980, margin: "0 auto" },
  card: {
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: "white",
    padding: 14,
  },

  industryBar: {
    marginTop: 12,
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: "white",
    padding: "12px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  filterBtn: {
    borderRadius: 14,
    padding: "10px 12px",
    border: "1px solid var(--border)",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterBtnOn: { background: "#111827", color: "white" },
  filterBtnOff: { background: "#f9fafb", color: "#111827" },

  summaryCard: {
    marginTop: 12,
    border: "1px solid var(--border)",
    borderRadius: 16,
    background: "white",
    padding: "12px 12px",
  },

  infoCard: { marginTop: 12 },
  notice: {
    borderRadius: 14,
    padding: "10px 12px",
    border: "1px solid var(--border)",
    background: "white",
    marginBottom: 8,
  },
  noticeWarn: { background: "#fff7ed", borderColor: "#fed7aa" },
  noticeOk: { background: "#ecfdf5", borderColor: "#a7f3d0" },

  mini: { fontSize: 12, opacity: 0.75, marginTop: 8 },

  alert: {
    marginTop: 12,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    borderRadius: 14,
    padding: "10px 12px",
    fontWeight: 800,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 12,
  },

  quizCard: {
    textAlign: "left",
    border: "1px solid var(--border)",
    background: "white",
    borderRadius: 16,
    padding: 14,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  },
  quizCardChecked: { borderColor: "#4f46e5", boxShadow: "0 10px 24px rgba(79,70,229,0.12)" },
  quizCardDisabled: { opacity: 0.55, cursor: "not-allowed" },

  quizHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  quizTitle: { fontWeight: 900 },
  pill: { borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 900 },
  pillChecked: { background: "#4f46e5", color: "white" },
  pillEmpty: { background: "#f3f4f6", color: "#111827" },

  quizDesc: { marginTop: 8, opacity: 0.8, lineHeight: 1.6, fontSize: 13, minHeight: 42 },
  quizDescMuted: { marginTop: 8, opacity: 0.5, lineHeight: 1.6, fontSize: 13, minHeight: 42 },

  quizMeta: { marginTop: 10, fontSize: 12, opacity: 0.6 },

  quizActions: { marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 },
  ctaRow: { display: "flex", gap: 8, alignItems: "baseline" },
  ctaLabel: { fontSize: 12, opacity: 0.7 },
  ctaStrong: { fontSize: 14, fontWeight: 900 },
  ctaNote: { marginTop: 6, fontSize: 12, opacity: 0.7 },

  footer: { marginTop: 16, paddingBottom: 24, display: "flex", justifyContent: "center" },
  saveBtn: {
    width: "min(520px, 100%)",
    border: "none",
    borderRadius: 16,
    padding: "14px 14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
  },
  saveBtnOn: { background: "#111827", color: "white" },
  saveBtnOff: { background: "#e5e7eb", color: "#6b7280", cursor: "not-allowed" },
  saveBtnSaving: { opacity: 0.8 },
}
