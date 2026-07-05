import Link from "next/link"

type Props = {
  compact?: boolean
}

export default function LegalFooter({ compact = false }: Props) {
  return (
    <footer
      style={{
        marginTop: compact ? 20 : 32,
        padding: compact ? "14px 0 8px" : "20px 0 10px",
        borderTop: "1px solid rgba(17,24,39,.08)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? 10 : 12, alignItems: "center" }}>
        <FooterLink href="/legal/tokushoho">特定商取引法に基づく表記</FooterLink>
        <FooterLink href="/legal/terms">利用規約</FooterLink>
        <FooterLink href="/legal/privacy">プライバシーポリシー</FooterLink>
        <FooterLink href="/legal/refund">返金ポリシー</FooterLink>
        <FooterLink href="/cancel">解約・再購入について</FooterLink>
        <FooterLink href="/contact">お問い合わせ</FooterLink>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, lineHeight: 1.7, color: "rgba(17,24,39,.68)" }}>
        本サービスは日本語学習・製造現場向け学習支援アプリです。個人利用と企業利用を分けて提供し、
        企業管理画面では所属学習者の進捗確認に利用します。
      </p>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 13, fontWeight: 800, color: "#2563eb", textDecoration: "none" }}>
      {children}
    </Link>
  )
}
