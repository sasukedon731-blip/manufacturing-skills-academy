"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/lib/useAuth"
import { saveConversationHistory } from "@/app/lib/conversationHistory"

type ThemeOption = {
  id: string
  label: string
  description: string
}

type LevelOption = {
  id: string
  label: string
  description: string
}

type MessageRole = "ai" | "user" | "system"

type ChatMessage = {
  id: string
  role: MessageRole
  text: string
  createdAt: number
}

type FinalEvaluation = {
  clarity?: number | string
  naturalness?: number | string
  politeness?: number | string
  continuity?: number | string
  goodPoints?: string[]
  nextTips?: string[]
  comment?: string
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "work-greeting",
    label: "職場あいさつ",
    description: "出社・退勤・簡単な受け答えを練習",
  },
  {
    id: "interview",
    label: "面接",
    description: "自己紹介や志望動機の受け答えを練習",
  },
  {
    id: "daily",
    label: "日常会話",
    description: "買い物・道案内・簡単な会話を練習",
  },
]

const LEVEL_OPTIONS: LevelOption[] = [
  { id: "N5", label: "N5", description: "かなりやさしい日本語" },
  { id: "N4", label: "N4", description: "やさしい日常会話" },
  { id: "N3", label: "N3", description: "少し長めの自然な会話" },
  { id: "N2", label: "N2", description: "より自然で実用的な会話" },
  { id: "business", label: "ビジネス", description: "丁寧で仕事向けの会話" },
]

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

function getTextFromApiResult(data: any): string {
  return data?.reply || data?.message || data?.text || data?.assistant || data?.content || ""
}

function normalizeEvaluation(data: any): FinalEvaluation | null {
  if (!data) return null

  const src = data.evaluation ?? data.feedback ?? data.result ?? data
  if (!src || typeof src !== "object") return null

  return {
    clarity: src.clarity ?? src.transmitted ?? src["伝わりやすさ"],
    naturalness: src.naturalness ?? src["自然さ"],
    politeness: src.politeness ?? src["丁寧さ"],
    continuity: src.continuity ?? src.conversationFlow ?? src["会話継続力"],
    goodPoints:
      src.goodPoints ??
      src.good_points ??
      src.positives ??
      src["良かったところ"] ??
      [],
    nextTips:
      src.nextTips ??
      src.next_tips ??
      src.improvements ??
      src["次に意識すること"] ??
      [],
    comment: src.comment ?? src.summary ?? src["コメント"] ?? "",
  }
}

async function blobToObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob)
}

function getAudioExtensionFromMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4"
  if (mimeType.includes("mpeg")) return "mp3"
  if (mimeType.includes("wav")) return "wav"
  if (mimeType.includes("ogg")) return "ogg"
  return "webm"
}

function toDisplayScore(value?: number | string) {
  const num = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.max(0, Math.min(100, Math.round(num)))
}

