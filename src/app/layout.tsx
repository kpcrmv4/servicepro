import type { Metadata, Viewport } from "next"
import { Figtree, Noto_Sans_Thai } from "next/font/google"
import { Providers } from "@/components/providers"
import { I18nProvider } from "@/components/i18n-provider"
import { getServerLocale, loadMessages } from "@/lib/i18n/locale"
import "./globals.css"

// Figtree — primary sans for Latin text. Modern, friendly, slightly
// rounded — matches the reference design.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
})

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "KPServicePro - ระบบจัดการอู่ซ่อมรถออนไลน์",
  description:
    "ระบบจัดการอู่ซ่อมรถครบวงจร ติดตามงานซ่อม จัดการอะไหล่ การเงิน และรายงานแบบเรียลไทม์",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KPServicePro",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getServerLocale()
  const messages = await loadMessages(locale)
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${figtree.variable} ${notoSansThai.variable} antialiased`}>
        <I18nProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
