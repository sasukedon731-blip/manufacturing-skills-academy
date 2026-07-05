import { quizCatalog } from "@/app/data/quizCatalog"

export type BadgeRarity = "common" | "rare" | "epic" | "legend"
export type BadgeGroup = "battle" | "study" | "listening" | "industry" | "streak" | "score" | "secret"
export type FocusArea = "japanese" | "manufacturing" | "ai"

export type BadgeDef = {
  id: string
  icon: string
  label: string
  description: string
  howToUnlock: string
  rarity: BadgeRarity
  group: BadgeGroup
  hidden?: boolean
  image?: string
  order: number
}

type UnlockState = {
  totalAnswers?: number
  listeningAnswers?: number
  gamePlays?: number
  attackPlays?: number
  tileDropClears?: number
  flashJudgeClears?: number
  memoryBurstClears?: number
  examClears?: number
  reviewPlays?: number
  maxScore?: number
  streak?: number
  industryCounts?: Partial<Record<FocusArea, number>>
}

export function getPerfectBadgeId(quizType: string) {
  return `perfect-${quizType}`
}

function quizTitle(quizType: string) {
  return quizCatalog.find((q) => q.id === quizType)?.title ?? quizType
}

function buildImagePath(group: BadgeGroup, id: string) {
  return `/badges/generated/${group}-${id}.svg`
}

function rarityByIndex(index: number, lastIndex: number): BadgeRarity {
  if (index >= lastIndex) return "legend"
  if (index >= Math.max(3, lastIndex - 1)) return "epic"
  if (index >= 2) return "rare"
  return "common"
}

function buildSeries(
  group: BadgeGroup,
  prefix: string,
  icon: string,
  labelBase: string,
  descriptionBase: string,
  unlockBase: string,
  values: number[],
  orderStart: number
): BadgeDef[] {
  return values.map((n, idx) => ({
    id: `${prefix}-${n}`,
    icon,
    image: buildImagePath(group, `${prefix}-${n}`),
    label: `${labelBase} ${n}`,
    description: `${descriptionBase} ${n}`,
    howToUnlock: unlockBase.replaceAll("{n}", String(n)),
    rarity: rarityByIndex(idx, values.length - 1),
    group,
    order: orderStart + idx,
  }))
}

