import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { quizzes } from '../app/data/quizzes/index.ts'
import { quizCatalog } from '../app/data/quizCatalog.ts'
import { buildGameQuestionsFromQuizzes } from '../app/(auth)/game/fromQuizzes.ts'
import { GAME_QUIZ_TYPES } from '../app/(auth)/game/gameQuizTypes.ts'
import {
  MANUFACTURING_MIGRATION_TARGETS,
  MANUFACTURING_MIGRATION_TARGET_COUNT,
  buildManufacturingQuizContentSignature,
  migrateManufacturingQuestionStorage,
  migrateManufacturingStoredValue,
} from '../app/lib/manufacturingQuestionMigration.ts'

const byId = (quizType, id) => quizzes[quizType].questions.find((q) => q.id === id)
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const protectedCatalogHash = '5f5744f2d4c5ded4f6f6a6e5b2dcc4a21f5e13c24be79df50a216da02c70e94d'

test('Phase 59 canonical manufacturing fixes and derived rows', () => {
  assert.equal(Object.values(quizzes).reduce((sum, quiz) => sum + quiz.questions.length, 0), 1513)
  assert.equal(byId('manufacturing-meaning', 84).choices[0], '作業中に体を守る道具をまとめた呼び方です')
  assert.match(byId('manufacturing-meaning', 107).choices[0], /管理・制限/)
  assert.match(byId('manufacturing-meaning', 136).question, /墜落制止用器具/)
  assert.deepEqual(byId('manufacturing-word', 76).choices, ['作業教育', '新人教育', '安全教育', '実技試験'])
  assert.deepEqual(byId('manufacturing-word', 79).choices, ['作業服', '保護具', '安全靴', '制服'])
  assert.equal(byId('manufacturing-word', 136).choices[0], '墜落制止用器具')
  assert.deepEqual(byId('manufacturing-word', 262).choices, ['警告灯', 'センサー', 'スイッチランプ', '作業灯'])
  assert.deepEqual(byId('manufacturing-word', 282).choices, ['非常停止', '停止ボタン', '運転開始ボタン', '切替スイッチ'])
  assert.match(byId('skill-test-machining', 10).question, /通電中/)
  assert.match(byId('skill-test-machining', 12).question, /事業場の手順/)
  assert.match(byId('skill-test-machining', 15).question, /耳栓またはイヤーマフ/)
  assert.match(byId('skill-test-machining', 29).question, /高温または鋭利/)
  for (const id of [84, 107, 136]) {
    const derived = byId('manufacturing-conversation-50', id)
    assert.match(derived.question, /○○/)
    assert.ok(derived.explanation.includes(derived.choices[derived.correctIndex]))
  }
  assert.equal(byId('manufacturing-conversation-50', 136).choices[0], '墜落制止用器具')
  for (const question of Object.values(quizzes).flatMap((quiz) => quiz.questions)) {
    assert.ok(question.question.trim())
    assert.ok(question.explanation.trim())
    assert.ok(Number.isInteger(question.correctIndex) && question.correctIndex >= 0 && question.correctIndex < question.choices.length)
    assert.equal(new Set(question.choices).size, question.choices.length)
  }
})

test('Phase 59 literal newlines are real LF in all 100 conversation explanations', () => {
  const questions = quizzes['manufacturing-conversation'].questions
  assert.equal(questions.length, 100)
  assert.equal(questions.filter((q) => q.explanation.includes('\\n')).length, 0)
  assert.equal(questions.filter((q) => q.explanation.includes('\n')).length, 100)
})

test('Phase 59 migration updates 121 exact legacy questions and preserves metadata', () => {
  assert.equal(MANUFACTURING_MIGRATION_TARGET_COUNT, 121)
  assert.equal(new Set(MANUFACTURING_MIGRATION_TARGETS.map((q) => `${q.quizType}:${q.id}`)).size, 121)
  assert.equal(new Set(MANUFACTURING_MIGRATION_TARGETS.map((q) => q.fingerprint)).size, 121)
  const legacy = { id:84, sectionId:'all', question:'「保護具」に一番近い意味はどれですか？', choices:['作業中に体を守る道具のまとめた呼び方です','機械を守るカバー','製品を守る箱','道具をしまう箱'], correctIndex:0, explanation:'「保護具」とは、作業中に体を守る道具のまとめた呼び方です', selectedIndexes:[1], isCorrect:false, score:7, progress:3, timestamp:'2026-08-04T00:00:00Z' }
  const migrated = migrateManufacturingStoredValue([legacy], 'manufacturing-meaning')[0]
  const canonical = byId('manufacturing-meaning', 84)
  assert.equal(migrated.question, canonical.question)
  assert.deepEqual(migrated.choices, canonical.choices)
  assert.equal(migrated.explanation, canonical.explanation)
  assert.deepEqual(migrated.selectedIndexes, [1])
  assert.equal(migrated.isCorrect, false)
  assert.equal(migrated.score, 7)
  assert.equal(migrated.progress, 3)
  assert.equal(migrated.timestamp, '2026-08-04T00:00:00Z')
  const approximate = { ...legacy, question: `${legacy.question} ` }
  assert.deepEqual(migrateManufacturingStoredValue([approximate], 'manufacturing-meaning'), [approximate])
  assert.deepEqual(migrateManufacturingStoredValue([legacy], 'japanese-n4'), [legacy])
})

