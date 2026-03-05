import type { Metadata } from "next"
import localFont from "next/font/local"
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
      <body className={`${sans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
