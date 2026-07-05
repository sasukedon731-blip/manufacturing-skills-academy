export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f4c5c",
}
// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://manufacturing-skills-academy.vercel.app"),
  title: {
    default: "Manufacturing Skills Academy",
    template: "%s | Manufacturing Skills Academy",
  },
  description: "製造現場の日本語・製造用語・AI会話・AIスピーキングを学べる製造業向け学習アプリです。",
  applicationName: "Manufacturing Skills Academy",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Manufacturing Skills Academy",
    description: "Japanese × Manufacturing × AI Learning App",
    type: "website",
    locale: "ja_JP",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Manufacturing Skills Academy" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