export default function ConversationClient() {
  const router = useRouter()
  const { user } = useAuth()

  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const [level, setLevel] = useState<string>("N4")
  const [started, setStarted] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [turn, setTurn] = useState(0)
  const [maxTurns] = useState(3)

  const [loadingStart, setLoadingStart] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const [recognizedText, setRecognizedText] = useState("")
  const [error, setError] = useState("")
  const [finalEvaluation, setFinalEvaluation] = useState<FinalEvaluation | null>(null)
  const [finalTotalScore, setFinalTotalScore] = useState<number>(0)
  const [finished, setFinished] = useState(false)

  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState("")

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasSavedRef = useRef(false)

  const selectedThemeLabel = useMemo(() => {
    return THEME_OPTIONS.find((t) => t.id === selectedTheme)?.label ?? ""
  }, [selectedTheme])

  const levelLabel = useMemo(() => {
    return LEVEL_OPTIONS.find((item) => item.id === level)?.label ?? level
  }, [level])



  useEffect(() => {
    const timer = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }, 50)

    return () => window.clearTimeout(timer)
  }, [messages, finalEvaluation, loadingReply, recognizedText, error, saveStatus, saveError])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    async function persistConversation() {
      if (!finished || !finalEvaluation || !user?.uid) return
      if (hasSavedRef.current) return

      try {
        hasSavedRef.current = true
        setSaveStatus("saving")
        setSaveError("")

        await saveConversationHistory({
          uid: user.uid,
          theme: selectedTheme,
          themeLabel: selectedThemeLabel,
          level,
          levelLabel,
          messages: messages.map((m) => ({
            role: m.role,
            text: m.text,
            createdAt: m.createdAt,
          })),
          evaluation: finalEvaluation,
          totalScore: finalTotalScore,
        })

        setSaveStatus("saved")
      } catch (e: any) {
        console.error("saveConversationHistory error:", e)
        setSaveStatus("error")
        setSaveError(e?.message || "履歴の保存に失敗しました")
        hasSavedRef.current = false
      }
    }

    persistConversation()
  }, [
    finished,
    finalEvaluation,
    finalTotalScore,
    user?.uid,
    selectedTheme,
    selectedThemeLabel,
    level,
    levelLabel,
    messages,
  ])

  async function startConversation() {
    if (!selectedTheme || loadingStart) return

    setError("")
    setLoadingStart(true)
    setStarted(false)
    setFinished(false)
    setFinalEvaluation(null)
    setFinalTotalScore(0)
    setMessages([])
    setTurn(0)
    setRecognizedText("")
    setSaveStatus("idle")
    setSaveError("")
    hasSavedRef.current = false

    try {
      const res = await fetch("/api/conversation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: selectedTheme,
          level,
        }),
      })

      if (!res.ok) {
        throw new Error("会話開始に失敗しました")
      }

      const data = await res.json()
      const aiText = getTextFromApiResult(data)

      if (!aiText) {
        throw new Error("AIの最初のメッセージが取得できませんでした")
      }

      setMessages([
        {
          id: uid("ai"),
          role: "ai",
          text: aiText,
          createdAt: Date.now(),
        },
      ])
      setStarted(true)
    } catch (e: any) {
      setError(e?.message || "会話開始中にエラーが発生しました")
    } finally {
      setLoadingStart(false)
    }
  }

  async function beginRecording() {
    if (isRecording || isTranscribing || loadingReply || finished) return

    setError("")
    setRecognizedText("")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ]

      const supportedMimeType =
        preferredMimeTypes.find((type) => {
          try {
            return typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)
          } catch {
            return false
          }
        }) || ""

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = (event: Event) => {
        console.error("MediaRecorder error:", event)
        setError("録音中にエラーが発生しました")
        setIsRecording(false)
      }

      recorder.onstop = async () => {
        try {
          setIsRecording(false)
          setIsTranscribing(true)

          if (!chunksRef.current.length) {
            throw new Error("録音データが取得できませんでした")
          }

          const mimeType = recorder.mimeType || supportedMimeType || "audio/webm"
          const extension = getAudioExtensionFromMimeType(mimeType)

          const blob = new Blob(chunksRef.current, { type: mimeType })

          if (!blob.size) {
            throw new Error("録音データが空でした")
          }

          const file = new File([blob], `conversation.${extension}`, {
            type: mimeType,
          })

          const formData = new FormData()
          formData.append("audio", file)

          const res = await fetch("/api/speaking/transcribe", {
            method: "POST",
            body: formData,
          })

          if (!res.ok) {
            const errText = await res.text()
            throw new Error(`文字起こしに失敗しました: ${errText}`)
          }

          const data = await res.json()
          const text = data?.text || data?.transcript || data?.result || ""

          if (!text) {
            throw new Error("音声がうまく認識できませんでした")
          }

          setRecognizedText(text)
          await submitUserText(text)
        } catch (e: any) {
          setError(e?.message || "文字起こし中にエラーが発生しました")
        } finally {
          setIsTranscribing(false)

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop())
            mediaStreamRef.current = null
          }

          chunksRef.current = []
          mediaRecorderRef.current = null
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (e: any) {
      setError(e?.message || "録音を開始できませんでした")
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === "inactive") return
    recorder.stop()
  }

  async function submitUserText(text: string) {
    if (!text.trim()) return
    if (loadingReply) return

    const userMessage: ChatMessage = {
      id: uid("user"),
      role: "user",
      text: text.trim(),
      createdAt: Date.now(),
    }

    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setLoadingReply(true)
    setError("")

    try {
      const res = await fetch("/api/conversation/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: selectedTheme,
          level,
          turn: turn + 1,
          userText: text.trim(),
          history: nextMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error("AIの返答取得に失敗しました")
      }

      const data = await res.json()
      const aiText = getTextFromApiResult(data)
      const evaluation = normalizeEvaluation(data)
      const totalScore = toDisplayScore(data?.totalScore)
      const done = Boolean(data?.done) || turn + 1 >= maxTurns

      if (aiText) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid("ai"),
            role: "ai",
            text: aiText,
            createdAt: Date.now(),
          },
        ])
      }

      setTurn((prev) => prev + 1)

      if (done) {
        setFinished(true)

        if (evaluation) {
          setFinalEvaluation(evaluation)
          setFinalTotalScore(totalScore)
        } else {
          setFinalEvaluation({
            comment: "3ターンの会話が完了しました。次はより自然な言い回しを意識してみましょう。",
          })
          setFinalTotalScore(totalScore)
        }
      }
    } catch (e: any) {
      setError(e?.message || "AI返信中にエラーが発生しました")
    } finally {
      setLoadingReply(false)
    }
  }

  async function playTts(messageId: string, text: string) {
    if (!text.trim()) return

    try {
      setPlayingMessageId(messageId)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      const res = await fetch("/api/speaking/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        throw new Error("音声生成に失敗しました")
      }

      const contentType = res.headers.get("content-type") || ""
      let audioUrl = ""

      if (contentType.includes("application/json")) {
        const data = await res.json()

        if (data?.audioUrl) {
          audioUrl = data.audioUrl
        } else if (data?.url) {
          audioUrl = data.url
        } else if (data?.audioBase64) {
          audioUrl = `data:audio/mp3;base64,${data.audioBase64}`
        } else if (data?.base64) {
          audioUrl = `data:audio/mp3;base64,${data.base64}`
        } else {
          throw new Error("音声URLが見つかりませんでした")
        }
      } else {
        const blob = await res.blob()
        audioUrl = await blobToObjectUrl(blob)
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingMessageId(null)
      }

      audio.onerror = () => {
        setPlayingMessageId(null)
      }

      await audio.play()
    } catch (e: any) {
      setError(e?.message || "TTS再生に失敗しました")
      setPlayingMessageId(null)
    }
  }

  function resetConversation() {
    setStarted(false)
    setFinished(false)
    setFinalEvaluation(null)
    setFinalTotalScore(0)
    setMessages([])
    setTurn(0)
    setRecognizedText("")
    setError("")
    setPlayingMessageId(null)
    setSaveStatus("idle")
    setSaveError("")
    hasSavedRef.current = false

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    chunksRef.current = []
    mediaRecorderRef.current = null
  }

  const canRecord =
    started && !finished && !isRecording && !isTranscribing && !loadingReply

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 4,
              }}
            >
              AI会話レッスン
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              3ターン会話で日本語の会話力を練習
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            style={{
              border: "none",
              background: "#111827",
              color: "#ffffff",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            TOPへ戻る
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          padding: "16px 16px 120px",
          boxSizing: "border-box",
        }}
      >
        {!started ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 10px 30px rgba(17,24,39,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                marginBottom: 8,
                color: "#111827",
              }}
            >
              テーマを選んで会話スタート
            </div>

            <div
              style={{
                fontSize: 14,
                color: "#6b7280",
                marginBottom: 16,
                lineHeight: 1.7,
              }}
            >
              AIが最初に話しかけます。あなたは録音して返答してください。
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {THEME_OPTIONS.map((theme) => {
                const active = selectedTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    style={{
                      textAlign: "left",
                      border: active ? "2px solid #22c55e" : "1px solid #d1d5db",
                      background: active ? "#f0fdf4" : "#ffffff",
                      borderRadius: 16,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: 6,
                      }}
                    >
                      {theme.label}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 1.6,
                      }}
                    >
                      {theme.description}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                会話レベル
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {LEVEL_OPTIONS.map((item) => {
                  const active = level === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => setLevel(item.id)}
                      style={{
                        textAlign: "left",
                        border: active ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        background: active ? "#eff6ff" : "#ffffff",
                        borderRadius: 14,
                        padding: 14,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#111827",
                          marginBottom: 4,
                        }}
                      >
                        {item.label}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {error ? (
              <div
                style={{
                  marginTop: 14,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              onClick={startConversation}
              disabled={!selectedTheme || loadingStart}
              style={{
                marginTop: 16,
                width: "100%",
                border: "none",
                borderRadius: 14,
                padding: "16px 18px",
                background: !selectedTheme || loadingStart ? "#9ca3af" : "#22c55e",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                cursor: !selectedTheme || loadingStart ? "not-allowed" : "pointer",
              }}
            >
              {loadingStart ? "会話を準備中..." : "会話をはじめる"}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#111827",
                  fontWeight: 700,
                }}
              >
                テーマ：{selectedThemeLabel}
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#111827",
                  fontWeight: 700,
                }}
              >
                レベル：{levelLabel}
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#111827",
                  fontWeight: 700,
                }}
              >
                ターン：{Math.min(turn + 1, maxTurns)} / {maxTurns}
              </div>
            </div>

            <div
              ref={scrollRef}
              style={{
                flex: 1,
                minHeight: 380,
                maxHeight: "calc(100vh - 320px)",
                overflowY: "auto",
                background: "#dff3ff",
                borderRadius: 22,
                padding: 16,
                border: "1px solid #c7e6fb",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                scrollBehavior: "smooth",
              }}
            >
              {messages.map((message) => {
                const isAi = message.role === "ai"

                return (
                  <div
                    key={message.id}
                    style={{
                      display: "flex",
                      justifyContent: isAi ? "flex-start" : "flex-end",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "78%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isAi ? "flex-start" : "flex-end",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                          fontWeight: 700,
                          padding: "0 6px",
                        }}
                      >
                        {isAi ? "AI" : "あなた"}
                      </div>

                      <div
                        style={{
                          background: isAi ? "#ffffff" : "#22c55e",
                          color: isAi ? "#111827" : "#ffffff",
                          borderRadius: 18,
                          padding: "12px 14px",
                          fontSize: 15,
                          lineHeight: 1.8,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message.text}
                      </div>

                      {isAi ? (
                        <button
                          onClick={() => playTts(message.id, message.text)}
                          disabled={playingMessageId === message.id}
                          style={{
                            border: "none",
                            background:
                              playingMessageId === message.id ? "#9ca3af" : "#111827",
                            color: "#ffffff",
                            borderRadius: 999,
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor:
                              playingMessageId === message.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {playingMessageId === message.id ? "再生中..." : "音声を再生"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}

              {loadingReply ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 18,
                      padding: "12px 14px",
                      fontSize: 14,
                      color: "#6b7280",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    }}
                  >
                    AIが返信を考えています...
                  </div>
                </div>
              ) : null}

              {finished && finalEvaluation ? (
                <div
                  style={{
                    marginTop: 18,
                    background: "#ffffff",
                    borderRadius: 20,
                    padding: 18,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 30px rgba(17,24,39,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: 12,
                    }}
                  >
                    総合評価
                  </div>

                  <div
                    style={{
                      marginBottom: 14,
                      background: "#111827",
                      color: "#ffffff",
                      borderRadius: 18,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.85,
                        marginBottom: 6,
                        fontWeight: 700,
                      }}
                    >
                      総合スコア
                    </div>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {finalTotalScore}点
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        opacity: 0.9,
                        lineHeight: 1.6,
                      }}
                    >
                      100点満点
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <ScoreMiniCard title="伝わりやすさ" value={toDisplayScore(finalEvaluation.clarity)} />
                    <ScoreMiniCard title="自然さ" value={toDisplayScore(finalEvaluation.naturalness)} />
                    <ScoreMiniCard title="丁寧さ" value={toDisplayScore(finalEvaluation.politeness)} />
                    <ScoreMiniCard title="会話継続力" value={toDisplayScore(finalEvaluation.continuity)} />
                  </div>

                  {saveStatus === "saving" ? (
                    <div
                      style={{
                        marginBottom: 12,
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1d4ed8",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      履歴を保存中...
                    </div>
                  ) : null}

                  {saveStatus === "saved" ? (
                    <div
                      style={{
                        marginBottom: 12,
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#15803d",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      会話履歴を保存しました
                    </div>
                  ) : null}

                  {saveStatus === "error" ? (
                    <div
                      style={{
                        marginBottom: 12,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      履歴の保存に失敗しました
                      {saveError ? `：${saveError}` : ""}
                    </div>
                  ) : null}

                  {!!finalEvaluation.goodPoints?.length && (
                    <SectionBox title="良かったところ" items={finalEvaluation.goodPoints} />
                  )}

                  {!!finalEvaluation.nextTips?.length && (
                    <SectionBox title="次に意識すること" items={finalEvaluation.nextTips} />
                  )}

                  {finalEvaluation.comment ? (
                    <div
                      style={{
                        marginTop: 12,
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 14,
                        fontSize: 14,
                        lineHeight: 1.8,
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {finalEvaluation.comment}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                      marginTop: 16,
                    }}
                  >
                    <button
                      onClick={resetConversation}
                      style={{
                        border: "none",
                        background: "#22c55e",
                        color: "#ffffff",
                        borderRadius: 12,
                        padding: "12px 16px",
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      もう一度練習する
                    </button>

                    <button
                      onClick={() => router.push("/")}
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
                      TOPへ戻る
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                ref={bottomRef}
                style={{
                  height: 140,
                }}
              />
            </div>
          </>
        )}
      </div>

      {started ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            background: "rgba(255,255,255,0.96)",
            borderTop: "1px solid #e5e7eb",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              maxWidth: 860,
              margin: "0 auto",
              padding: "12px 16px 16px",
            }}
          >
            {recognizedText ? (
              <div
                style={{
                  marginBottom: 10,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
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
                  文字起こし結果
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "#111827",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {recognizedText}
                </div>
              </div>
            ) : null}

            {error ? (
              <div
                style={{
                  marginBottom: 10,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              {!isRecording ? (
                <button
                  onClick={beginRecording}
                  disabled={!canRecord}
                  style={{
                    flex: 1,
                    border: "none",
                    background: canRecord ? "#22c55e" : "#9ca3af",
                    color: "#ffffff",
                    borderRadius: 16,
                    padding: "16px 18px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: canRecord ? "pointer" : "not-allowed",
                  }}
                >
                  {isTranscribing
                    ? "文字起こし中..."
                    : loadingReply
                    ? "AI返信待ち..."
                    : finished
                    ? "会話終了"
                    : "録音スタート"}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  style={{
                    flex: 1,
                    border: "none",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: 16,
                    padding: "16px 18px",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  録音を終了する
                </button>
              )}

              <button
                onClick={resetConversation}
                disabled={loadingReply || isRecording || isTranscribing}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                  color: "#111827",
                  borderRadius: 16,
                  padding: "16px 18px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor:
                    loadingReply || isRecording || isTranscribing
                      ? "not-allowed"
                      : "pointer",
                  opacity: loadingReply || isRecording || isTranscribing ? 0.6 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                やり直す
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ScoreMiniCard({
  title,
  value,
}: {
  title: string
  value?: number | string
}) {
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
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
        {title}
      </div>
      <div
        style={{
          fontSize: 20,
          color: "#111827",
          fontWeight: 800,
        }}
      >
        {value ?? "-"}点
      </div>
    </div>
  )
}

function SectionBox({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <div
      style={{
        marginTop: 12,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 14,
      }}
    >
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

      <div style={{ display: "grid", gap: 8 }}>
        {items.map((item, index) => (
          <div
            key={`${title}_${index}`}
            style={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.7,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}