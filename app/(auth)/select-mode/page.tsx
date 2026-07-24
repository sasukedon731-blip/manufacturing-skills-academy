"use client"

import Link from "next/link"
import { useMemo, type CSSProperties } from "react"
import { useSearchParams } from "next/navigation"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"
import { quizCatalog } from "@/app/data/quizCatalog"
import { quizzes } from "@/app/data/quizzes"
import type { QuizType } from "@/app/data/types"

type SubItem =
  | { kind: "quiz"; id: QuizType; note?: string }
  | { kind: "link"; title: string; description: string; href: string; note?: string }

type Category = {
  id: string
  title: string
  description: string
  color: string
  items: SubItem[]
}

const categories: Category[] = [
  {
    id: "japanese",
    title: "日本語",
    description: "JLPT、現場で使う日本語、会話表現を練習します。",
    color: "#2563eb",
    items: [
      { kind: "quiz", id: "japanese-n4", note: "基礎" },
      { kind: "quiz", id: "japanese-n3", note: "中級" },
      { kind: "quiz", id: "japanese-n2", note: "中上級" },
      { kind: "quiz", id: "genba-listening" },
      { kind: "quiz", id: "genba-phrasebook" },
      { kind: "quiz", id: "kansai-listening" },
    ],
  },
  {
    id: "manufacturing",
    title: "製造系",
    description: "製造現場の用語、リスニング、会話、技能検定をまとめています。",
    color: "#0f766e",
    items: [
      { kind: "quiz", id: "manufacturing-meaning" },
      { kind: "quiz", id: "manufacturing-word" },
      { kind: "quiz", id: "manufacturing-listening" },
      { kind: "quiz", id: "manufacturing-conversation" },
      { kind: "quiz", id: "manufacturing-conversation-50", note: "重点" },
      { kind: "quiz", id: "skill-test-machining" },
    ],
  },
  {
    id: "game",
    title: "ゲーム",
    description: "日本語バトルで反復練習します。",
    color: "#7c3aed",
    items: [
      { kind: "link", title: "ゲーム一覧", description: "タイル、瞬間判定、記憶ゲームを選びます。", href: "/game" },
      { kind: "link", title: "すぐにプレイ", description: "通常モードの日本語バトルを開きます。", href: "/game?mode=normal" },
    ],
  },
  {
    id: "ai",
    title: "AI",
    description: "AI生成、文字起こし、読み上げ、会話評価を使う練習です。",
    color: "#be185d",
    items: [
      { kind: "quiz", id: "speaking-practice" },
      { kind: "link", title: "AIスピーキング", description: "AIが作った文を話して、発話を評価します。", href: "/speaking" },
      { kind: "link", title: "AI会話", description: "会話開始、録音、文字起こし、返答生成を使って練習します。", href: "/conversation" },
    ],
  },
]

function getQuizMeta(id: QuizType) {
  const def = quizCatalog.find((q) => q.id === id)
  return {
    title: def?.title ?? quizzes[id]?.title ?? id,
    description: def?.description ?? quizzes[id]?.description ?? "",
  }
}

function isQuizType(value: string | null): value is QuizType {
  return !!value && Object.prototype.hasOwnProperty.call(quizzes, value)
}

