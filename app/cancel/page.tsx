import Link from "next/link"

export const metadata = {
  title: "利用期間・再購入について",
}

export default function CancelPage() {
  return (
    <main style={styles.main}>
      <section style={styles.card}>
        <h1 style={styles.title}>利用期間・再購入について</h1>

        <p style={styles.lead}>
          このサービスは月額サブスクリプションではなく、
          <b>買い切り型の期間利用プラン</b>です。自動更新はありません。
        </p>

        <div style={styles.pointBox}>
          <div style={styles.pointTitle}>このページで伝えたいこと</div>
          <ul style={styles.list}>
            <li>自動更新はありません</li>
            <li>解約手続きは不要です</li>
            <li>利用期間が終わると有料機能は停止します</li>
            <li>継続したい場合は、再度プランを購入してください</li>
          </ul>
        </div>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>利用期間が終わったらどうなる？</h2>
          <p style={styles.text}>
            購入済みの期間が終了すると、有料プランで利用していた教材や機能は利用できなくなります。
            無料で使える範囲がある場合は、その範囲のみ継続して利用できます。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>途中でやめたい場合</h2>
          <p style={styles.text}>
            月額課金ではないため、サブスクリプションの解約手続きはありません。
            追加の請求も発生しません。
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>再度使いたい場合</h2>
          <p style={styles.text}>
            利用期間終了後に、プランページから希望の期間を選んで再購入してください。
            AI会話・AIスピーキングを使う場合は、AIオプションも追加できます。
          </p>
        </section>

        <div style={styles.actions}>
          <Link href="/plans" style={styles.primaryBtn}>プランを見る</Link>
          <Link href="/legal/refund" style={styles.secondaryBtn}>返金ポリシーを見る</Link>
        </div>
      </section>
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
  lead: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 1.9,
  },
  pointBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 8,
    background: "#f8fafc",
    border: "1px solid rgba(37,99,235,.15)",
  },
  pointTitle: {
    fontSize: 15,
    fontWeight: 900,
    marginBottom: 10,
  },
  list: {
    margin: 0,
    paddingLeft: 20,
    lineHeight: 1.9,
    fontSize: 14,
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
  },
  actions: {
    marginTop: 24,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: 8,
    background: "#111827",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 18px",
    borderRadius: 8,
    background: "#eff6ff",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 900,
  },
}
