"use client"

type Candidate = {
  id: string
  japanese: string
  reading?: string
  note?: string
}

type Props = {
  candidate: Candidate
  ranking: number
  selected: boolean
  onSelect: () => void
}

export default function CandidateCard({
  candidate,
  ranking,
  selected,
  onSelect,
}: Props) {
  return (
    <div
      style={{
        border: selected ? "2px solid #93c5fd" : "1px solid #d9e0ea",
        background: selected ? "#eff6ff" : "#ffffff",
        borderRadius: 26,
        padding: 18,
        boxShadow: selected
          ? "0 0 0 3px rgba(191,219,254,0.65)"
          : "0 2px 8px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 12px",
            borderRadius: 999,
            background: "#f1f5f9",
            border: "1px solid #d9e0ea",
            color: "#334155",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          候補 {ranking}
        </div>

        {selected ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 12px",
              borderRadius: 999,
              background: "#2563eb",
              color: "#ffffff",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            選択中
          </div>
        ) : null}
      </div>

      <div
        style={{
          borderRadius: 20,
          background: "rgba(255,255,255,0.88)",
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 30,
            lineHeight: 1.3,
            fontWeight: 900,
            color: "#0f172a",
            wordBreak: "break-word",
          }}
        >
          {candidate.japanese}
        </div>

        {candidate.reading ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              fontWeight: 700,
              color: "#64748b",
            }}
          >
            {candidate.reading}
          </div>
        ) : null}
      </div>

      {candidate.note ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 18,
            background: "#f8fafc",
            padding: "12px 14px",
            fontSize: 14,
            lineHeight: 1.7,
            color: "#475569",
          }}
        >
          {candidate.note}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        style={{
          marginTop: 16,
          width: "100%",
          height: 60,
          borderRadius: 20,
          border: selected ? "2px solid #93c5fd" : "none",
          background: selected ? "#dbeafe" : "#2563eb",
          color: selected ? "#1d4ed8" : "#ffffff",
          fontSize: 18,
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: selected
            ? "none"
            : "0 6px 14px rgba(37,99,235,0.18)",
        }}
      >
        {selected ? "この文を選択中" : "この文で練習する"}
      </button>
    </div>
  )
}