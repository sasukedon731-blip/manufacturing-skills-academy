import { japaneseN4Quiz } from "./japanese-n4"
import { japaneseN3Quiz } from "./japanese-n3"
import { japaneseN2Quiz } from "./japanese-n2"
import { speakingPractice } from "./speaking-practice"
import { genbaListening } from "./genba-listening"
import { genbaPhrasebook } from "./genba-phrasebook"
import { kansaiListeningQuiz } from "./kansai-listening"
import { dialectListeningQuiz } from "./dialect-listening"
import { dialectMeaningQuiz } from "./dialect-meaning"
import { confusingJapaneseQuiz } from "./confusing-japanese"

import { manufacturingMeaningQuiz } from "./manufacturing-meaning-150"
import { manufacturingWordQuiz } from "./manufacturing-word-100"
import { manufacturingListeningQuiz } from "./manufacturing-listening"
import { manufacturingConversationQuiz } from "./manufacturing-conversation"
import { manufacturingConversation as manufacturingConversation50 } from "./manufacturing-conversation-50"
import { skillTestMachiningQuiz } from "./skill-test-machining"

export const quizzes = {
  "japanese-n4": japaneseN4Quiz,
  "japanese-n3": japaneseN3Quiz,
  "japanese-n2": japaneseN2Quiz,
  "speaking-practice": speakingPractice,
  "genba-listening": genbaListening,
  "genba-phrasebook": genbaPhrasebook,
  "kansai-listening": kansaiListeningQuiz,
  "dialect-listening": dialectListeningQuiz,
  "dialect-meaning": dialectMeaningQuiz,
  "confusing-japanese": confusingJapaneseQuiz,

  "manufacturing-meaning": manufacturingMeaningQuiz,
  "manufacturing-word": manufacturingWordQuiz,
  "manufacturing-listening": manufacturingListeningQuiz,
  "manufacturing-conversation": manufacturingConversationQuiz,
  "manufacturing-conversation-50": manufacturingConversation50,
  "skill-test-machining": skillTestMachiningQuiz,
} as const
