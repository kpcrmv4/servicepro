"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Wrench,
  Package,
  DollarSign,
  Users,
  Shield,
  BarChart3,
  Car,
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
  Globe,
  TrendingUp,
  Clock,
  MessageCircle,
  Search,
  Bell,
  Timer,
  Camera,
  FileText,
  Palette,
  Lock,
  Headphones,
  CircleDot,
  Layers,
  LineChart,
  Settings,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Play,
} from "lucide-react"

/* ==========================================================================
   IMAGE PLACEHOLDER CONFIGURATION
   ==========================================================================
   เปลี่ยน URL ด้านล่างเมื่ออัพโหลดรูป screenshot จริงไปที่ Supabase Storage
   ตัวอย่าง: https://your-project.supabase.co/storage/v1/object/public/screenshots/dashboard.png
   ========================================================================== */
const SCREENSHOT_IMAGES = {
  // Hero section - รูป Dashboard หลัก
  heroDashboard: "/images/placeholder-dashboard.svg",
  // Screenshot showcase carousel
  dashboard: "/images/placeholder-dashboard.svg",
  jobManagement: "/images/placeholder-jobs.svg",
  dvi: "/images/placeholder-dvi.svg",
  lineOA: "/images/placeholder-line.svg",
  inventory: "/images/placeholder-inventory.svg",
  finance: "/images/placeholder-finance.svg",
  mobile: "/images/placeholder-mobile.svg",
  // Testimonial profile images (ใช้ initials แทนจนกว่าจะมีรูปจริง)
  testimonial1: "",
  testimonial2: "",
  testimonial3: "",
} as const

/* ========== NAVBAR ========== */
function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { label: "ฟีเจอร์", href: "#features" },
    { label: "ขั้นตอน", href: "#how-it-works" },
    { label: "ราคา", href: "#pricing" },
    { label: "รีวิว", href: "#testimonials" },
    { label: "คำถามที่พบบ่อย", href: "#faq" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            KP
          </div>
          <span className="text-lg font-bold tracking-tight">
            KPService<span className="text-primary">Pro</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link
            href="/trial"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            ทดลองฟรี 7 วัน
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-muted/50">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/login" className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium">
              เข้าสู่ระบบ
            </Link>
            <Link href="/trial" className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              ทดลองฟรี 7 วัน
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

/* ========== HERO ========== */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm mb-8">
              <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              ทดลองใช้ฟรี 7 วัน ไม่ต้องผูกบัตร
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              บริหารอู่ซ่อมรถ
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
                ยุคใหม่
              </span>
              <br />
              ครบจบในที่เดียว
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-white/70 max-w-lg">
              KPServicePro คือระบบจัดการอู่ซ่อมรถอัจฉริยะ ที่ช่วยให้คุณจัดการงานซ่อม สต็อกอะไหล่ การเงิน
              และเชื่อมต่อลูกค้าผ่าน LINE OA ได้ในแพลตฟอร์มเดียว
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/trial"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 transition-all"
              >
                เริ่มทดลองฟรี 7 วัน
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-base font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                ไม่ต้องผูกบัตรเครดิต
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                ตั้งค่าใน 5 นาที
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                ซัพพอร์ตฟรีตลอด
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 to-blue-500/20 blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                  <div className="h-3 w-3 rounded-full bg-green-400/80" />
                  <span className="ml-2 text-xs text-white/40">KPServicePro Dashboard</span>
                </div>
                {/* Screenshot image - เปลี่ยน src เป็น URL รูปจริง */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-white">
                  <Image
                    src={SCREENSHOT_IMAGES.heroDashboard}
                    alt="KPServicePro Dashboard - ระบบจัดการอู่ซ่อมรถ"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">รายได้เพิ่มขึ้น</p>
                    <p className="text-sm font-bold text-green-600">+30%</p>
                  </div>
                </div>
              </div>
              {/* Floating badge right */}
              <div className="absolute -top-4 -right-4 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">อู่ที่ใช้งาน</p>
                    <p className="text-sm font-bold text-blue-600">500+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" className="fill-background" />
        </svg>
      </div>
    </section>
  )
}

