import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildGameQuestionsFromQuizzes } from '../app/(auth)/game/fromQuizzes.ts'
import { GAME_QUIZ_TYPES, isGameQuizType } from '../app/(auth)/game/gameQuizTypes.ts'

const excludedRegisteredQuizTypes = [
  'speaking-practice',
  'genba-listening',
  'genba-phrasebook',
  'kansai-listening',
  'manufacturing-meaning',
  'manufacturing-word',
  'manufacturing-listening',
  'manufacturing-conversation',
  'manufacturing-conversation-50',
  'skill-test-machining',
]

test('Phase 59C allowlist accepts exactly N4, N3 and N2', () => {
  assert.deepEqual(GAME_QUIZ_TYPES, ['japanese-n4', 'japanese-n3', 'japanese-n2'])
  for (const quizType of GAME_QUIZ_TYPES) assert.equal(isGameQuizType(quizType), true)
  const invalidValues = [
    ...excludedRegisteredQuizTypes,
    'japanese-n5',
    'japanese-n4-extra',
    'JAPANESE-N4',
    '',
    ' ',
    null,
    undefined,
    [],
    {},
    4,
    true,
    false,
    'manufacturing%2Dword',
    'manufacturing%252Dword',
    '../japanese-n4',
    'japanese-n4?mode=normal',
  ]
  for (const value of invalidValues) assert.equal(isGameQuizType(value), false, String(value))
})

test('Phase 59C converter rejects every out-of-scope quiz when called directly', () => {
  for (const quizType of excludedRegisteredQuizTypes) {
    assert.throws(() => buildGameQuestionsFromQuizzes(quizType), /Unsupported game quiz type/, quizType)
  }
  for (const value of [null, undefined, '', 'japanese-n4-extra', 'JAPANESE-N4', [], {}, 4, true]) {
    assert.throws(() => buildGameQuestionsFromQuizzes(value), /Unsupported game quiz type/, String(value))
  }
})

test('Phase 59C formal game questions remain 207 and internally valid', () => {
  const counts = Object.fromEntries(GAME_QUIZ_TYPES.map((quizType) => [quizType, buildGameQuestionsFromQuizzes(quizType).length]))
  assert.deepEqual(counts, { 'japanese-n4': 33, 'japanese-n3': 89, 'japanese-n2': 85 })
  const questions = GAME_QUIZ_TYPES.flatMap((quizType) => buildGameQuestionsFromQuizzes(quizType))
  assert.equal(questions.length, 207)
  assert.equal(new Set(questions.map((question) => question.id)).size, 207)
  assert.ok(questions.every((question) => question.prompt.trim()))
  assert.ok(questions.every((question) => question.answer.length && question.answer.every((answer) => question.choices.includes(answer))))
  assert.ok(questions.every((question) => new Set(question.choices).size === question.choices.length))
})

test('Phase 59C route guards share the allowlist and stop invalid types before writes', () => {
  const kindClient = readFileSync('app/(auth)/game/ui/GameKindClient.tsx', 'utf8')
  const gameClient = readFileSync('app/(auth)/game/GameClient.tsx', 'utf8')

  assert.match(kindClient, /isGameQuizType\(rawType\)/)
  assert.match(kindClient, /if \(invalidQuizType\) return/)
  assert.match(kindClient, /GAME_QUIZ_TYPES\.map/)

  const invalidRender = gameClient.indexOf('if (!quizType) {')
  const guestWrite = gameClient.indexOf('markGuestPlayedToday()')
  const firestoreWrite = gameClient.indexOf('await setDoc(')
  assert.ok(invalidRender >= 0)
  assert.ok(gameClient.includes('if (!quizType) return'))
  assert.ok(guestWrite >= 0 && firestoreWrite >= 0)
  assert.match(gameClient, /return isGameQuizType\(rawType\) \? rawType : null/)
  assert.doesNotMatch(gameClient, /v in quizzes/)
})