const BASE_BADGES: BadgeDef[] = [
  {
    id: "battle-first-play",
    icon: "🎮",
    image: buildImagePath("battle", "battle-first-play"),
    label: "はじめてのバトル",
    description: "日本語バトルに初挑戦",
    howToUnlock: "いずれかのゲームを1回プレイ",
    rarity: "common",
    group: "battle",
    order: 1,
  },
  {
    id: "battle-attack-first",
    icon: "⚔️",
    image: buildImagePath("battle", "battle-attack-first"),
    label: "アタック挑戦者",
    description: "アタックモードに初挑戦",
    howToUnlock: "いずれかのゲームでアタックを1回プレイ",
    rarity: "common",
    group: "battle",
    order: 2,
  },
  {
    id: "tile-drop-first-clear",
    icon: "🔤",
    image: buildImagePath("battle", "tile-drop-first-clear"),
    label: "文字ブレイク入門",
    description: "文字タイルゲームを初クリア",
    howToUnlock: "文字タイルゲームを最後までプレイ",
    rarity: "common",
    group: "battle",
    order: 3,
  },
  {
    id: "flash-judge-first-clear",
    icon: "⚡",
    image: buildImagePath("battle", "flash-judge-first-clear"),
    label: "瞬間ジャッジ入門",
    description: "瞬間判定ゲームを初クリア",
    howToUnlock: "瞬間判定ゲームを最後までプレイ",
    rarity: "common",
    group: "battle",
    order: 4,
  },
  {
    id: "memory-burst-first-clear",
    icon: "🧠",
    image: buildImagePath("battle", "memory-burst-first-clear"),
    label: "記憶バースト入門",
    description: "記憶ゲームを初クリア",
    howToUnlock: "記憶ゲームを最後までプレイ",
    rarity: "common",
    group: "battle",
    order: 5,
  },
  {
    id: "study-first-answer",
    icon: "📘",
    image: buildImagePath("study", "study-first-answer"),
    label: "はじめての1問",
    description: "最初の問題に挑戦",
    howToUnlock: "通常学習または模擬試験で1問解く",
    rarity: "common",
    group: "study",
    order: 100,
  },
  {
    id: "exam-first-clear",
    icon: "✅",
    image: buildImagePath("study", "exam-first-clear"),
    label: "模擬試験デビュー",
    description: "模擬試験を初クリア",
    howToUnlock: "模擬試験を1回完了する",
    rarity: "common",
    group: "study",
    order: 101,
  },
  {
    id: "review-first-play",
    icon: "🔁",
    image: buildImagePath("study", "review-first-play"),
    label: "復習スタート",
    description: "復習モードに初挑戦",
    howToUnlock: "復習モードを1回プレイ",
    rarity: "common",
    group: "study",
    order: 102,
  },
  {
    id: "listening-first-play",
    icon: "🎧",
    image: buildImagePath("listening", "listening-first-play"),
    label: "聞き取り開始",
    description: "リスニング問題に初挑戦",
    howToUnlock: "リスニング問題を1問解く",
    rarity: "common",
    group: "listening",
    order: 200,
  },
  {
    id: "secret-night-owl",
    icon: "🌙",
    image: buildImagePath("secret", "secret-night-owl"),
    label: "夜の学習者",
    description: "深夜に学習した人だけのバッジ",
    howToUnlock: "深夜0:00-3:59に学習する",
    rarity: "rare",
    group: "secret",
    hidden: true,
    order: 900,
  },
  {
    id: "secret-early-bird",
    icon: "🌅",
    image: buildImagePath("secret", "secret-early-bird"),
    label: "朝の学習者",
    description: "朝学習の実績",
    howToUnlock: "朝5:00-7:59に学習する",
    rarity: "rare",
    group: "secret",
    hidden: true,
    order: 901,
  },
]

const battlePlayBadges = buildSeries("battle", "battle-play", "🎮", "バトル", "ゲームプレイ回数", "ゲームを合計{n}回プレイ", [3, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500], 1000)
const attackPlayBadges = buildSeries("battle", "attack-play", "⚔️", "アタック", "アタック挑戦回数", "アタックを合計{n}回プレイ", [1, 3, 5, 10, 20, 30, 50, 75, 100], 1100)
const tileDropBadges = buildSeries("battle", "tile-drop-clear", "🔤", "文字ブレイク", "文字タイルクリア回数", "文字タイルゲームを合計{n}回クリア", [1, 3, 5, 10, 20, 30, 50, 75, 100], 1200)
const flashJudgeBadges = buildSeries("battle", "flash-judge-clear", "⚡", "瞬間ジャッジ", "瞬間判定クリア回数", "瞬間判定ゲームを合計{n}回クリア", [1, 3, 5, 10, 20, 30, 50, 75, 100], 1300)
const memoryBurstBadges = buildSeries("battle", "memory-burst-clear", "🧠", "記憶バースト", "記憶ゲームクリア回数", "記憶ゲームを合計{n}回クリア", [1, 3, 5, 10, 20, 30, 50, 75, 100], 1400)
const studyQuestionBadges = buildSeries("study", "study-questions", "📘", "学習", "累計解答数", "累計{n}問解く", [1, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 3000, 5000], 2000)
const listeningQuestionBadges = buildSeries("listening", "listening-clear", "🎧", "リスニング", "聞き取り解答数", "リスニング問題を累計{n}問解く", [1, 5, 10, 20, 30, 50, 75, 100, 150, 300, 500, 1000], 2300)
const scoreBadges = buildSeries("score", "score", "🏆", "高得点", "最高得点", "いずれかの教材で{n}点以上を取る", [50, 60, 70, 80, 90, 95, 100], 2600)
const streakBadges = buildSeries("streak", "streak", "🔥", "連続学習", "連続学習日数", "{n}日連続で学習する", [2, 3, 5, 7, 10, 14, 21, 30, 60, 100, 180, 365], 2800)

