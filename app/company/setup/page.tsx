import Link from "next/link"

import AppHeader from "@/app/components/AppHeader"
import LegalFooter from "@/app/components/LegalFooter"

const adminUser = `{
  "role": "company_admin",
  "accountType": "company",
  "companyCode": "COMPANY001",
  "companyName": "サンプル株式会社",
  "billing": {
    "accountType": "company",
    "method": "company_code",
    "status": "company",
    "currentPlan": "company"
  }
}`

const learnerUser = `{
  "accountType": "personal",
  "companyCode": "COMPANY001",
  "companyName": "サンプル株式会社",
  "displayName": "学習者名"
}`

export default function CompanySetupPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <AppHeader title="企業設定メモ" />
      <section style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
        <h1>企業管理画面の設定メモ</h1>
        <p style={{ color: "#64748b", lineHeight: 1.8 }}>
          Firebase Authentication で企業管理者ユーザーを作成し、Firestore の <code>users/{"{uid}"}</code> に以下のような情報を設定します。
          学習者側にも同じ企業コードを入れると、企業管理画面に表示されます。
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          <Block title="企業管理者 users/{uid}" code={adminUser} />
          <Block title="学習者 users/{uid}" code={learnerUser} />
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/company" style={linkBtn}>企業管理画面へ</Link>
          <Link href="/company/login" style={linkBtn}>企業ログインへ</Link>
          <Link href="/" style={linkBtn}>トップへ</Link>
        </div>
        <LegalFooter />
      </section>
    </main>
  )
}

function Block({ title, code }: { title: string; code: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap", borderRadius: 8, background: "#0f172a", color: "#e2e8f0", padding: 16, lineHeight: 1.6 }}>
        {code}
      </pre>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  fontWeight: 900,
  textDecoration: "none",
}
