"use client"

import { useMemo, useState } from "react"

type Props = {
  onGenerate: (args: {
    sourceLanguage: string
    sourceText: string
    scene: string
    politeness: string
  }) => void
  loading?: boolean
}

const MAX_TEXT_LENGTH = 80

const LANGUAGE_OPTIONS = [
  { value: "en", label: "🇬🇧 English", placeholder: "Example: Hello / Nice to meet you / I will be late tomorrow" },
  { value: "id", label: "🇮🇩 Bahasa Indonesia", placeholder: "Contoh: Halo / Senang bertemu dengan Anda / Saya akan terlambat besok" },
  { value: "my", label: "🇲🇲 မြန်မာ", placeholder: "ဥပမာ - မင်္ဂလာပါ / တွေ့ရတာဝမ်းသာပါတယ် / မနက်ဖြန် နောက်ကျပါမယ်" },
  { value: "vi", label: "🇻🇳 Tiếng Việt", placeholder: "Ví dụ: Xin chào / Rất vui được gặp bạn / Ngày mai tôi sẽ đến muộn" },
  { value: "tl", label: "🇵🇭 Filipino", placeholder: "Halimbawa: Hello / Ikinagagalak kitang makilala / Mahuhuli ako bukas" },
  { value: "hi", label: "🇮🇳 हिन्दी", placeholder: "उदाहरण: नमस्ते / आपसे मिलकर खुशी हुई / मैं कल देर से आऊँगा" },
] as const

export default function SpeakingInput({ onGenerate, loading = false }: Props) {
  const [text, setText] = useState("")
  const [language, setLanguage] = useState("en")
  const [scene, setScene] = useState("work")
  const [politeness, setPoliteness] = useState("polite")

  const placeholder = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((option) => option.value === language)?.placeholder ??
      LANGUAGE_OPTIONS[0].placeholder,
    [language]
  )

  const disabled = loading || !text.trim()

  return (
    <div style={styles.wrap}>
      <div style={styles.grid}>
        <label style={styles.labelBlock}>
          <div style={styles.label}>言語</div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.select}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.labelBlock}>
          <div style={styles.label}>場面</div>
          <select
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            style={styles.select}
          >
            <option value="work">Work</option>
            <option value="daily">Daily</option>
            <option value="interview">Interview</option>
          </select>
        </label>
      </div>

      <label style={styles.labelBlock}>
        <div style={styles.label}>言いたいこと</div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT_LENGTH))}
          placeholder={placeholder}
          style={styles.textarea}
        />

        <div style={styles.helpText}>
          短い文のほうが、自然で話しやすい候補を作りやすいです。
        </div>

        <div
          style={{
            ...styles.counter,
            color: text.length >= MAX_TEXT_LENGTH ? "#dc2626" : "#64748b",
          }}
        >
          {text.length} / {MAX_TEXT_LENGTH}
        </div>
      </label>

      <label style={styles.labelBlock}>
        <div style={styles.label}>丁寧さ</div>
        <select
          value={politeness}
          onChange={(e) => setPoliteness(e.target.value)}
          style={styles.select}
        >
          <option value="polite">ていねい</option>
          <option value="casual">ややカジュアル</option>
          <option value="formal">かなりていねい</option>
        </select>
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onGenerate({
            sourceLanguage: language,
            sourceText: text,
            scene,
            politeness,
          })
        }
        style={{
          ...styles.primaryButton,
          ...(disabled ? styles.primaryButtonDisabled : null),
        }}
      >
        {loading ? "日本語候補を作成中..." : "日本語候補を2つ作る"}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 16,
  },
  grid: {
    display: "grid",
    gap: 16,
  },
  labelBlock: {
    display: "block",
  },
  label: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
    marginBottom: 8,
  },
  select: {
    width: "100%",
    height: 58,
    borderRadius: 20,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    padding: "0 18px",
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 150,
    borderRadius: 22,
    border: "1px solid #d9e0ea",
    background: "#ffffff",
    padding: "16px 18px",
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
  },
  helpText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#64748b",
  },
  counter: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 13,
    fontWeight: 800,
  },
  primaryButton: {
    width: "100%",
    height: 60,
    borderRadius: 20,
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(37,99,235,0.22)",
    marginTop: 4,
  },
  primaryButtonDisabled: {
    background: "#94a3b8",
    boxShadow: "none",
    cursor: "not-allowed",
  },
}