import type { QuizType } from "@/app/data/types"

export type GuardResult =
  | { ok: true }
  | { ok: false; redirect: string }

export function guardQuizAccess(params: {
  type: string | null
  selected: QuizType[]
}): GuardResult {
  const { type, selected } = params

  if (!type) return { ok: false, redirect: "/select-mode" }

  // 製造版では教材選択画面を使わない。未設定/不一致は教材一覧へ戻す。
  if (!selected || selected.length === 0) return { ok: false, redirect: "/select-mode" }
  if (!selected.includes(type as QuizType)) return { ok: false, redirect: "/select-mode" }

  return { ok: true }
}
