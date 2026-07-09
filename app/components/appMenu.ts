export type AppMenuItem = { href: string; label: string; icon: string }

export const APP_MENU: AppMenuItem[] = [
  { href: "/", icon: "🏠", label: "トップ" },
  { href: "/select-mode", icon: "📘", label: "学習項目" },
  { href: "/mypage", icon: "👤", label: "マイページ" },
  { href: "/plans", icon: "💳", label: "プラン" },
  { href: "/for-business", icon: "🏢", label: "法人向け" },
  { href: "/contact", icon: "✉️", label: "お問い合わせ" },
]
