import Link from "next/link"

export const metadata = {
  title: "返金ポリシー",
}

export default function RefundPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>返金ポリシー</h1>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. 基本方針</h2>
          <p style={styles.text}>
            本サービスは買い切り型の期間利用権を販売するデジタルサービスです。
            決済完了後すぐに利用可能となるため、お客様都合による返金は原則としてお受けしておりません。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. 返金対象となる場合</h2>
          <p style={styles.text}>
            以下の場合は、内容を確認のうえ個別に対応します。
            {"\n"}・二重課金が発生した場合
            {"\n"}・重大なシステム不具合により、購入した機能を長時間利用できなかった場合
            {"\n"}・運営者が返金対応を相当と判断した場合
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. 返金対象外</h2>
          <p style={styles.text}>
            以下は返金対象外です。
            {"\n"}・お客様都合によるキャンセル
            {"\n"}・利用開始後または利用期間途中の解約希望
            {"\n"}・日割りでの返金希望
            {"\n"}・端末、通信環境、ブラウザ環境に起因する不具合
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. 自動更新について</h2>
          <p style={styles.text}>
            本サービスは自動更新ではありません。利用期間終了後に継続利用する場合は、再購入が必要です。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. お問い合わせ</h2>
          <p style={styles.text}>info@outin-plus.com</p>
        </section>

        <div style={styles.bottomLinks}>
          <Link href="/legal/terms" style={styles.link}>利用規約</Link>
          <Link href="/legal/privacy" style={styles.link}>プライバシーポリシー</Link>
          <Link href="/legal/tokushoho" style={styles.link}>特定商取引法に基づく表記</Link>
        </div>
      </article>
    </main>
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
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    margin: "0 0 8px",
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
