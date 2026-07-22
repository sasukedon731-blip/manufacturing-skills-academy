import Link from "next/link"

export const metadata = {
  title: "プライバシーポリシー",
}

export default function PrivacyPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>プライバシーポリシー</h1>

        <p style={styles.text}>
          株式会社アウトインプラス（以下「当社」といいます）は、Manufacturing Skills Academy（以下「本サービス」といいます）におけるユーザー情報を、以下の方針に基づき取り扱います。
        </p>

        <Section title="1. 取得する情報">
          メールアドレス、ログイン情報、表示名、学習履歴、回答履歴、進捗情報、バッジ情報、決済に関する情報、お問い合わせ内容、アクセス情報、端末情報、Cookie等を取得する場合があります。
          AI会話・AIスピーキング利用時には、入力内容、音声、文字起こし、評価結果等を取得する場合があります。
        </Section>

        <Section title="2. 利用目的">
          本サービスの提供、本人確認、認証、決済処理、購入状況の管理、学習履歴・進捗の表示、AI機能の提供、品質改善、企業管理画面での所属学習者の確認、不正利用防止、セキュリティ向上、お問い合わせ対応のために利用します。
        </Section>

        <Section title="3. 企業アカウントでの情報共有">
          企業コードを利用して登録した場合、企業管理者は所属ユーザーの氏名、メールアドレス、学習回数、正答率、最終学習日、進行中教材等を確認できる場合があります。
        </Section>

        <Section title="4. 第三者提供">
          法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
        </Section>

        <Section title="5. 外部サービスの利用">
          本サービスでは、認証・データ保存、決済、AI機能等の提供に外部サービスを利用する場合があります。決済処理および入金確認にはKOMOJUを利用し、決済に必要な範囲でメールアドレス、注文番号、購入内容等が送信される場合があります。サービス提供に必要な範囲で情報が送信または保存されることがあります。
        </Section>

        <Section title="6. Cookie等の利用">
          利便性向上、利用状況の把握、不正利用防止のため、Cookieその他これに類する技術を利用する場合があります。
        </Section>

        <Section title="7. 安全管理">
          取得した情報について、漏えい、滅失、毀損等を防止するため、必要かつ適切な安全管理措置を講じます。
        </Section>

        <Section title="8. 開示・訂正・削除等">
          ユーザー本人から、保有する個人情報の開示、訂正、削除等の請求があった場合、法令に従い適切に対応します。
        </Section>

        <Section title="9. お問い合わせ窓口">
          support@outin-plus.com
        </Section>

        <Section title="10. 改定">
          本ポリシーは必要に応じて改定することがあります。重要な変更がある場合は、本サービス上でお知らせします。
        </Section>

        <BottomLinks />
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.text}>{children}</p>
    </section>
  )
}

function BottomLinks() {
  return (
    <div style={styles.bottomLinks}>
      <Link href="/legal/terms" style={styles.link}>利用規約</Link>
      <Link href="/legal/refund" style={styles.link}>返金ポリシー</Link>
      <Link href="/legal/tokushoho" style={styles.link}>特定商取引法に基づく表記</Link>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 860, margin: "0 auto", padding: "24px 14px 40px" },
  card: { background: "#fff", border: "1px solid rgba(17,24,39,.08)", borderRadius: 8, padding: 20 },
  title: { margin: 0, fontSize: 28, fontWeight: 900 },
  section: { marginTop: 20 },
  sectionTitle: { margin: "0 0 8px", fontSize: 18, fontWeight: 900 },
  text: { margin: 0, fontSize: 14, lineHeight: 1.9, color: "#1f2937", whiteSpace: "pre-wrap" },
  bottomLinks: {
    marginTop: 28,
    paddingTop: 16,
    borderTop: "1px solid rgba(17,24,39,.08)",
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  link: { color: "#2563eb", fontWeight: 800, textDecoration: "none", fontSize: 14 },
}