export default function SelectModePage() {
  const params = useSearchParams()
  const rawType = params.get("type")

  const selectedQuiz = useMemo(() => {
    if (!isQuizType(rawType)) return null
    return { id: rawType, ...getQuizMeta(rawType) }
  }, [rawType])

  if (selectedQuiz) {
    return (
      <main style={styles.page}>
        <AppHeader title="学習モード選択" />
        <section style={styles.shell}>
          <Link href="/select-mode" style={styles.backLink}>学習メニューへ戻る</Link>
          <div style={styles.hero}>
            <p style={styles.kicker}>SELECT MODE</p>
            <h1 style={styles.title}>{selectedQuiz.title}</h1>
            <p style={styles.lead}>{selectedQuiz.description || "学習モードを選んで開始します。"}</p>
          </div>
          <div style={styles.modeGrid}>
            <ModeCard title="通常学習" description="1問ずつ確認しながら基礎を固めます。" href={`/normal?type=${selectedQuiz.id}`} />
            <ModeCard title="模擬試験" description="本番に近い形式でまとめて解きます。" href={`/exam?type=${selectedQuiz.id}`} />
            <ModeCard title="復習" description="間違えた問題や苦手をやり直します。" href={`/review?type=${selectedQuiz.id}`} />
          </div>
          <LegalFooter />
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <AppHeader title="学習メニュー" />
      <section style={styles.shell}>
        <div style={styles.hero}>
          <p style={styles.kicker}>LEARNING MENU</p>
          <h1 style={styles.title}>学びたい内容を選ぶ</h1>
          <p style={styles.lead}>製造現場の日本語、基礎日本語、ゲーム、AI練習を目的別にまとめています。今やりたい練習から始められます。</p>
        </div>

        <div style={styles.categoryGrid}>
          {categories.map((category) => (
            <section key={category.id} style={styles.categoryCard}>
              <div style={{ ...styles.categoryBar, background: category.color }} />
              <h2 style={styles.categoryTitle}>{category.title}</h2>
              <p style={styles.categoryDescription}>{category.description}</p>
              <div style={styles.itemList}>
                {category.items.map((item) => {
                  if (item.kind === "link") {
                    return (
                      <Link key={item.href} href={item.href} style={styles.item}>
                        <span style={styles.itemTitle}>{item.title}</span>
                        <span style={styles.itemDescription}>{item.description}</span>
                      </Link>
                    )
                  }
                  const meta = getQuizMeta(item.id)
                  return (
                    <Link key={item.id} href={`/select-mode?type=${item.id}&industry=manufacturing`} style={styles.item}>
                      <span style={styles.itemTopLine}>
                        <span style={styles.itemTitle}>{meta.title}</span>
                        {item.note ? <span style={styles.itemNote}>{item.note}</span> : null}
                      </span>
                      <span style={styles.itemDescription}>{meta.description}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
        <LegalFooter />
      </section>
    </main>
  )
}

function ModeCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} style={styles.modeCard}>
      <strong style={styles.modeTitle}>{title}</strong>
      <span style={styles.itemDescription}>{description}</span>
    </Link>
  )
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", color: "#0f172a" },
  shell: { maxWidth: 1120, margin: "0 auto", padding: 20 },
  backLink: { color: "#2563eb", fontWeight: 900, textDecoration: "none" },
  hero: { padding: "24px 0 18px" },
  kicker: { margin: "0 0 8px", color: "#64748b", fontSize: 12, fontWeight: 900, letterSpacing: ".14em" },
  title: { margin: 0, fontSize: 36, lineHeight: 1.18, letterSpacing: 0 },
  lead: { margin: "12px 0 0", maxWidth: 720, color: "#475569", lineHeight: 1.8 },
  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 },
  categoryCard: { position: "relative", overflow: "hidden", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", padding: 18 },
  categoryBar: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  categoryTitle: { margin: "8px 0 6px", fontSize: 22, letterSpacing: 0 },
  categoryDescription: { margin: 0, minHeight: 50, color: "#64748b", lineHeight: 1.6, fontSize: 14 },
  itemList: { marginTop: 14, display: "grid", gap: 8 },
  item: { display: "grid", gap: 5, padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#0f172a", textDecoration: "none" },
  itemTopLine: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitle: { fontWeight: 900, lineHeight: 1.35 },
  itemDescription: { color: "#64748b", fontSize: 13, lineHeight: 1.5 },
  itemNote: { flex: "0 0 auto", borderRadius: 999, padding: "3px 7px", background: "#e0f2fe", color: "#0369a1", fontSize: 11, fontWeight: 900 },
  modeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  modeCard: { minHeight: 120, display: "grid", alignContent: "center", gap: 8, padding: 18, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", textDecoration: "none" },
  modeTitle: { fontSize: 20 },
}
