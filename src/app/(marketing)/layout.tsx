import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "KPServicePro - ระบบจัดการอู่ซ่อมรถออนไลน์ | ทดลองฟรี 30 วัน",
  description:
    "ระบบจัดการอู่ซ่อมรถครบวงจร จัดการงานซ่อม อะไหล่ เคลมประกัน การเงิน และ CRM ในที่เดียว ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกบัตร",
  keywords: [
    "ระบบจัดการอู่ซ่อมรถ",
    "โปรแกรมอู่ซ่อมรถ",
    "ซอฟต์แวร์อู่ซ่อมรถ",
    "ระบบจัดการงานซ่อม",
    "โปรแกรมจัดการสต็อกอะไหล่",
    "ระบบเคลมประกัน",
    "ระบบ POS อู่ซ่อมรถ",
    "KPServicePro",
    "อู่ซ่อมรถออนไลน์",
    "ระบบจัดการอู่ครบวงจร",
  ],
  openGraph: {
    title: "KPServicePro - ระบบจัดการอู่ซ่อมรถออนไลน์",
    description: "จัดการอู่ซ่อมรถครบวงจร งานซ่อม อะไหล่ ประกัน การเงิน CRM ทดลองฟรี 30 วัน",
    type: "website",
    locale: "th_TH",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
