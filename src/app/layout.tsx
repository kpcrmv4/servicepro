import type { Metadata } from "next"
import localFont from "next/font/local"
import { Noto_Sans_Thai } from "next/font/google"
import { Providers } from "@/components/providers"
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sans.variable} ${notoSansThai.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
