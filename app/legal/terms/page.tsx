import Link from "next/link"

export const metadata = {
  title: "利用規約",
}

export default function TermsPage() {
  return (
    <main style={styles.main}>
      <article style={styles.card}>
        <h1 style={styles.title}>利用規約</h1>

        <Section title="第1条（適用）">
          本規約は、本サービスの利用条件を定めるものです。ユーザーは本規約に同意のうえ、本サービスを利用するものとします。
        </Section>

        <Section title="第2条（サービス内容）">
          本サービスは、製造現場で使う日本語、日本語能力試験対策、製造用語、ゲーム形式の学習、AI会話・AIスピーキング等の学習機能を提供します。
        </Section>

        <Section title="第3条（アカウント管理）">
          ユーザーは自己の責任においてアカウント情報を管理するものとします。第三者による不正利用が疑われる場合は、速やかに運営者へ連絡してください。
        </Section>

        <Section title="第4条（料金および支払い）">
          有料機能は買い切り型の期間利用権として販売されます。基本学習プランでは日本語・製造系・ゲーム教材を利用できます。AI会話・AIスピーキングは別料金のAIオプションです。
          {"\n"}購入時に選択した期間と内容に応じて、クレジットカードまたはコンビニ決済で支払いが発生します。
        </Section>

        <Section title="第5条（利用期間）">
          ユーザーは購入した期間中、本サービスの対象機能を利用できます。自動更新はありません。利用期間終了後に継続利用する場合は、再購入が必要です。
        </Section>

        <Section title="第6条（返金）">
          デジタルコンテンツの性質上、決済完了後のお客様都合による返金は原則としてお受けしておりません。ただし、二重課金や重大な不具合等、運営者が必要と判断した場合は個別に対応します。
        </Section>

        <Section title="第7条（禁止事項）">
          法令または公序良俗に反する行為、不正アクセス、他者になりすます行為、教材・画像・音声・文章等の無断転載、複製、配布、販売、その他運営者が不適切と判断する行為を禁止します。
        </Section>

        <Section title="第8条（免責）">
          本サービスは学習支援を目的とするものであり、特定の試験合格、資格取得、就職等を保証するものではありません。AI機能の出力内容は必ずしも正確性・完全性を保証するものではありません。
        </Section>

        <Section title="第9条（サービスの変更・停止）">
          運営者は、保守、障害対応、仕様変更、その他必要がある場合、本サービスの全部または一部を変更または停止することがあります。
        </Section>

        <Section title="第10条（規約の変更）">
          運営者は必要に応じて本規約を変更できます。変更後の内容は、本サービス上に表示した時点で効力を生じます。
        </Section>

        <Section title="第11条（準拠法・管轄）">
          本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
        </Section>

        <div style={styles.bottomLinks}>
          <Link href="/legal/privacy" style={styles.link}>プライバシーポリシー</Link>
          <Link href="/legal/refund" style={styles.link}>返金ポリシー</Link>
          <Link href="/legal/tokushoho" style={styles.link}>特定商取引法に基づく表記</Link>
        </div>
      </article>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.text}>{children}</p>
    </section>
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