function buildFocusBadges(key: FocusArea, icon: string, label: string, orderStart: number): BadgeDef[] {
  const values = [1, 5, 10, 20, 30, 50, 75, 100, 150, 300, 500]
  return values.map((n, idx) => ({
    id: `${key}-${n}`,
    icon,
    label: `${label} ${n}`,
    description: `${label}カテゴリの累計解答数 ${n}`,
    howToUnlock: `${label}カテゴリの問題を累計${n}問解く`,
    rarity: rarityByIndex(idx, values.length - 1),
    group: "industry",
    order: orderStart + idx,
  }))
}

const japaneseBadges = buildFocusBadges("japanese", "🇯🇵", "日本語", 3000)
const manufacturingBadges = buildFocusBadges("manufacturing", "⚙️", "製造", 3100)
const aiBadges = buildFocusBadges("ai", "🎙️", "AI練習", 3200)

const STATIC_CATALOG: BadgeDef[] = [
  ...BASE_BADGES,
  ...battlePlayBadges,
  ...attackPlayBadges,
  ...tileDropBadges,
  ...flashJudgeBadges,
  ...memoryBurstBadges,
  ...studyQuestionBadges,
  ...listeningQuestionBadges,
  ...scoreBadges,
  ...streakBadges,
  ...japaneseBadges,
  ...manufacturingBadges,
  ...aiBadges,
].sort((a, b) => a.order - b.order)

function buildPerfectBadgeMeta(badgeId: string): BadgeDef {
  const quizType = badgeId.replace(/^perfect-/, "")
  const title = quizTitle(quizType)
  return {
    id: badgeId,
    icon: "💯",
    image: buildImagePath("score", badgeId),
    label: `${title} 100点`,
    description: `${title} の模擬試験で100点を獲得`,
    howToUnlock: `${title} の模擬試験で100点を取る`,
    rarity: "legend",
    group: "score",
    order: 20000,
  }
}

export function getBadgeMeta(badgeId: string): BadgeDef {
  if (badgeId.startsWith("perfect-")) return buildPerfectBadgeMeta(badgeId)

  return (
    STATIC_CATALOG.find((b) => b.id === badgeId) ?? {
      id: badgeId,
      icon: "🏅",
      image: buildImagePath("study", badgeId),
      label: badgeId,
      description: "実績バッジ",
      howToUnlock: "条件未設定",
      rarity: "common",
      group: "study",
      order: 99999,
    }
  )
}

export function getBadgeLabelFromBadgeId(badgeId: string) {
  return getBadgeMeta(badgeId).label
}

export function getBadgeCatalog(): BadgeDef[] {
  const perfectBadges = quizCatalog
    .filter((q) => q.enabled)
    .map((q, i) => ({
      ...buildPerfectBadgeMeta(getPerfectBadgeId(q.id)),
      order: 20000 + i,
    }))

  return [...STATIC_CATALOG, ...perfectBadges].sort((a, b) => a.order - b.order)
}

export function getAllBadgeMeta(unlockedBadgeIds: string[]) {
  const unlocked = new Set(unlockedBadgeIds)
  return getBadgeCatalog().map((badge) => ({
    ...badge,
    unlocked: unlocked.has(badge.id),
  }))
}

export function getUnlockedBadgeCount(unlockedBadgeIds: string[]) {
  const known = new Set(getBadgeCatalog().map((b) => b.id))
  return unlockedBadgeIds.filter((id) => known.has(id) || id.startsWith("perfect-")).length
}

export function getTotalBadgeCount() {
  return getBadgeCatalog().length
}

export function getPreviewBadgeMeta(unlockedBadgeIds: string[], limit = 8) {
  const unlockedSet = new Set(unlockedBadgeIds)
  return getBadgeCatalog()
    .filter((b) => unlockedSet.has(b.id))
    .slice(0, limit)
}

