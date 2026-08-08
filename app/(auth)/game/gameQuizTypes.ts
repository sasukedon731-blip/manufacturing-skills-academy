export const GAME_QUIZ_TYPES = ["japanese-n4", "japanese-n3", "japanese-n2"] as const

export type GameQuizType = (typeof GAME_QUIZ_TYPES)[number]

const GAME_QUIZ_TYPE_SET = new Set<string>(GAME_QUIZ_TYPES)

export function isGameQuizType(value: unknown): value is GameQuizType {
  return typeof value === "string" && GAME_QUIZ_TYPE_SET.has(value)
}
