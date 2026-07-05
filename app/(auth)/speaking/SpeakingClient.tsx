"use client"

import { useState } from "react"
import Link from "next/link"

import AppHeader from "@/app/components/AppHeader"
import SpeakingInput from "./components/SpeakingInput"
import CandidateCard from "./components/CandidateCard"
import SpeakingRecorder from "./components/SpeakingRecorder"
import EvaluationCard from "./components/EvaluationCard"
import { saveSpeakingHistory } from "@/app/lib/saveSpeakingHistory"
import { useAuth } from "@/app/lib/useAuth"

type Candidate = {
  id: string
  japanese: string
  reading?: string
  note?: string
}

type EvaluationResult = {
  overallResult: string
  scores: {
    meaning: number
    naturalness: number
    politeness: number
  }
  goodPoints?: string[]
  fixPoints?: string[]
  recommended?: string
  shortFeedback?: string
}

export default function SpeakingClient() {
  const { user, loading: authLoading } = useAuth()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [transcript, setTranscript] = useState("")
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function generate(data: {
    sourceLanguage: string
    sourceText: string
    scene: string
    politeness: string
  }) {
    try {
      setLoading(true)
      setError("")
      setCandidates([])
      setSelected(null)
      setTranscript("")
      setEvaluation(null)

      const res = await fetch("/api/speaking/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || "日本語候補の作成に失敗しました")
      }

      const nextCandidates = Array.isArray(json?.candidates) ? json.candidates : []
      setCandidates(nextCandidates)

      if (nextCandidates.length > 0) {
        setSelected(nextCandidates[0])
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  async function evaluate(spoken: string) {
    if (!selected) return
    if (!spoken?.trim()) return

    try {
      setError("")
      setEvaluation(null)

      const res = await fetch("/api/speaking/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetText: selected.japanese,
          spokenTranscript: spoken,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error || "評価に失敗しました")
      }

      const nextEvaluation = json as EvaluationResult
      setEvaluation(nextEvaluation)

      if (authLoading) {
        console.warn("認証状態の確認中のため、履歴保存をスキップしました")
        return
      }

      if (!user?.uid) {
        console.warn("ユーザー未ログインのため、履歴保存をスキップしました")
        setError("ログイン情報を確認できないため、履歴を保存できませんでした")
        return
      }

      const totalScore = Math.round(
        (
          (nextEvaluation.scores?.meaning ?? 0) +
          (nextEvaluation.scores?.naturalness ?? 0) +
          (nextEvaluation.scores?.politeness ?? 0)
        ) / 3
      )

      await saveSpeakingHistory({
        uid: user.uid,
        prompt: selected.japanese,
        candidate: selected.japanese,
        transcript: spoken,
        evaluation: {
          meaning: nextEvaluation.scores?.meaning ?? 0,
          naturalness: nextEvaluation.scores?.naturalness ?? 0,
          politeness: nextEvaluation.scores?.politeness ?? 0,
          totalScore,
          comment: nextEvaluation.shortFeedback,
        },
      })

      console.log("speaking history saved")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "評価に失敗しました")
    }
  }

  function resetForRetry() {
    setTranscript("")
    setEvaluation(null)
    setError("")
  }

  return (
    <>
      <AppHeader title="スピーキング" />

      <main style={styles.main}>
        <section style={styles.heroCard}>
          <div style={styles.eyebrow}>AI日本語トレーニング</div>
          <h1 style={styles.heroTitle}>話す練習をしよう</h1>
          <p style={styles.heroText}>
            言いたいことを入れて、日本語候補を2つから選び、録音してAI評価まで進めます。
          </p>
        </section>

        <section style={styles.sectionCard}>
          <div style={styles.stepRow}>
            <div style={styles.stepBadge}>1</div>
            <div>
              <div style={styles.stepLabel}>STEP 1</div>
              <h2 style={styles.sectionTitle}>言いたいことを入れる</h2>
              <p style={styles.sectionText}>
                母国語で入力すると、日本語候補を2つ作ります。
              </p>
            </div>
          </div>

          <SpeakingInput onGenerate={generate} loading={loading} />
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {candidates.length > 0 ? (
          <section style={styles.sectionCard}>
            <div style={styles.stepRow}>
              <div style={styles.stepBadge}>2</div>
              <div>
                <div style={styles.stepLabel}>STEP 2</div>
                <h2 style={styles.sectionTitle}>日本語候補をえらぶ</h2>
                <p style={styles.sectionText}>
                  言いやすい方を1つ選んで、次へ進みます。
                </p>
              </div>
            </div>

            <div style={styles.stack}>
              {candidates.map((candidate, index) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  ranking={index + 1}
                  selected={selected?.id === candidate.id}
                  onSelect={() => {
                    setSelected(candidate)
                    setTranscript("")
                    setEvaluation(null)
                    setError("")
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        {selected ? (
          <section style={styles.sectionCard}>
            <div style={styles.stepRow}>
              <div style={styles.stepBadge}>3</div>
              <div>
                <div style={styles.stepLabel}>STEP 3</div>
                <h2 style={styles.sectionTitle}>話してみよう</h2>
                <p style={styles.sectionText}>
                  ボタンを押して話し始め、終わったらもう一度押して停止します。
                </p>
              </div>
            </div>

            <SpeakingRecorder
              key={selected.id}
              target={selected.japanese}
              reading={selected.reading}
              note={selected.note}
              onTranscript={(value) => {
                setTranscript(value)
                void evaluate(value)
              }}
              onError={(message) => setError(message)}
            />
          </section>
        ) : null}

        {transcript ? (
          <section style={styles.sectionCard}>
            <div style={styles.stepRow}>
              <div style={styles.stepBadge}>4</div>
              <div>
                <div style={styles.stepLabel}>STEP 4</div>
                <h2 style={styles.sectionTitle}>認識結果とAI評価</h2>
                <p style={styles.sectionText}>
                  自分の発話がどう聞こえたかを確認します。
                </p>
              </div>
            </div>

            <div style={styles.transcriptCard}>
              <div style={styles.transcriptLabel}>認識された日本語</div>
              <div style={styles.transcriptText}>{transcript}</div>
            </div>

            {evaluation ? (
              <EvaluationCard result={evaluation} />
            ) : (
              <div style={styles.infoBox}>AI評価を作成中です...</div>
            )}

            <div style={styles.actionRow}>
              <button type="button" onClick={resetForRetry} style={styles.subButton}>
                もう一回練習する
              </button>

              <Link href="/" style={styles.darkButton}>
                TOPに戻る
              </Link>
            </div>
          </section>
        ) : null}
      </main>

      <div style={styles.bottomBar}>
        <div style={styles.bottomBarInner}>
          <Link href="/" style={styles.bottomBarButton}>
            TOPに戻る
          </Link>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 880,
    margin: "0 auto",
    padding: "16px 16px 168px",
  },
  heroCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 28,
    padding: 20,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 36,
    lineHeight: 1.15,
    fontWeight: 900,
    color: "#0f172a",
    margin: "0 0 12px",
  },
  heroText: {
    fontSize: 16,
    lineHeight: 1.8,
    color: "#475569",
    margin: 0,
  },
  sectionCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 28,
    padding: 20,
    boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
    marginBottom: 16,
  },
  stepRow: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 999,
    background: "#16a34a",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#16a34a",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 1.3,
    fontWeight: 900,
    color: "#0f172a",
    margin: "0 0 8px",
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
    margin: 0,
  },
  stack: {
    display: "grid",
    gap: 14,
  },
  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 16,
    whiteSpace: "pre-wrap",
  },
  transcriptCard: {
    background: "#f8fafc",
    border: "1px solid #dbe3ee",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 20,
    lineHeight: 1.7,
    color: "#0f172a",
    fontWeight: 800,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  infoBox: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
    fontWeight: 700,
    marginTop: 16,
  },
  actionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 18,
  },
  subButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 16,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  },
  darkButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "#111827",
    color: "#ffffff",
    borderRadius: 16,
    padding: "14px 18px",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
  },
  bottomBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "12px 16px 16px",
    background:
      "linear-gradient(to top, rgba(244,247,251,0.98), rgba(244,247,251,0.88), rgba(244,247,251,0))",
    pointerEvents: "none",
  },
  bottomBarInner: {
    maxWidth: 880,
    margin: "0 auto",
    pointerEvents: "auto",
  },
  bottomBarButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 56,
    borderRadius: 18,
    background: "#0f172a",
    color: "#ffffff",
    fontSize: 17,
    fontWeight: 900,
    textDecoration: "none",
    boxShadow: "0 12px 24px rgba(15,23,42,0.18)",
  },
}