/* ========== STATS ========== */
function StatsSection() {
  const stats = [
    { value: "500+", label: "อู่ที่ไว้วางใจ", icon: Building2 },
    { value: "50,000+", label: "งานซ่อมต่อเดือน", icon: Wrench },
    { value: "98%", label: "ความพึงพอใจ", icon: Star },
    { value: "30%", label: "รายได้เพิ่มขึ้น", icon: TrendingUp },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-foreground sm:text-4xl">{stat.value}</p>
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
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Wrench,
      title: "จัดการงานซ่อม",
      desc: "Kanban Board จัดคิวงาน แจกงานให้ช่าง บันทึกรูปก่อน-หลัง ตรวจสอบคุณภาพก่อนส่งมอบ",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      icon: Camera,
      title: "ตรวจสภาพรถ (DVI)",
      desc: "ระบบ Traffic Light แดง-เหลือง-เขียว ถ่ายรูปจุดเสียหาย ส่งรายงานให้ลูกค้าดูผ่านมือถือ",
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      icon: Package,
      title: "สต็อกอะไหล่",
      desc: "จัดการอะไหล่ Barcode/QR ตัดสต็อกอัตโนมัติ แจ้งเตือนสั่งซื้อเมื่อถึงจุดสั่ง",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      icon: Shield,
      title: "เคลมประกัน",
      desc: "บันทึกเคลม ติดตามสถานะ อัพโหลดเอกสาร คำนวณยอดเบิกอัตโนมัติ",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      icon: DollarSign,
      title: "การเงิน & บัญชี",
      desc: "ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ ติดตามรายรับ-รายจ่าย รายงานภาษี",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: MessageCircle,
      title: "LINE OA Integration",
      desc: "เชื่อมต่อ LINE แจ้งสถานะอัตโนมัติ ลูกค้าเช็คสถานะงานซ่อมผ่านแชทได้เลย",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      icon: Bell,
      title: "แจ้งเตือนเช็คระยะ",
      desc: "ระบบคำนวณรอบเช็คระยะอัตโนมัติ แจ้งเตือนลูกค้าเมื่อถึงกำหนด ดึงลูกค้าเก่ากลับมา",
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      icon: Timer,
      title: "จับเวลาช่าง",
      desc: "ช่างกด Clock In/Out จากมือถือ คำนวณชั่วโมงทำงาน ประเมินประสิทธิภาพ",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      icon: Layers,
      title: "แพ็กเกจบริการ",
      desc: "สร้างแพ็กเกจเหมาจ่าย เช่น เปลี่ยนถ่ายน้ำมัน ขายงานได้ง่ายขึ้น ปิดยอดเร็วขึ้น",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      icon: Users,
      title: "CRM ลูกค้า",
      desc: "ฐานข้อมูลลูกค้าครบถ้วน ประวัติซ่อม สมาชิก สะสมแต้ม Referral Program",
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      icon: BarChart3,
      title: "รายงานวิเคราะห์",
      desc: "Dashboard สรุปรายได้ ต้นทุน กำไร วิเคราะห์แนวโน้ม ช่วยตัดสินใจทางธุรกิจ",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ]

  return (
    <section id="features" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Zap className="h-4 w-4" />
            ฟีเจอร์ครบวงจร
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            ทุกเครื่องมือที่อู่ของคุณต้องการ
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ครอบคลุมทุกขั้นตอนการทำงานของอู่ซ่อมรถ ตั้งแต่รับรถจนถึงส่งมอบ
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/50 bg-background p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl", f.bg)}>
                <f.icon className={cn("h-6 w-6", f.color)} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== SCREENSHOT SHOWCASE CAROUSEL ========== */
function ScreenshotShowcase() {
  const screenshots = [
    {
      id: "dashboard",
      title: "Dashboard สรุปภาพรวม",
      desc: "ดูยอดรายรับ งานซ่อม สถานะสต็อก และประสิทธิภาพอู่ในหน้าเดียว",
      image: SCREENSHOT_IMAGES.dashboard,
      icon: Monitor,
    },
    {
      id: "jobs",
      title: "จัดการงานซ่อม Kanban",
      desc: "จัดคิวงานแบบ Drag & Drop ติดตามสถานะแบบเรียลไทม์",
      image: SCREENSHOT_IMAGES.jobManagement,
      icon: ClipboardCheck,
    },
    {
      id: "dvi",
      title: "ตรวจสภาพรถ (DVI)",
      desc: "ระบบ Traffic Light ถ่ายรูปจุดเสียหาย ส่งรายงานให้ลูกค้า",
      image: SCREENSHOT_IMAGES.dvi,
      icon: Camera,
    },
    {
      id: "line",
      title: "LINE OA Integration",
      desc: "แจ้งสถานะอัตโนมัติ ส่งใบเสนอราคาผ่าน LINE",
      image: SCREENSHOT_IMAGES.lineOA,
      icon: MessageCircle,
    },
    {
      id: "inventory",
      title: "สต็อกอะไหล่",
      desc: "จัดการสต็อก Barcode/QR ตัดสต็อกอัตโนมัติ",
      image: SCREENSHOT_IMAGES.inventory,
      icon: Package,
    },
    {
      id: "finance",
      title: "การเงิน & บัญชี",
      desc: "ใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ รายงานภาษี",
      image: SCREENSHOT_IMAGES.finance,
      icon: DollarSign,
    },
  ]

  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % screenshots.length)
  }, [screenshots.length])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }, [screenshots.length])

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, next])

  return (
    <section id="screenshots" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Monitor className="h-4 w-4" />
            ดูหน้าจอจริง
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            สำรวจระบบจริง
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ดูหน้าจอการใช้งานจริงของแต่ละฟีเจอร์ ออกแบบให้ใช้งานง่าย สวยงาม และมีประสิทธิภาพ
          </p>
        </div>

        {/* Main screenshot display */}
        <div className="relative">
          {/* Browser frame */}
          <div className="rounded-2xl border border-border bg-muted/30 p-2 shadow-2xl">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <div className="ml-3 flex-1 rounded-md bg-muted px-3 py-1">
                <span className="text-xs text-muted-foreground">app.kpservicepro.com/{screenshots[current].id}</span>
              </div>
            </div>
            {/* Screenshot image container */}
            <div
              className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-background"
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >
              <Image
                src={screenshots[current].image}
                alt={screenshots[current].title}
                fill
                className="object-cover object-top transition-opacity duration-500"
              />
              {/* Navigation arrows */}
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
                aria-label="รูปก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-colors"
                aria-label="รูปถัดไป"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {/* Current slide info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h3 className="text-lg font-bold text-white">{screenshots[current].title}</h3>
                <p className="text-sm text-white/80">{screenshots[current].desc}</p>
              </div>
            </div>
          </div>

          {/* Auto-play indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Play className={cn("h-3 w-3", isAutoPlaying && "text-primary")} />
              {isAutoPlaying ? "ออโต้เล่น" : "หยุดชั่วคราว"}
            </button>
          </div>
        </div>

        {/* Thumbnail navigation */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {screenshots.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCurrent(i); setIsAutoPlaying(false) }}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                i === current
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                i === current ? "bg-primary/10" : "bg-muted"
              )}>
                <s.icon className={cn(
                  "h-4 w-4",
                  i === current ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
              </div>
              <span className={cn(
                "text-[11px] font-medium text-center leading-tight",
                i === current ? "text-primary" : "text-muted-foreground"
              )}>
                {s.title}
              </span>
            </button>
          ))}
        </div>

        {/* Dot indicators for mobile */}
        <div className="mt-4 flex justify-center gap-2 sm:hidden">
          {screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setIsAutoPlaying(false) }}
              className={cn(
                "h-2 rounded-full transition-all",
                i === current ? "w-6 bg-primary" : "w-2 bg-border"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== LINE OA HIGHLIGHT ========== */
function LineOASection() {
  const features = [
    {
      icon: MessageCircle,
      title: "แจ้งสถานะอัตโนมัติ",
      desc: "เมื่อช่างอัปเดตสถานะงาน ระบบจะส่งข้อความเข้า LINE ลูกค้าทันที ลดภาระแอดมินที่ต้องคอยตอบคำถาม",
    },
    {
      icon: Search,
      title: "เช็คสถานะผ่านแชท",
      desc: "ลูกค้าพิมพ์ \"สถานะ\" ในแชท LINE ระบบจะดึงข้อมูลงานซ่อมปัจจุบันมาตอบให้อัตโนมัติ",
    },
    {
      icon: FileText,
      title: "ส่งใบเสนอราคาผ่าน LINE",
      desc: "ส่ง Flex Message ใบเสนอราคาสวยงาม ลูกค้ากดอนุมัติได้จากในแชทเลย ไม่ต้องโทรตาม",
    },
    {
      icon: Bell,
      title: "แจ้งเตือนเช็คระยะ",
      desc: "ระบบจะแจ้งเตือนลูกค้าเมื่อถึงรอบเช็คระยะ ช่วยดึงลูกค้าเก่ากลับมาใช้บริการ",
    },
  ]

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700 mb-4">
              <MessageCircle className="h-4 w-4" />
              LINE OA Integration
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              เชื่อมต่อลูกค้าผ่าน
              <span className="text-green-600"> LINE OA</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ลูกค้าไม่ต้องโหลดแอปเพิ่ม ใช้ LINE ที่คุ้นเคยในการติดตามงานซ่อม
              รับใบเสนอราคา และนัดหมายเข้ารับบริการ
            </p>

            <div className="mt-8 space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
                    <f.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LINE Chat mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-gradient-to-b from-green-50 to-background p-1 shadow-xl">
              <div className="rounded-[20px] bg-background overflow-hidden">
                {/* LINE header */}
                <div className="bg-green-500 px-4 py-3 text-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      KP
                    </div>
                    <div>
                      <p className="font-semibold text-sm">อู่ช่างเก่ง Auto Service</p>
                      <p className="text-xs text-white/70">ตอบกลับอัตโนมัติ</p>
                    </div>
                  </div>
                </div>
                {/* Chat messages */}
                <div className="p-4 space-y-3 min-h-[300px]">
                  {/* Customer message */}
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm bg-green-500 px-4 py-2 text-white text-sm max-w-[75%]">
                      สถานะรถผมเป็นยังไงบ้างครับ
                    </div>
                  </div>
                  {/* Bot reply */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-border px-4 py-3 text-sm max-w-[85%] shadow-sm">
                      <p className="font-medium mb-2">สถานะงานซ่อมของท่าน:</p>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>JOB-0042: Toyota Camry (กท-1234)</span>
                        </div>
                        <p className="ml-4 text-muted-foreground">สถานะ: กำลังซ่อม</p>
                      </div>
                    </div>
                  </div>
                  {/* Flex message - quotation */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white border border-border overflow-hidden max-w-[85%] shadow-sm">
                      <div className="bg-primary px-4 py-2">
                        <p className="text-white text-xs font-medium">ใบเสนอราคา #QT-0015</p>
                      </div>
                      <div className="p-3 text-xs space-y-1">
                        <p>เปลี่ยนผ้าเบรคหน้า-หลัง</p>
                        <p className="font-bold text-base">฿4,500</p>
                      </div>
                      <button className="w-full border-t border-border py-2.5 text-xs font-semibold text-green-600 hover:bg-green-50">
                        อนุมัติซ่อม
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========== DVI HIGHLIGHT ========== */
function DVISection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* DVI Report mockup */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-xl max-w-md mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">รายงานตรวจสภาพรถ</h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">8.5/10</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "น้ำมันเครื่อง", status: "good", label: "ดี" },
                  { name: "ผ้าเบรคหน้า", status: "fair", label: "ควรเปลี่ยนเร็วๆ นี้" },
                  { name: "ยางรถยนต์ (หน้าซ้าย)", status: "poor", label: "ต้องเปลี่ยน" },
                  { name: "แบตเตอรี่", status: "good", label: "ดี" },
                  { name: "น้ำหล่อเย็น", status: "good", label: "ดี" },
                  { name: "ไฟหน้า", status: "fair", label: "เริ่มมัว" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <div className={cn(
                        "h-3 w-3 rounded-full",
                        item.status === "good" ? "bg-green-500" :
                        item.status === "fair" ? "bg-yellow-500" : "bg-red-500"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
              {/* DVI photo grid */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["ยางสึก", "ผ้าเบรค", "ไฟหน้า"].map((label) => (
                  <div key={label} className="aspect-square rounded-lg bg-muted flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <Camera className="h-5 w-5 mx-auto text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700 mb-4">
              <Camera className="h-4 w-4" />
              Digital Vehicle Inspection
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              ตรวจสภาพรถดิจิทัล
              <span className="text-rose-600"> สร้างความไว้วางใจ</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ช่างตรวจสภาพรถด้วยระบบ Traffic Light แนบรูปถ่ายจุดเสียหาย
              ส่งรายงานให้ลูกค้าดูผ่านมือถือ สร้างความโปร่งใสและเพิ่มโอกาสขายงานเพิ่ม (Upsell)
            </p>

            <div className="mt-8 space-y-4">
              {[
                { color: "bg-green-500", label: "เขียว = สภาพดี ไม่ต้องซ่อม" },
                { color: "bg-yellow-500", label: "เหลือง = ควรเปลี่ยนเร็วๆ นี้" },
                { color: "bg-red-500", label: "แดง = ต้องซ่อม/เปลี่ยนทันที" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 rounded-full", item.color)} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-sm text-rose-800">
                <strong>ผลลัพธ์จริง:</strong> อู่ที่ใช้ระบบ DVI มีรายได้จากงาน Upsell เพิ่มขึ้นเฉลี่ย 25-40%
                เพราะลูกค้าเห็นภาพจริงของจุดที่ต้องซ่อม
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========== HOW IT WORKS ========== */
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "สมัครทดลองฟรี",
      desc: "กรอกข้อมูลอู่ของคุณ ระบบพร้อมใช้งานทันทีภายใน 5 นาที ไม่ต้องผูกบัตรเครดิต",
      icon: Globe,
    },
    {
      step: "02",
      title: "ตั้งค่าอู่ของคุณ",
      desc: "เพิ่มข้อมูลพนักงาน รายการอะไหล่ และเชื่อมต่อ LINE OA ของร้าน",
      icon: Settings,
    },
    {
      step: "03",
      title: "เริ่มใช้งานจริง",
      desc: "รับรถ สร้างใบงาน ตรวจสภาพรถ ออกใบเสนอราคา ทุกอย่างในระบบเดียว",
      icon: Wrench,
    },
    {
      step: "04",
      title: "เติบโตไปด้วยกัน",
      desc: "ดูรายงานวิเคราะห์ ปรับปรุงการทำงาน เพิ่มรายได้ ขยายธุรกิจ",
      icon: TrendingUp,
    },
  ]

  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            เริ่มต้นง่ายใน 4 ขั้นตอน
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ไม่ต้องติดตั้งโปรแกรม ไม่ต้องซื้อเซิร์ฟเวอร์ เปิดเบราว์เซอร์แล้วใช้งานได้เลย
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
              )}
              <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <s.icon className="h-8 w-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.step}
                </span>
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
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
      price: "999",
      period: "/ปี",
      desc: "สำหรับอู่ขนาดเล็ก เริ่มต้นใช้งานง่าย",
      features: [
        "ผู้ใช้งาน 3 คน",
        "งานซ่อมไม่จำกัด",
        "สต็อกอะไหล่",
        "ใบเสนอราคา & ใบเสร็จ",
        "รายงานพื้นฐาน",
        "ตรวจสภาพรถ (DVI)",
        "LINE แจ้งเตือน",
      ],
      cta: "เริ่มทดลองฟรี",
      popular: false,
    },
    {
      name: "Professional",
      price: "2,999",
      period: "/ปี",
      desc: "ครบทุกฟีเจอร์ สำหรับอู่ที่ต้องการเติบโต",
      features: [
        "ผู้ใช้งานไม่จำกัด",
        "ทุกอย่างใน Starter",
        "เคลมประกัน",
        "แพ็กเกจบริการ",
        "จับเวลาช่าง",
        "แจ้งเตือนเช็คระยะ",
        "รายงานวิเคราะห์ขั้นสูง",
        "หลายสาขา",
        "CRM & สมาชิก",
        "API Integration",
        "ซัพพอร์ตพิเศษ",
      ],
      cta: "เริ่มทดลองฟรี",
      popular: true,
    },
  ]

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            ราคาที่คุ้มค่า เหมาะกับทุกขนาดอู่
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            ทดลองใช้ฟรี 7 วัน ทุกแพ็กเกจ ไม่ต้องผูกบัตรเครดิต ยกเลิกได้ทุกเมื่อ
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border bg-background p-6 sm:p-8",
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                  : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    <Crown className="h-3 w-3" />
                    แนะนำ
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold">฿{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/trial"
                className={cn(
                  "mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors",
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border hover:bg-muted"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========== TESTIMONIALS ========== */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "สมชาย วงศ์ประเสริฐ",
      role: "เจ้าของอู่ช่างเก่ง Auto Service",
      text: "ก่อนใช้ KPServicePro จดทุกอย่างในสมุด หาข้อมูลลำบากมาก ตอนนี้ทุกอย่างอยู่ในระบบ ลูกค้าก็ชอบที่ได้รับแจ้งเตือนผ่าน LINE",
      rating: 5,
      image: SCREENSHOT_IMAGES.testimonial1,
    },
    {
      name: "วิภา แสงทอง",
      role: "ผู้จัดการอู่ Top Speed Garage",
      text: "ระบบ DVI ช่วยได้มาก ลูกค้าเห็นรูปจุดเสียหายจริง ตัดสินใจซ่อมเร็วขึ้น รายได้จาก Upsell เพิ่มขึ้น 35% ภายใน 3 เดือน",
      rating: 5,
      image: SCREENSHOT_IMAGES.testimonial2,
    },
    {
      name: "ธนกร เจริญสุข",
      role: "เจ้าของอู่ธนกรยนต์ 3 สาขา",
      text: "ใช้มา 1 ปี ระบบเสถียรมาก ดูรายงานรวมทุกสาขาได้ในที่เดียว ช่วยตัดสินใจเรื่องสต็อกและพนักงานได้ดีขึ้นมาก",
      rating: 5,
      image: SCREENSHOT_IMAGES.testimonial3,
    },
  ]

  return (
    <section id="testimonials" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            เสียงจากเจ้าของอู่ที่ใช้จริง
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            กว่า 500 อู่ทั่วประเทศไว้วางใจ KPServicePro
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-background p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                {/* Profile image */}
                {t.image ? (
                  <div className="relative h-10 w-10 rounded-full overflow-hidden">
                    <Image
                      src={t.image}
                      alt={t.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{t.name[0]}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
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
      q: "ทดลองใช้ฟรี 7 วัน ต้องผูกบัตรเครดิตไหม?",
      a: "ไม่ต้องผูกบัตรเครดิตครับ เพียงกรอกข้อมูลอู่ของคุณก็สามารถเริ่มใช้งานได้ทันที หลังหมดช่วงทดลอง สามารถเลือกแพ็กเกจที่เหมาะสมและชำระเงินเพื่อใช้งานต่อได้เลย",
    },
    {
      q: "ข้อมูลของอู่ฉันปลอดภัยไหม?",
      a: "ปลอดภัยครับ เราใช้ Supabase ซึ่งเป็นแพลตฟอร์มระดับ Enterprise ข้อมูลถูกเข้ารหัสทั้งขณะส่งและจัดเก็บ มีระบบ Row Level Security (RLS) แยกข้อมูลแต่ละอู่อย่างเข้มงวด",
    },
    {
      q: "ต้องติดตั้งโปรแกรมอะไรเพิ่มไหม?",
      a: "ไม่ต้องครับ KPServicePro เป็นระบบ Web-based เปิดเบราว์เซอร์บนคอมพิวเตอร์ แท็บเล็ต หรือมือถือก็ใช้งานได้เลย รองรับทุกระบบปฏิบัติการ",
    },
    {
      q: "เชื่อมต่อ LINE OA ยากไหม?",
      a: "ง่ายมากครับ เพียงนำ Channel ID, Channel Secret และ Access Token จาก LINE Developers Console มาใส่ในหน้าตั้งค่า ระบบจะเชื่อมต่อให้อัตโนมัติ มีคู่มือแนะนำทุกขั้นตอน",
    },
    {
      q: "หลังหมดทดลอง ข้อมูลจะหายไหม?",
      a: "ไม่หายครับ ข้อมูลทั้งหมดจะถูกเก็บรักษาไว้ 30 วัน หลังหมดช่วงทดลอง คุณสามารถเลือกแพ็กเกจและเริ่มใช้งานต่อได้ทันที โดยข้อมูลทั้งหมดยังคงอยู่ครบถ้วน",
    },
    {
      q: "รองรับหลายสาขาไหม?",
      a: "รองรับครับ แพ็กเกจ Professional รองรับหลายสาขา สามารถดูรายงานรวมทุกสาขาได้ในที่เดียว แต่ละสาขามี LINE OA แยกกันได้",
    },
  ]

  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section id="faq" className="py-16 sm:py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            คำถามที่พบบ่อย
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold pr-4">{faq.q}</span>
                {openIdx === i ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4">
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
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-blue-700 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              พร้อมยกระดับอู่ของคุณหรือยัง?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
              เริ่มทดลองใช้ KPServicePro ฟรี 7 วัน วันนี้ ไม่ต้องผูกบัตรเครดิต
              ตั้งค่าเสร็จใน 5 นาที
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/trial"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-lg hover:bg-white/90 transition-colors"
              >
                เริ่มทดลองฟรี 7 วัน
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="tel:0812345678"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <Phone className="h-4 w-4" />
                โทรปรึกษาฟรี
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                ข้อมูลปลอดภัย 100%
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                ซัพพอร์ตตลอด 24/7
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                ยกเลิกได้ทุกเมื่อ
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ========== FOOTER ========== */
function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                KP
              </div>
              <span className="font-bold">
                KPService<span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ระบบจัดการอู่ซ่อมรถครบวงจร ช่วยให้อู่ของคุณทำงานได้อย่างมืออาชีพ
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">ผลิตภัณฑ์</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">ฟีเจอร์</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">ราคา</a></li>
              <li><Link href="/trial" className="hover:text-foreground transition-colors">ทดลองฟรี</Link></li>
              <li><Link href="/login" className="hover:text-foreground transition-colors">เข้าสู่ระบบ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">ช่วยเหลือ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors">คำถามที่พบบ่อย</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">คู่มือการใช้งาน</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">ข้อกำหนดการใช้งาน</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">นโยบายความเป็นส่วนตัว</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">ติดต่อเรา</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                081-234-5678
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@kpservicepro.com
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                @kpservicepro
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} KPServicePro. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

/* ========== STRUCTURED DATA (JSON-LD) ========== */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "KPServicePro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "ระบบจัดการอู่ซ่อมรถครบวงจร จัดการงานซ่อม อะไหล่ เคลมประกัน การเงิน และเชื่อมต่อ LINE OA",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "999",
      highPrice: "2999",
      priceCurrency: "THB",
      offerCount: "2",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "500",
      bestRating: "5",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

/* ========== MAIN PAGE ========== */
export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ScreenshotShowcase />
        <LineOASection />
        <DVISection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
