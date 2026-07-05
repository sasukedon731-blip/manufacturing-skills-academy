# Manufacturing Skills Academy

製造業向けの日本語・現場用語・ゲーム学習・AI会話/AIスピーキング学習アプリです。

## 今回の販売前整理内容

- アプリ名/ブランドを `Manufacturing Skills Academy` に統一
- 製造版Firebase設定を `app/lib/firebase.ts` に固定
- Stripe APIルートと依存関係を削除し、KOMOJU決済へ一本化
- クライアント側から `billing` を作成・更新しないよう修正
- OpenAIクライアントをAPI実行時に初期化する形へ変更
- Firestoreルール案を `firestore.rules` に追加
- PWAアイコン/manifest/metadataを製造版向けに整理

## Vercel Environment Variables

本番運用では、Vercelに次を登録してください。

```env
OPENAI_API_KEY=OpenAIのAPIキー
FIREBASE_SERVICE_ACCOUNT_KEY=Firebase Admin SDKのサービスアカウントJSON
KOMOJU_SECRET_KEY=KOMOJUのシークレットキー
KOMOJU_WEBHOOK_SECRET=KOMOJUのWebhookシークレット
NEXT_PUBLIC_APP_URL=https://本番URL
```

Firebase Web APIキーは `app/lib/firebase.ts` に固定済みなので、`NEXT_PUBLIC_FIREBASE_API_KEY` は不要です。

## Firestore Rules

Firebase Console > Firestore Database > ルール に `firestore.rules` の内容を貼り付けて公開してください。

## ローカル起動

```bash
npm install
npm run dev
```

## デプロイ後の確認順

1. 画面表示
2. 新規登録
3. `users/{uid}` の作成確認
4. ログイン/ログアウト
5. 学習履歴保存
6. ゲーム保存
7. AI会話/AIスピーキング
8. KOMOJU決済ページ作成
9. KOMOJU Webhookで `billing.status=active` になるか確認
10. 企業コード登録/企業管理画面
