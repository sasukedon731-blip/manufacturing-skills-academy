"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/useAuth"
import {
  SpeakingHistoryItem,
  getSpeakingHistory,
} from "@/app/lib/getSpeakingHistory"
import { calcGrowth } from "@/app/lib/calcGrowth"
import ScoreTrendChart from "@/app/components/ScoreTrendChart"

function formatDate(date: Date | null) {
  if (!date) return "-"
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${y}/${m}/${d} ${hh}:${mm}`
}

function shortLabel(index: number) {
  return `${index + 1}回前`
}

export default function SpeakingHistoryPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [items, setItems] = useState<SpeakingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!user?.uid) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        const rows = await getSpeakingHistory(user.uid, 50)
        setItems(rows)
      } catch (e: any) {
        console.error(e)
        setError(e?.message || "履歴の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.uid])

  const averageScore = useMemo(() => {
    if (!items.length) return 0
    return Math.round(
      items.reduce((sum, item) => sum + Number(item.totalScore || 0), 0) /
        items.length
    )
  }, [items])

  const growth = useMemo(() => {
    return calcGrowth(items.map((item) => Number(item.totalScore || 0)))
  }, [items])

  const trendPoints = useMemo(() => {
    return [...items]
      .slice(0, 10)
      .reverse()
      .map((item, index) => ({
        label: shortLabel(index),
        score: Number(item.totalScore || 0),
      }))
  }, [items])

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "20px 16px 40px",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 6,
              }}
            >
              AIスピーキング履歴
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              これまでのスピーキング練習と評価を確認できます
            </div>
          </div>

          <button
            onClick={() => router.push("/mypage")}
            style={{
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            マイページへ戻る
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <SummaryCard title="練習回数" value={`${items.length}回`} />
          <SummaryCard title="平均スコア" value={`${averageScore}点`} />
        </div>

        {growth ? (
          <Panel>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 10,
              }}
            >
              最近の成長
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              <MiniStat label="直近平均" value={`${growth.avgRecent}点`} />
              <MiniStat label="その前の平均" value={`${growth.avgPrev}点`} />
              <MiniStat
                label="変化"
                value={`${growth.diff >= 0 ? "+" : ""}${growth.diff}点`}
              />
            </div>
          </Panel>
        ) : null}

        {trendPoints.length > 0 ? (
          <div style={{ marginBottom: 18 }}>
            <ScoreTrendChart title="スコア推移" points={trendPoints} />
          </div>
        ) : null}

        {loading ? (
          <Panel>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                fontWeight: 700,
              }}
            >
              履歴を読み込み中...
            </div>
          </Panel>
        ) : null}

        {!loading && error ? (
          <Panel>
            <div
              style={{
                fontSize: 14,
                color: "#b91c1c",
                fontWeight: 700,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error}
            </div>
          </Panel>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <Panel>
            <div
              style={{
                fontSize: 15,
                color: "#111827",
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              まだスピーキング履歴がありません
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                lineHeight: 1.7,
              }}
            >
              AIスピーキングを完了すると、ここに履歴が保存されます。
            </div>
          </Panel>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div style={{ display: "grid", gap: 14 }}>
            {items.map((item) => {
              const open = openId === item.id

              return (
                <div
                  key={item.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 18,
                    boxShadow: "0 10px 30px rgba(17,24,39,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 10,
                        }}
                      >
                        <Badge>スピーキング</Badge>
                        <BadgeDark>{item.totalScore}点</BadgeDark>
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          marginBottom: 10,
                          fontWeight: 700,
                        }}
                      >
                        {formatDate(item.createdAt)}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: 10,
                        }}
                      >
                        <MiniStat
                          label="意味"
                          value={`${item.evaluation?.meaning ?? 0}点`}
                        />
                        <MiniStat
                          label="自然さ"
                          value={`${item.evaluation?.naturalness ?? 0}点`}
                        />
                        <MiniStat
                          label="丁寧さ"
                          value={`${item.evaluation?.politeness ?? 0}点`}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setOpenId(open ? null : item.id)}
                      style={{
                        border: "none",
                        background: open ? "#111827" : "#22c55e",
                        color: "#ffffff",
                        borderRadius: 12,
                        padding: "12px 16px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {open ? "閉じる" : "詳細を見る"}
                    </button>
                  </div>

                  {open ? (
                    <div style={{ marginTop: 16 }}>
                      {item.prompt ? (
                        <SectionBlock title="お題">
                          <PlainBox>{item.prompt}</PlainBox>
                        </SectionBlock>
                      ) : null}

                      {item.candidate ? (
                        <SectionBlock title="日本語候補">
                          <PlainBox>{item.candidate}</PlainBox>
                        </SectionBlock>
                      ) : null}

                      {item.transcript ? (
                        <SectionBlock title="文字起こし結果">
                          <PlainBox>{item.transcript}</PlainBox>
                        </SectionBlock>
                      ) : null}

                      {item.evaluation?.comment ? (
                        <SectionBlock title="AIフィードバック">
                          <PlainBox>{item.evaluation.comment}</PlainBox>
                        </SectionBlock>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 10px 30px rgba(17,24,39,0.05)",
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  )
}

function SummaryCard({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 10px 30px rgba(17,24,39,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 28,
          color: "#111827",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#f0fdf4",
        color: "#15803d",
        border: "1px solid #bbf7d0",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  )
}

function BadgeDark({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#111827",
        color: "#ffffff",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          color: "#111827",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionBlock({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontSize: 14,
          color: "#111827",
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function PlainBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        color: "#374151",
        lineHeight: 1.8,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {children}
    </div>
  )
}