test('Phase 59 storage migration is SSR and exception safe and runs once', () => {
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage())
  const legacy = { id:84, sectionId:'all', question:'「保護具」に一番近い意味はどれですか？', choices:['作業中に体を守る道具のまとめた呼び方です','機械を守るカバー','製品を守る箱','道具をしまう箱'], correctIndex:0, explanation:'「保護具」とは、作業中に体を守る道具のまとめた呼び方です', answeredAt:1 }
  const data = new Map([['wrong-manufacturing-meaning', JSON.stringify([legacy])]])
  let writes = 0
  const storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { writes++; data.set(key, value) },
  }
  migrateManufacturingQuestionStorage(storage)
  const once = writes
  migrateManufacturingQuestionStorage(storage)
  assert.equal(writes, once)
  assert.equal(JSON.parse(data.get('wrong-manufacturing-meaning'))[0].answeredAt, 1)
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage({ getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }))
  const broken = new Map([['wrong-manufacturing-meaning', '{']])
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage({ getItem: (k) => broken.get(k) ?? null, setItem: (k, v) => broken.set(k, v) }))
})

test('Phase 59 manufacturing content signatures detect every scored field', () => {
  const quizType = 'manufacturing-meaning'
  const base = quizzes[quizType].questions
  const signature = buildManufacturingQuizContentSignature(quizType, base)
  const mutate = (patch) => base.map((q, i) => i === Math.floor(base.length / 2) ? { ...q, ...patch(q) } : q)
  assert.notEqual(buildManufacturingQuizContentSignature(quizType, mutate((q) => ({ question: `${q.question}!` }))), signature)
  assert.notEqual(buildManufacturingQuizContentSignature(quizType, mutate((q) => ({ choices: [...q.choices].reverse() }))), signature)
  assert.notEqual(buildManufacturingQuizContentSignature(quizType, mutate((q) => ({ correctIndex: (q.correctIndex + 1) % q.choices.length }))), signature)
  assert.notEqual(buildManufacturingQuizContentSignature(quizType, mutate((q) => ({ sectionId: `${q.sectionId}-changed` }))), signature)
  assert.equal(buildManufacturingQuizContentSignature('japanese-n4', quizzes['japanese-n4'].questions), undefined)
})

test('Phase 59 keeps the catalog intact and validates only the formal game scope', () => {
  assert.equal(sha256('app/data/quizCatalog.ts'), protectedCatalogHash)
  assert.equal(quizCatalog.length, 13)
  assert.ok(quizCatalog.every((q) => q.title && q.description))
  assert.deepEqual(GAME_QUIZ_TYPES, ['japanese-n4', 'japanese-n3', 'japanese-n2'])
  const counts = Object.fromEntries(GAME_QUIZ_TYPES.map((quizType) => [quizType, buildGameQuestionsFromQuizzes(quizType).length]))
  assert.deepEqual(counts, { 'japanese-n4': 33, 'japanese-n3': 89, 'japanese-n2': 85 })
  const all = GAME_QUIZ_TYPES.flatMap((quizType) => buildGameQuestionsFromQuizzes(quizType))
  assert.equal(all.length, 207)
  assert.equal(new Set(all.map((q) => q.id)).size, all.length)
  assert.ok(all.every((q) => q.id.startsWith('qz-') && q.prompt && !/[縺繧譁譛謚閭髯陦鬘蛹蝠驥�]/.test(q.prompt)))
  assert.ok(all.every((q) => ['speed-choice', 'tile-drop'].includes(q.kind)))
  assert.ok(all.every((q) => q.answer.length > 0 && q.answer.every((answer) => q.choices.includes(answer))))
  assert.ok(all.every((q) => new Set(q.choices).size === q.choices.length))
  assert.throws(() => buildGameQuestionsFromQuizzes('manufacturing-word'), /Unsupported game quiz type/)
  assert.match(byId('manufacturing-word', 107).question, /管理・制限/)
})
