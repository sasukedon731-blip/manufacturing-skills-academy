"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"

import { auth } from "@/app/lib/firebase"
import AppHeader from "@/app/components/AppHeader"
import { loadAndRepairUserPlanState, saveIndustryWithLock } from "@/app/lib/userPlanState"

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

const LS_INDUSTRY_KEY = "selected-industry"

export default function SelectIndustryPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [currentIndustry, setCurrentIndustry] = useState<IndustryId>("undecided")
  const [nextAllowedAt, setNextAllowedAt] = useState<Date | null>(null)

  // ✅ もともとの導線：URLで industry が来たら初期選択に反映（保存はボタンで）
  const industryParam = params.get("industry")
  useEffect(() => {
    if (industryParam && isIndustryId(industryParam)) {
      setCurrentIndustry(industryParam)
    }
  }, [industryParam])

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
        setNextAllowedAt(state.nextChangeAllowedAt)

        // Firestore側の industry があればそれを優先
        // （無ければ localStorage を初期値に）
        // ※ userPlanState は industry を持たないのでここでは localStorage を使う
        try {
          const saved = localStorage.getItem(LS_INDUSTRY_KEY)
          if (saved && isIndustryId(saved)) {
            setCurrentIndustry(saved)
          }
        } catch {}
      } catch (e) {
        console.error(e)
        setError("読み込みに失敗しました")
      } finally {
        setLoading(false)
      }
    })()
  }, [uid])

  const now = new Date()
  const changeOk = canChange(now, nextAllowedAt)

  const items = useMemo(() => {
    const order: IndustryId[] = ["construction", "manufacturing", "care", "driver", "undecided"]
    return order.map((id) => ({ id, label: INDUSTRY_LABEL[id] }))
  }, [])

  const save = async () => {
    if (!uid) return
    setSaving(true)
    setError("")
    try {
      if (!changeOk) {
        setError(`業種変更は月1回までです。次回：${nextAllowedAt ? formatDate(nextAllowedAt) : "—"}`)
        return
      }

      const res = await saveIndustryWithLock({ uid, industry: currentIndustry })
      // localStorage にも同期（他ページのURL付与にも使う）
      try {
        localStorage.setItem(LS_INDUSTRY_KEY, currentIndustry)
      } catch {}

      // 次回変更可能日を表示更新
      setNextAllowedAt(res.nextChangeAllowedAt)

      // マイページへ戻る
      router.replace("/mypage")
    } catch (e) {
      console.error(e)
      setError("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  }

   return (
    <main className="container">
      <AppHeader title="業種を選択" />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: 12 }}>
        <div style={{ marginBottom: 10, opacity: 0.75, fontWeight: 700 }}>
          月1回まで変更できます
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>読み込み中…</div>
        ) : (
          <>
            {!changeOk && (
              <div
                style={{
                  border: "1px solid #f2d7d7",
                  background: "#fff5f5",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  fontWeight: 800,
                }}
              >
                業種変更は月1回まで。次回変更可能日：
                {nextAllowedAt ? formatDate(nextAllowedAt) : "—"}
              </div>
            )}

            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 16,
                padding: 12,
                background: "white",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8 }}>業種</div>

              <div style={{ display: "grid", gap: 10 }}>
                {items.map((it) => {
                  const active = currentIndustry === it.id
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setCurrentIndustry(it.id)}
                      disabled={!changeOk && !active} // ロック中は変更不可（表示だけ残す）
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: active ? "2px solid #111" : "1px solid #e7e7e7",
                        background: active ? "#f7f7f7" : "white",
                        cursor: !changeOk && !active ? "not-allowed" : "pointer",
                        opacity: !changeOk && !active ? 0.6 : 1,
                        fontWeight: 900,
                      }}
                    >
                      {it.label}
                    </button>
                  )
                })}
              </div>

              {error && (
                <div style={{ marginTop: 10, color: "#c00", fontWeight: 800 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid #e7e7e7",
                    background: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  戻る
                </button>

                <button
                  type="button"
                  onClick={save}
                  disabled={saving || !changeOk}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "none",
                    fontWeight: 900,
                    cursor: saving || !changeOk ? "not-allowed" : "pointer",
                    opacity: saving || !changeOk ? 0.6 : 1,
                  }}
                >
                  {saving ? "保存中…" : "保存する"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
  }