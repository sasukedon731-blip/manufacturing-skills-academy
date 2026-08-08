import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { quizzes } from '../app/data/quizzes/index.ts'
import { attachAudioUrls } from '../app/lib/audio.ts'
import { buildGameQuestionsFromQuizzes } from '../app/(auth)/game/fromQuizzes.ts'
import { GAME_QUIZ_TYPES, isGameQuizType } from '../app/(auth)/game/gameQuizTypes.ts'
import { MANUFACTURING_STATIC_AUDIO_TARGETS, migrateManufacturingQuestionStorage, migrateManufacturingStaticAudioStoredValue } from '../app/lib/manufacturingQuestionMigration.ts'

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const expectedHashes = new Map([
  ['/audio/manufacturing/speaking/speaking-practice-1.mp3','b35311800009b02b7dfe196d8d99620c65168ab910a24cbf0f4b66e0f9d2af95'],
  ['/audio/manufacturing/genba/genba-listening-1.mp3','ac4cf86f1a40a1ec8bfe22a24b94e4c2bbc1bafa98678a14bd5fbec06465ceb0'],
  ['/audio/manufacturing/genba/genba-listening-2.mp3','50720f97d0626f785d815f020414eda2fbb4cd246a02ce023952459bc7c47042'],
  ['/audio/manufacturing/genba/genba-listening-3.mp3','90d6b2feda8c96b9d1aaa360e778b3f1f553913e47464aca65ac3dd093048aa7'],
  ['/audio/manufacturing/genba/genba-listening-4.mp3','53ff181a1713bfd87be22b999ff586e3e79a10823d10cd0f611efa978fa2b675'],
  ['/audio/manufacturing/genba/genba-phrasebook-1.mp3','2fe9aa22d7c6358f10a18c454de9e1ddbc8408e36549ccc998da49d49ad806af'],
  ['/audio/manufacturing/genba/genba-phrasebook-5.mp3','a5a1e19b10a85e8b604d55522ef17f1a87816305d53cbc59f8ae4c4700d17a98'],
])
const targetKeys = new Set(MANUFACTURING_STATIC_AUDIO_TARGETS.map((item) => `${item.quizType}:${item.id}`))
const runtimeRows = Object.entries(quizzes).flatMap(([quizType, quiz]) => {
  const attached = attachAudioUrls(quiz)
  return attached.questions.map((question, arrayIndex) => ({ quizType, arrayIndex, question })).filter(({ question }) => question.listeningText?.trim())
})

function mp3Header(file) {
  const bytes = readFileSync(file)
  let offset = 0
  if (bytes.subarray(0, 3).toString() === 'ID3') offset = 10 + ((bytes[6]&127)<<21) + ((bytes[7]&127)<<14) + ((bytes[8]&127)<<7) + (bytes[9]&127)
  while (offset + 4 < bytes.length && !(bytes[offset] === 0xff && (bytes[offset + 1] & 0xe0) === 0xe0)) offset++
  return { bytes, offset, valid: offset + 4 < bytes.length }
}

test('Phase 68 maps exactly seven former TTS questions and leaves all 254 listening questions static', () => {
  assert.equal(MANUFACTURING_STATIC_AUDIO_TARGETS.length, 7)
  assert.equal(runtimeRows.length, 254)
  assert.equal(runtimeRows.filter(({ question }) => question.audioUrl).length, 254)
  assert.equal(runtimeRows.filter(({ question }) => !question.audioUrl).length, 0)
  for (const target of MANUFACTURING_STATIC_AUDIO_TARGETS) {
    const row = runtimeRows.find(({ quizType, question }) => quizType === target.quizType && Number(question.id) === target.id)
    assert.ok(row, `${target.quizType}:${target.id}`)
    assert.equal(row.question.audioUrl, target.audioUrl)
  }
})

test('Phase 68 MP3 files are present, non-empty, readable, structurally MP3 and match approved hashes', () => {
  assert.equal(expectedHashes.size, 7)
  for (const [audioUrl, expectedHash] of expectedHashes) {
    const file = join(process.cwd(), 'public', ...audioUrl.split('/').filter(Boolean))
    assert.equal(existsSync(file), true, file)
    assert.ok(statSync(file).size > 0, file)
    const parsed = mp3Header(file)
    assert.equal(parsed.valid, true, file)
    assert.equal(sha256(parsed.bytes), expectedHash, file)
  }
  assert.equal(new Set(expectedHashes.values()).size, 7)
})

