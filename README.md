# Manufacturing Skills Academy

製造現場向けの日本語・AI学習アプリです。

## 今回の修正

- 無料体験中にN4だけへ固定される問題を修正
- trial/freeでも製造教材を含む全教材が選択・利用できるよう修正
- 既存ユーザーの selectedQuizTypes がN4だけの場合も自動修復で全教材へ更新
- 新規登録時に accountType / trialStartedAt / trialEndsAt を作成
- 企業コード登録ユーザーは company 扱い
- 教材一覧とモード選択画面を製造アプリ向けにデザイン改善
- TOP画面を Manufacturing Skills Academy 用にデザイン改善
- 通常学習画面の進捗・問題・選択肢・解説の見やすさを改善
- Firestore rules を accountType 作成許可・更新保護の形に調整

## 反映手順

1. ZIPを既存フォルダへ上書き
2. `git add -A`
3. `git commit -m "Fix manufacturing lesson access and UI"`
4. `git push`
5. Firebase Console の Firestore rules に `firestore.rules` を貼って公開
6. Vercel のデプロイ完了後、新規登録または既存ユーザーで再ログインして確認

## 注意

`.env.local` は含めていません。Vercelには `OPENAI_API_KEY` など必要な環境変数を設定してください。
