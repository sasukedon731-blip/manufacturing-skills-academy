export type AppMenuItem = { href: string; label: string; icon: string }

export const APP_MENU: AppMenuItem[] = [
  { href: "/", icon: "🏠", label: "トップ" },
  { href: "/select-mode", icon: "📘", label: "学習項目" },
  { href: "/game", icon: "🎮", label: "ゲーム" },
  { href: "/conversation", icon: "🤖", label: "AI会話" },
  { href: "/speaking", icon: "🎙️", label: "AIスピーキング" },
  { href: "/mypage", icon: "👤", label: "マイページ" },
  { href: "/plans", icon: "💳", label: "プラン" },
  { href: "/for-business", icon: "🏢", label: "法人向け" },
  { href: "/company", icon: "📊", label: "企業管理" },
  { href: "/contact", icon: "✉️", label: "お問い合わせ" },
]