test('Phase 68 preserves all question content and every pre-existing static mapping', () => {
  const content = Object.entries(quizzes).flatMap(([quizType, quiz]) => quiz.questions.map((q, arrayIndex) => ({q,arrayIndex})).filter(({q}) => q.listeningText?.trim()).map(({q,arrayIndex}) => [quizType,q.id,arrayIndex,q.question,q.choices,q.correctIndex,q.choices[q.correctIndex],q.explanation,q.listeningText,q.sectionId]))
  assert.equal(sha256(JSON.stringify(content)), '8bdcb60b2f061264f08327cf7e9cf8f8c61772aed825e03f7510e5e15eb36104')
  const oldStaticMap = runtimeRows.filter(({ quizType, question }) => !targetKeys.has(`${quizType}:${question.id}`)).map(({ quizType, question }) => [quizType,question.id,question.audioUrl])
  assert.equal(sha256(JSON.stringify(oldStaticMap)), 'a26feffa42a8ef1e5a224583ee524f6e6f14e8f33172007e05360a5d95f92338')
})

test('Phase 68 localStorage v3 updates only exact legacy questions and preserves metadata and scoring', () => {
  const data = {}
  for (const quizType of ['speaking-practice','genba-listening','genba-phrasebook']) {
    const legacyQuestions = MANUFACTURING_STATIC_AUDIO_TARGETS.filter(target => target.quizType === quizType).map(target => {
      const current = quizzes[target.quizType].questions.find(q => Number(q.id) === target.id)
      return {...current, answeredAt: 17, isCorrect: false, score: 3, progress: 2}
    })
    data[`wrong-${quizType}`] = JSON.stringify(legacyQuestions)
    data[`normal-session-${quizType}`] = JSON.stringify({questions:legacyQuestions,index:4})
    data[`exam-session-${quizType}`] = JSON.stringify({questions:legacyQuestions,answers:[{questionId:legacyQuestions[0].id,selectedIndexes:[0]}],score:3})
  }
  const storage = { getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = value } }
  migrateManufacturingQuestionStorage(storage)
  for (const target of MANUFACTURING_STATIC_AUDIO_TARGETS) {
    const wrong = JSON.parse(data[`wrong-${target.quizType}`]).find(q => Number(q.id) === target.id)
    assert.equal(wrong.audioUrl, target.audioUrl)
    assert.equal(wrong.answeredAt, 17); assert.equal(wrong.isCorrect, false); assert.equal(wrong.score, 3); assert.equal(wrong.progress, 2)
    const normal = JSON.parse(data[`normal-session-${target.quizType}`]); assert.equal(normal.questions.find(q => Number(q.id) === target.id).audioUrl, target.audioUrl); assert.equal(normal.index, 4)
    const exam = JSON.parse(data[`exam-session-${target.quizType}`]); assert.equal(exam.questions.find(q => Number(q.id) === target.id).audioUrl, target.audioUrl); assert.equal(exam.score, 3); assert.deepEqual(exam.answers[0].selectedIndexes, [0])
  }
  assert.equal(data['manufacturing-static-audio-migration-v3'], '1')
  const once = JSON.stringify(data); migrateManufacturingQuestionStorage(storage); assert.equal(JSON.stringify(data), once)
})

test('Phase 68 migration rejects ID-only and unrelated values and is safe for SSR and storage failures', () => {
  const canonical = quizzes['genba-listening'].questions[0]
  const wrongContent = {...canonical, question:'different legacy content'}
  assert.deepEqual(migrateManufacturingStaticAudioStoredValue([wrongContent], 'genba-listening'), [wrongContent])
  assert.deepEqual(migrateManufacturingStaticAudioStoredValue([{id:1}], 'genba-listening'), [{id:1}])
  assert.deepEqual(migrateManufacturingStaticAudioStoredValue([canonical], 'japanese-n4'), [canonical])
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage())
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage({getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}}))
  assert.doesNotThrow(() => migrateManufacturingQuestionStorage({getItem(){return '{broken'},setItem(){throw new Error('blocked')}}))
})

test('Phase 68 retains the formal game allowlist and 207 dynamically generated game questions', () => {
  assert.deepEqual(GAME_QUIZ_TYPES, ['japanese-n4','japanese-n3','japanese-n2'])
  for (const type of ['speaking-practice','genba-listening','genba-phrasebook']) assert.equal(isGameQuizType(type), false)
  const gameQuestions = GAME_QUIZ_TYPES.flatMap(type => buildGameQuestionsFromQuizzes(type))
  assert.equal(gameQuestions.length, 207)
  assert.equal(new Set(gameQuestions.map(q => q.id)).size, 207)
})
