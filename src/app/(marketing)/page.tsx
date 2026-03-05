"use client"

import { useState } from "react"
import Link from "next/link"
import { cn, formatCurrency } from "@/lib/utils"
import {
  Wrench,
  Package,
  DollarSign,
  Users,
  Shield,
  BarChart3,
  Car,
  CalendarPlus,
  ClipboardCheck,
  Smartphone,
  Star,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Crown,
  Building2,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Globe,
  Play,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react"

/* ========== HERO ========== */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm mb-6">
              <Zap className="h-4 w-4" />
              ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกบัตร
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              ระบบจัดการ
              <br />
              <span className="text-white/90">อู่ซ่อมรถ</span>
              <br />
              ครบวงจร
            </h1>

            <p className="mt-6 text-lg leading-relaxed opacity-90 max-w-lg">
              จัดการงานซ่อม อะไหล่ เคลมประกัน การเงิน CRM และอีกมากมายในที่เดียว
              ช่วยให้อู่ของคุณทำงานได้เร็วขึ้น ลดข้อผิดพลาด และเพิ่มรายได้
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-primary font-semibold shadow-lg hover:bg-white/90 transition-colors"
              >
                เริ่มทดลองฟรี
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors">
                <Play className="h-4 w-4" />
                ดูเดโม
              </button>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ไม่ต้องผูกบัตร
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ตั้งค่าใน 5 นาที
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                ซัพพอร์ตฟรี
              </div>
            </div>
          </div>

          {/* Dashboard preview mockup */}
          <div className="hidden lg:block">
            <div className="relative rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="rounded-xl bg-white/90 p-4 text-foreground space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "งานวันนี้", value: "12", color: "bg-primary/10 text-primary" },
                    { label: "รายรับ", value: "฿42K", color: "bg-success/10 text-success" },
                    { label: "รออะไหล่", value: "3", color: "bg-warning/10 text-warning" },
                    { label: "เสร็จแล้ว", value: "8", color: "bg-info/10 text-info" },
                  ].map((stat) => (
                    <div key={stat.label} className={cn("rounded-lg p-2.5 text-center", stat.color)}>
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-[10px]">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  {["Toyota Camry - เปลี่ยนผ้าเบรค", "Honda Civic - เช็คระยะ 50,000", "Isuzu D-Max - ซ่อมแอร์"].map((job, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
                      <div className={cn("h-2 w-2 rounded-full", i === 0 ? "bg-primary" : i === 1 ? "bg-warning" : "bg-success")} />
                      {job}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========== STATS ========== */
function StatsSection() {
  const stats = [
    { value: "500+", label: "อู่ที่ใช้งาน" },
    { value: "50,000+", label: "งานซ่อมต่อเดือน" },
    { value: "98%", label: "ความพึงพอใจ" },
    { value: "30%", label: "รายได้เพิ่มขึ้น" },
  ]

  return (
    <section className="border-b border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== FEATURES ========== */
function FeaturesSection() {
  const features = [
    {
      icon: ClipboardCheck,
      title: "รับรถ & ใบงาน",
      desc: "รับรถเข้าอู่แบบดิจิทัล ถ่ายรูปรอบคัน สร้างใบงานอัตโนมัติ ติดตามสถานะแบบเรียลไทม์",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Wrench,
      title: "จัดการงานซ่อม",
      desc: "Kanban Board จัดคิวงาน แจกงานให้ช่าง บันทึกรูปก่อน-หลัง QC ก่อนส่งมอบ",
      color: "text-blue-600",
      bg: "bg-blue-600/10",
    },
    {
      icon: Package,
      title: "สต็อกอะไหล่",
      desc: "จัดการอะไหล่ Barcode/QR ตัดสต็อกอัตโนมัติ แจ้งเตือนสั่งซื้อเมื่อถึงจุดสั่ง",
      color: "text-amber-600",
      bg: "bg-amber-600/10",
    },
    {
      icon: Shield,
      title: "เคลมประกัน",
      desc: "บันทึกเคลม ติดตามสถานะ อัพโหลดเอกสาร คำนวณยอดเบิกอัตโนมัติ",
      color: "text-green-600",
      bg: "bg-green-600/10",
    },
    {
      icon: DollarSign,
      title: "การเงิน & บัญชี",
      desc: "ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ติดตามรายรับ-รายจ่าย รายงานภาษี VAT",
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
    },
    {
      icon: Users,
      title: "CRM & ลูกค้าสัมพันธ์",
      desc: "ระบบสมาชิก แต้มสะสม คูปอง Smart Recall แจ้งเตือนเช็คระยะ ดึงลูกค้ากลับมา",
      color: "text-purple-600",
      bg: "bg-purple-600/10",
    },
    {
      icon: Smartphone,
      title: "Customer Portal",
      desc: "ลูกค้าดูสถานะงานซ่อม ประวัติรถ จองคิวออนไลน์ รับแจ้งเตือนผ่าน LINE",
      color: "text-rose-600",
      bg: "bg-rose-600/10",
    },
    {
      icon: BarChart3,
      title: "รายงาน & วิเคราะห์",
      desc: "แดชบอร์ดเรียลไทม์ รายงานรายรับ ประสิทธิภาพช่าง ยอดขายอะไหล่ แนวโน้มธุรกิจ",
      color: "text-indigo-600",
      bg: "bg-indigo-600/10",
    },
    {
      icon: Car,
      title: "ตรวจสภาพรถ (DVI)",
      desc: "ตรวจสภาพดิจิทัลแบบ Traffic Light ส่งรายงานให้ลูกค้า สร้างโอกาสขายเพิ่ม",
      color: "text-sky-600",
      bg: "bg-sky-600/10",
    },
  ]

  return (
    <section id="features" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            ฟีเจอร์ครบวงจร สำหรับทุกอู่
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            ทุกเครื่องมือที่อู่ซ่อมรถต้องการ รวมไว้ในระบบเดียว ใช้งานง่าย ไม่ต้องติดตั้ง
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", f.bg)}>
                  <Icon className={cn("h-6 w-6", f.color)} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ========== HOW IT WORKS ========== */
function HowItWorksSection() {
  const steps = [
    { step: 1, title: "สมัครทดลองฟรี", desc: "ลงทะเบียนใน 2 นาที ไม่ต้องผูกบัตร เริ่มใช้งานได้ทันที" },
    { step: 2, title: "ตั้งค่าอู่ของคุณ", desc: "กรอกข้อมูลอู่ เพิ่มช่าง ตั้งค่าบริการ นำเข้าข้อมูลลูกค้า" },
    { step: 3, title: "เริ่มรับงาน", desc: "รับรถเข้าอู่ สร้างใบงาน จัดการทุกอย่างผ่านระบบคลาวด์" },
    { step: 4, title: "เติบโตไปด้วยกัน", desc: "ดูรายงาน วิเคราะห์ผล ปรับปรุงธุรกิจ เพิ่มรายได้" },
  ]

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">เริ่มต้นง่ายใน 4 ขั้นตอน</h2>
          <p className="mt-4 text-lg text-muted-foreground">ตั้งค่าใน 5 นาที พร้อมใช้งานทันที</p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {s.step}
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== PRICING ========== */
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: 990,
      desc: "สำหรับอู่ขนาดเล็ก",
      features: [
        "งานซ่อมไม่จำกัด",
        "ช่างสูงสุด 3 คน",
        "จัดการสต็อกอะไหล่",
        "ใบเสนอราคา & ใบเสร็จ",
        "รายงานพื้นฐาน",
        "Customer Portal",
      ],
      cta: "เริ่มทดลองฟรี",
      popular: false,
      icon: Zap,
    },
    {
      name: "Professional",
      price: 1990,
      desc: "สำหรับอู่ที่ต้องการเติบโต",
      features: [
        "ทุกอย่างใน Starter",
        "ช่างไม่จำกัด",
        "เคลมประกัน",
        "CRM & ระบบสมาชิก",
        "ตรวจสภาพรถ (DVI)",
        "Smart Recall",
        "รายงานขั้นสูง",
        "LINE แจ้งเตือน",
      ],
      cta: "เริ่มทดลองฟรี",
      popular: true,
      icon: Crown,
    },
    {
      name: "Enterprise",
      price: 4990,
      desc: "สำหรับอู่ขนาดใหญ่และเครือข่าย",
      features: [
        "ทุกอย่างใน Professional",
        "หลายสาขา",
        "API เชื่อมต่อ",
        "Custom Branding",
        "Dedicated Support",
        "SLA 99.9%",
        "ฝึกอบรมทีม",
        "ออกแบบรายงานเฉพาะ",
      ],
      cta: "ติดต่อทีมขาย",
      popular: false,
      icon: Building2,
    },
  ]

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">แพ็กเกจราคา</h2>
          <p className="mt-4 text-lg text-muted-foreground">เลือกแพ็กเกจที่เหมาะกับอู่ของคุณ ทดลองฟรี 30 วัน ทุกแพ็กเกจ</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border bg-card p-8 transition-shadow hover:shadow-lg",
                  plan.popular
                    ? "border-primary shadow-lg scale-105"
                    : "border-border"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    แนะนำ
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", plan.popular ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("h-5 w-5", plan.popular ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">฿{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/เดือน</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={cn(
                    "block w-full rounded-xl py-3 text-center font-semibold transition-colors",
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-muted"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ========== TESTIMONIALS ========== */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "สมชาย ประเสริฐ",
      role: "เจ้าของ อู่สมชาย เซอร์วิส",
      text: "เปลี่ยนจากจดสมุดมาใช้ KPServicePro ทำให้ไม่ลืมงาน ลูกค้าประทับใจมาก ติดตามสถานะรถได้เอง รายได้เพิ่มขึ้น 25% ใน 3 เดือน",
      rating: 5,
    },
    {
      name: "วิไลวรรณ ทองสุข",
      role: "ผู้จัดการ Car Care Center",
      text: "ระบบสต็อกอะไหล่ดีมาก แจ้งเตือนเมื่อถึงจุดสั่งซื้อ ไม่เคยขาดสต็อกอีกเลย ลดค่าใช้จ่ายอะไหล่ลง 15%",
      rating: 5,
    },
    {
      name: "อนุชา ศรีวงศ์",
      role: "เจ้าของ เครือข่ายอู่ Fast Fix 5 สาขา",
      text: "ใช้ดูรายงานรวมทุกสาขาได้ในที่เดียว ประสิทธิภาพช่างวัดได้ชัด ทีม Support ตอบไว ช่วยเหลือดีมากครับ",
      rating: 5,
    },
  ]

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">เสียงจากผู้ใช้จริง</h2>
          <p className="mt-4 text-lg text-muted-foreground">ดูว่าเจ้าของอู่คิดอย่างไรกับ KPServicePro</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-xl border border-border bg-card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground italic">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== FAQ ========== */
function FAQSection() {
  const faqs = [
    {
      q: "ทดลองฟรี 30 วัน ต้องผูกบัตรเครดิตไหม?",
      a: "ไม่ต้องผูกบัตรเครดิต สมัครด้วยอีเมลและเริ่มใช้งานได้ทันที หลัง 30 วันสามารถเลือกอัพเกรดหรือใช้แพลนฟรีต่อได้",
    },
    {
      q: "ข้อมูลปลอดภัยไหม?",
      a: "ข้อมูลเข้ารหัส SSL/TLS ทุกการเชื่อมต่อ จัดเก็บบน Cloud ที่ได้มาตรฐาน สำรองข้อมูลทุกวัน และมีระบบแยกข้อมูลแต่ละอู่อย่างเข้มงวด (Multi-tenant RLS)",
    },
    {
      q: "ใช้งานบนมือถือได้ไหม?",
      a: "ได้ครับ ระบบเป็น Responsive Design ใช้งานผ่าน Browser บนมือถือ แท็บเล็ต และคอมพิวเตอร์ได้เลยโดยไม่ต้องติดตั้งแอพ",
    },
    {
      q: "เปลี่ยนแพ็กเกจได้ไหม?",
      a: "ได้ตลอดเวลา สามารถอัพเกรดหรือดาวน์เกรดแพ็กเกจได้ทันที ระบบจะคำนวณค่าใช้จ่ายตามสัดส่วนให้อัตโนมัติ",
    },
    {
      q: "มีระบบเคลมประกันไหม?",
      a: "มีครับ ตั้งแต่แพ็กเกจ Professional ขึ้นไป สามารถบันทึกเคลม ติดตามสถานะ อัพโหลดเอกสาร และคำนวณยอดเบิกได้อัตโนมัติ",
    },
    {
      q: "ย้ายข้อมูลเก่าเข้ามาได้ไหม?",
      a: "ได้ครับ ทีม Support จะช่วยย้ายข้อมูลลูกค้า รถ และประวัติงานซ่อมจากไฟล์ Excel หรือระบบเดิมให้ฟรี",
    },
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">คำถามที่พบบ่อย</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== CTA ========== */
function CTASection() {
  return (
    <section className="bg-gradient-to-br from-primary to-primary/80 py-20 text-primary-foreground">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold sm:text-4xl">พร้อมยกระดับอู่ของคุณแล้วหรือยัง?</h2>
        <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
          เริ่มทดลองใช้ฟรี 30 วัน วันนี้ ไม่ต้องผูกบัตร ไม่ต้องติดตั้ง พร้อมทีม Support ช่วยเหลือตลอด
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-primary font-bold shadow-lg hover:bg-white/90 transition-colors"
          >
            เริ่มทดลองฟรี 30 วัน
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            ดูฟีเจอร์ทั้งหมด
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ========== NAVBAR ========== */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Wrench className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">KPServicePro</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">ฟีเจอร์</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">ราคา</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">เข้าสู่ระบบ</Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            ทดลองฟรี
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
          <a href="#features" className="block text-sm text-muted-foreground hover:text-foreground">ฟีเจอร์</a>
          <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground">ราคา</a>
          <a href="#faq" className="block text-sm text-muted-foreground hover:text-foreground">FAQ</a>
          <Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground">เข้าสู่ระบบ</Link>
          <Link
            href="/register"
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-primary-foreground font-medium"
          >
            ทดลองฟรี 30 วัน
          </Link>
        </div>
      )}
    </nav>
  )
}

/* ========== FOOTER ========== */
function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">KPServicePro</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ระบบจัดการอู่ซ่อมรถออนไลน์ครบวงจร ช่วยให้อู่ทำงานง่ายขึ้น เพิ่มรายได้ ลดข้อผิดพลาด
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">ผลิตภัณฑ์</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">ฟีเจอร์</a></li>
              <li><a href="#pricing" className="hover:text-foreground">ราคา</a></li>
              <li><a href="#" className="hover:text-foreground">อัพเดท</a></li>
              <li><a href="#" className="hover:text-foreground">Roadmap</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">สนับสนุน</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              <li><a href="#" className="hover:text-foreground">คู่มือการใช้งาน</a></li>
              <li><a href="#" className="hover:text-foreground">วิดีโอสอนใช้งาน</a></li>
              <li><a href="#" className="hover:text-foreground">ติดต่อ Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> 02-xxx-xxxx
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> support@kpservicepro.com
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> @kpservicepro
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 KPServicePro. สงวนลิขสิทธิ์ทุกประการ
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-foreground">เงื่อนไขการใช้บริการ</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ========== LANDING PAGE ========== */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
