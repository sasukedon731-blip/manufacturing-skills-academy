import Link from "next/link"

export const metadata = {
  title: "特定商取引法に基づく表記",
}

export default function TokushohoPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>特定商取引法に基づく表記</h1>

        <InfoRow label="販売事業者" value="株式会社アウトインプラス" />
        <InfoRow label="運営責任者" value="高野 倫之" />
        <InfoRow
          label="所在地"
          value="〒150-0043 東京都渋谷区道玄坂1丁目10-8 渋谷道玄坂東急ビル2F-C"
        />
        <InfoRow
          label="電話番号"
          value={`03-6820-3675
お問い合わせはメール（support@outin-plus.com）にてお願いいたします。`}
        />
        <InfoRow label="メールアドレス" value="support@outin-plus.com" />
        <InfoRow label="サービス名" value="Manufacturing Skills Academy" />
        <InfoRow label="販売URL" value="https://manufacturing-skills-academy.vercel.app/" />

        <SectionTitle>販売価格</SectionTitle>
        <p style={styles.text}>
          各プランページに税込価格を表示します。
          {"\n"}・基本学習プラン 30日：500円
          {"\n"}・基本学習プラン 90日：1,500円
          {"\n"}・基本学習プラン 180日：3,000円
          {"\n"}・AIオプション 30日：500円
          {"\n"}・AIオプション 90日：1,500円
          {"\n"}・AIオプション 180日：3,000円
        </p>

        <SectionTitle>商品代金以外の必要料金</SectionTitle>
        <p style={styles.text}>インターネット接続に必要な通信料等は、お客様のご負担となります。</p>

        <SectionTitle>支払方法</SectionTitle>
        <p style={styles.text}>クレジットカード決済、コンビニ決済</p>

        <SectionTitle>支払時期</SectionTitle>
        <p style={styles.text}>お申し込み時に決済されます。コンビニ決済は店頭でのお支払い完了後に確定します。</p>

        <SectionTitle>サービス提供時期</SectionTitle>
        <p style={styles.text}>
          クレジットカード決済の場合は決済完了後、直ちに利用可能となります。
          コンビニ決済の場合は入金確認後に利用可能となります。
        </p>

        <SectionTitle>商品内容</SectionTitle>
        <p style={styles.text}>
          製造現場で使う日本語、製造用語、JLPT学習、ゲーム形式の学習、AI会話・AIスピーキング等を提供するWebアプリです。
          基本学習プランでは日本語・製造系・ゲーム教材を利用できます。AI会話・AIスピーキングは別料金のAIオプションです。
        </p>

        <SectionTitle>契約・利用期間</SectionTitle>
        <p style={styles.text}>
          本サービスは買い切り型の期間利用権販売です。自動更新はありません。
          購入した期間のみ利用できます。期間終了後は必要に応じて再購入してください。
        </p>

        <SectionTitle>無料体験</SectionTitle>
        <p style={styles.text}>
          個人ユーザーは新規登録後、1日間無料で対象機能を試すことができます。無料体験終了後に自動で課金されることはありません。
        </p>

        <SectionTitle>企業利用</SectionTitle>
        <p style={styles.text}>
          企業コードで登録したユーザーの利用料金は企業契約に基づきます。企業ユーザーへ個人向けプランの料金を請求することはありません。
        </p>

        <SectionTitle>動作環境</SectionTitle>
        <p style={styles.text}>
          インターネットへ接続できる環境と、最新版のGoogle Chrome、Microsoft Edge、Safari等の主要なWebブラウザが必要です。端末やブラウザの設定により、一部機能を利用できない場合があります。
        </p>

        <SectionTitle>キャンセル・返金</SectionTitle>
        <p style={styles.text}>
          デジタルコンテンツの性質上、決済完了後のお客様都合による返金は原則としてお受けしておりません。
          二重課金や重大な不具合がある場合は、個別に確認します。
        </p>

        <SectionTitle>表現および商品に関する注意書き</SectionTitle>
        <p style={styles.text}>
          本サービスの学習効果には個人差があります。特定の試験合格、資格取得、就職等を保証するものではありません。
        </p>

        <BottomLinks />
      </article>
    </main>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.row}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={styles.sectionTitle}>{children}</h2>
}

function BottomLinks() {
  return (
    <div style={styles.bottomLinks}>
      <Link href="/legal/terms" style={styles.link}>利用規約</Link>
      <Link href="/legal/privacy" style={styles.link}>プライバシーポリシー</Link>
      <Link href="/legal/refund" style={styles.link}>返金ポリシー</Link>
      <Link href="/plans" style={styles.link}>プランへ戻る</Link>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "24px 14px 40px",
  },
  card: {
    background: "#fff",
    border: "1px solid rgba(17,24,39,.08)",
    borderRadius: 8,
    padding: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.3,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid rgba(17,24,39,.08)",
  },
  label: {
    fontWeight: 900,
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 900,
  },
  text: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.9,
    color: "#1f2937",
    whiteSpace: "pre-wrap",
  },
  bottomLinks: {
    marginTop: 28,
    paddingTop: 16,
    borderTop: "1px solid rgba(17,24,39,.08)",
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  link: {
    color: "#2563eb",
    fontWeight: 800,
    textDecoration: "none",
    fontSize: 14,
  },
}
