"use client"

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

function normalizeScore(value: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function scoreColor(score: number) {
  if (score >= 90) {
    return {
      bg: "#ecfdf5",
      border: "#a7f3d0",
      text: "#065f46",
      bar: "#10b981",
    }
  }

  if (score >= 75) {
    return {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      bar: "#3b82f6",
    }
  }

  if (score >= 60) {
    return {
      bg: "#fffbeb",
      border: "#fde68a",
      text: "#b45309",
      bar: "#f59e0b",
    }
  }

  return {
    bg: "#fef2f2",
    border: "#fecaca",
    text: "#b91c1c",
    bar: "#ef4444",
  }
}

function calcTotalScore(scores: EvaluationResult["scores"]) {
  return Math.round(
    (normalizeScore(scores.meaning) +
      normalizeScore(scores.naturalness) +
      normalizeScore(scores.politeness)) /
      3
  )
}

function scoreComment(score: number) {
  if (score >= 90) return "かなり良い"
  if (score >= 75) return "良い"
  if (score >= 60) return "あと少し"
  return "練習しよう"
}

function ScoreCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  const score = normalizeScore(value)
  const colors = scoreColor(score)

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          {score}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "#64748b",
          }}
        >
          / 100
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 10,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            borderRadius: 999,
            background: colors.bar,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 800,
          color: colors.text,
        }}
      >
        {scoreComment(score)}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  items,
  bg,
  border,
}: {
  title: string
  items: string[]
  bg: string
  border: string
}) {
  if (!items?.length) return null

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 24,
        padding: 18,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: 12,
        }}
      >
        {title}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, idx) => (
          <div
            key={`${title}-${idx}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 15,
              lineHeight: 1.8,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            <span style={{ color: "#0f172a", fontWeight: 900 }}>•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EvaluationCard({
  result,
}: {
  result: EvaluationResult
}) {
  const totalScore = calcTotalScore(result.scores)

  return (
    <div style={styles.wrap}>
      <div style={styles.overallCard}>
        <div style={styles.overallTopRow}>
          <div>
            <div style={styles.overallLabel}>総合評価</div>
            <div style={styles.overallValue}>{result.overallResult}</div>
          </div>

          <div style={styles.totalScoreBadge}>
            <div style={styles.totalScoreNumber}>{totalScore}</div>
            <div style={styles.totalScoreUnit}>/ 100</div>
          </div>
        </div>

        {result.shortFeedback ? (
          <div style={styles.overallText}>{result.shortFeedback}</div>
        ) : null}
      </div>

      <div style={styles.scoreGrid}>
        <ScoreCard label="意味" value={result.scores.meaning} />
        <ScoreCard label="自然さ" value={result.scores.naturalness} />
        <ScoreCard label="丁寧さ" value={result.scores.politeness} />
      </div>

      <SectionCard
        title="良かったところ"
        items={result.goodPoints || []}
        bg="#eff6ff"
        border="#bfdbfe"
      />

      <SectionCard
        title="直すともっと良いところ"
        items={result.fixPoints || []}
        bg="#fff7ed"
        border="#fdba74"
      />

      {result.recommended ? (
        <div style={styles.recommendCard}>
          <div style={styles.recommendLabel}>おすすめ表現</div>
          <div style={styles.recommendValue}>{result.recommended}</div>
        </div>
      ) : null}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 14,
  },
  overallCard: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 24,
    padding: 18,
  },
  overallTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  overallLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#047857",
    marginBottom: 8,
  },
  overallValue: {
    fontSize: 26,
    lineHeight: 1.5,
    fontWeight: 900,
    color: "#0f172a",
    wordBreak: "break-word",
  },
  overallText: {
    fontSize: 16,
    lineHeight: 1.8,
    color: "#334155",
    fontWeight: 700,
  },
  totalScoreBadge: {
    minWidth: 110,
    background: "#ffffff",
    border: "1px solid #bbf7d0",
    borderRadius: 20,
    padding: "12px 14px",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },
  totalScoreNumber: {
    fontSize: 32,
    lineHeight: 1,
    fontWeight: 900,
    color: "#0f172a",
  },
  totalScoreUnit: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  recommendCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 24,
    padding: 18,
  },
  recommendLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 8,
  },
  recommendValue: {
    fontSize: 26,
    lineHeight: 1.5,
    fontWeight: 900,
    color: "#0f172a",
    wordBreak: "break-word",
  },
}