export function getRarityColors(rarity: BadgeRarity) {
  switch (rarity) {
    case "common":
      return { border: "#d1d5db", bg: "linear-gradient(135deg, #f9fafb 0%, #eef2f7 100%)", glow: "rgba(107,114,128,0.18)" }
    case "rare":
      return { border: "#93c5fd", bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", glow: "rgba(59,130,246,0.20)" }
    case "epic":
      return { border: "#c4b5fd", bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", glow: "rgba(124,58,237,0.22)" }
    case "legend":
      return { border: "#fcd34d", bg: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)", glow: "rgba(245,158,11,0.22)" }
  }
}

export function getBadgeGroupLabel(group: BadgeGroup) {
  switch (group) {
    case "battle":
      return "ゲーム"
    case "study":
      return "学習"
    case "listening":
      return "リスニング"
    case "industry":
      return "カテゴリ"
    case "streak":
      return "連続学習"
    case "score":
      return "得点"
    case "secret":
      return "シークレット"
    default:
      return "その他"
  }
}

export function computeUnlockedBadges(currentBadgeIds: string[], state: UnlockState) {
  const owned = new Set(currentBadgeIds)
  const newlyUnlocked: string[] = []

  const tryAdd = (id: string, ok: boolean) => {
    if (ok && !owned.has(id)) {
      owned.add(id)
      newlyUnlocked.push(id)
    }
  }

  tryAdd("battle-first-play", (state.gamePlays ?? 0) >= 1)
  tryAdd("battle-attack-first", (state.attackPlays ?? 0) >= 1)
  tryAdd("tile-drop-first-clear", (state.tileDropClears ?? 0) >= 1)
  tryAdd("flash-judge-first-clear", (state.flashJudgeClears ?? 0) >= 1)
  tryAdd("memory-burst-first-clear", (state.memoryBurstClears ?? 0) >= 1)
  tryAdd("study-first-answer", (state.totalAnswers ?? 0) >= 1)
  tryAdd("exam-first-clear", (state.examClears ?? 0) >= 1)
  tryAdd("review-first-play", (state.reviewPlays ?? 0) >= 1)
  tryAdd("listening-first-play", (state.listeningAnswers ?? 0) >= 1)

  ;[3, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500].forEach((n) => tryAdd(`battle-play-${n}`, (state.gamePlays ?? 0) >= n))
  ;[1, 3, 5, 10, 20, 30, 50, 75, 100].forEach((n) => tryAdd(`attack-play-${n}`, (state.attackPlays ?? 0) >= n))
  ;[1, 3, 5, 10, 20, 30, 50, 75, 100].forEach((n) => {
    tryAdd(`tile-drop-clear-${n}`, (state.tileDropClears ?? 0) >= n)
    tryAdd(`flash-judge-clear-${n}`, (state.flashJudgeClears ?? 0) >= n)
    tryAdd(`memory-burst-clear-${n}`, (state.memoryBurstClears ?? 0) >= n)
  })
  ;[1, 5, 10, 20, 30, 50, 75, 100, 150, 200, 300, 500, 750, 1000, 1500, 3000, 5000].forEach((n) => tryAdd(`study-questions-${n}`, (state.totalAnswers ?? 0) >= n))
  ;[1, 5, 10, 20, 30, 50, 75, 100, 150, 300, 500, 1000].forEach((n) => tryAdd(`listening-clear-${n}`, (state.listeningAnswers ?? 0) >= n))
  ;[50, 60, 70, 80, 90, 95, 100].forEach((n) => tryAdd(`score-${n}`, (state.maxScore ?? 0) >= n))
  ;[2, 3, 5, 7, 10, 14, 21, 30, 60, 100, 180, 365].forEach((n) => tryAdd(`streak-${n}`, (state.streak ?? 0) >= n))
  ;(["japanese", "manufacturing", "ai"] as const).forEach((key) => {
    ;[1, 5, 10, 20, 30, 50, 75, 100, 150, 300, 500].forEach((n) => {
      tryAdd(`${key}-${n}`, (state.industryCounts?.[key] ?? 0) >= n)
    })
  })

  return newlyUnlocked
}
