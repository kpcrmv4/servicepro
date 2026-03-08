import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "KPServicePro - ระบบจัดการอู่ซ่อมรถครบวงจร | ทดลองฟรี 7 วัน",
  description:
    "ระบบจัดการอู่ซ่อมรถอัจฉริยะ ครบทุกฟังก์ชัน ตั้งแต่รับรถ จัดคิวงาน สต็อกอะไหล่ เคลมประกัน การเงิน ไปจนถึงแจ้งเตือนลูกค้าผ่าน LINE OA ทดลองใช้ฟรี 7 วัน ไม่ต้องผูกบัตร",
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
    "โปรแกรมอู่ซ่อมรถ ฟรี",
    "ระบบตรวจสภาพรถ DVI",
    "LINE OA อู่ซ่อมรถ",
    "แจ้งเตือนเช็คระยะ",
    "ระบบจับเวลาช่าง",
    "auto repair shop software",
    "garage management system",
  ],
  openGraph: {
    title: "KPServicePro - ระบบจัดการอู่ซ่อมรถครบวงจร",
    description:
      "จัดการอู่ซ่อมรถครบวงจร งานซ่อม อะไหล่ ประกัน การเงิน CRM เชื่อมต่อ LINE OA ทดลองฟรี 7 วัน",
    type: "website",
    locale: "th_TH",
    siteName: "KPServicePro",
  },
  twitter: {
    card: "summary_large_image",
    title: "KPServicePro - ระบบจัดการอู่ซ่อมรถครบวงจร",
    description:
      "จัดการอู่ซ่อมรถครบวงจร งานซ่อม อะไหล่ ประกัน การเงิน CRM เชื่อมต่อ LINE OA ทดลองฟรี 7 วัน",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
