import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Noto_Sans_Thai } from "next/font/google"
import { Providers } from "@/components/providers"
import { I18nProvider } from "@/components/i18n-provider"
import { getServerLocale, loadMessages } from "@/lib/i18n/locale"
import "./globals.css"

const sans = localFont({
  src: [
    {
      path: "../fonts/Inter-Variable.woff2",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  fallback: ["system-ui", "Segoe UI", "sans-serif"],
  display: "swap",
  preload: true,
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
      <body className={`${sans.variable} ${notoSansThai.variable} antialiased`}>
        <I18nProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  )
}
