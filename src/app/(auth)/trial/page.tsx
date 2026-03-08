"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  CheckCircle2,
  Wrench,
  Shield,
  Clock,
  Zap,
  Star,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

interface FormData {
  // Step 1: Shop info
  shopName: string
  shopPhone: string
  shopAddress: string
  shopSubDistrict: string
  shopDistrict: string
  shopProvince: string
  shopPostalCode: string
  shopSize: string
  // Step 2: Owner info
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPhone: string
  ownerPassword: string
  ownerConfirmPassword: string
  // Step 3: Plan selection
  selectedPlan: string
}

const initialFormData: FormData = {
  shopName: "",
  shopPhone: "",
  shopAddress: "",
  shopSubDistrict: "",
  shopDistrict: "",
  shopProvince: "",
  shopPostalCode: "",
  shopSize: "small",
  ownerFirstName: "",
  ownerLastName: "",
  ownerEmail: "",
  ownerPhone: "",
  ownerPassword: "",
  ownerConfirmPassword: "",
  selectedPlan: "professional",
}

const shopSizes = [
  { value: "small", label: "เล็ก (1-3 ช่าง)", desc: "อู่ขนาดเล็ก เจ้าของดูแลเอง" },
  { value: "medium", label: "กลาง (4-10 ช่าง)", desc: "มีทีมช่างและผู้จัดการ" },
  { value: "large", label: "ใหญ่ (10+ ช่าง)", desc: "หลายแผนก หรือหลายสาขา" },
]

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "999",
    period: "/ปี",
    desc: "สำหรับอู่ขนาดเล็ก เริ่มต้นใช้งานง่าย",
    features: ["3 ผู้ใช้", "งานซ่อมไม่จำกัด", "สต็อกอะไหล่", "ตรวจสภาพรถ (DVI)", "LINE แจ้งเตือน", "รายงานพื้นฐาน"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "2,999",
    period: "/ปี",
    desc: "ครบทุกฟีเจอร์ สำหรับอู่ที่ต้องการเติบโต",
    features: ["ผู้ใช้ไม่จำกัด", "ทุกอย่างใน Starter", "เคลมประกัน", "แพ็กเกจบริการ", "จับเวลาช่าง", "แจ้งเตือนเช็คระยะ", "หลายสาขา", "API Integration", "ซัพพอร์ตพิเศษ"],
    popular: true,
  },
]

export default function TrialRegistrationPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const updateForm = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const validateStep1 = () => {
    if (!form.shopName.trim()) return "กรุณากรอกชื่ออู่"
    if (!form.shopPhone.trim()) return "กรุณากรอกเบอร์โทรอู่"
    if (!form.shopProvince.trim()) return "กรุณากรอกจังหวัด"
    return ""
  }

  const validateStep2 = () => {
    if (!form.ownerFirstName.trim()) return "กรุณากรอกชื่อ"
    if (!form.ownerLastName.trim()) return "กรุณากรอกนามสกุล"
    if (!form.ownerEmail.trim()) return "กรุณากรอกอีเมล"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) return "รูปแบบอีเมลไม่ถูกต้อง"
    if (!form.ownerPhone.trim()) return "กรุณากรอกเบอร์โทร"
    if (!form.ownerPassword) return "กรุณากรอกรหัสผ่าน"
    if (form.ownerPassword.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
    if (form.ownerPassword !== form.ownerConfirmPassword) return "รหัสผ่านไม่ตรงกัน"
    return ""
  }

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1()
      if (err) { setError(err); return }
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) { setError(err); return }
      setStep(3)
    }
    setError("")
  }

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step)
    setError("")
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/trial/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
        return
      }

      setSuccess(true)
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-extrabold">สมัครทดลองสำเร็จ!</h1>
          <p className="mt-3 text-muted-foreground">
            เราได้ส่งอีเมลยืนยันไปที่ <strong>{form.ownerEmail}</strong> แล้ว
            กรุณาตรวจสอบอีเมลและยืนยันตัวตนเพื่อเริ่มใช้งาน
          </p>
          <div className="mt-6 rounded-xl border border-border bg-background p-4 text-left text-sm">
            <p className="font-semibold mb-2">ข้อมูลการทดลองใช้:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>ชื่ออู่: <span className="text-foreground font-medium">{form.shopName}</span></p>
              <p>แพ็กเกจ: <span className="text-foreground font-medium">{plans.find(p => p.id === form.selectedPlan)?.name}</span></p>
              <p>ระยะเวลาทดลอง: <span className="text-foreground font-medium">7 วัน</span></p>
              <p>เริ่มต้น: <span className="text-foreground font-medium">{new Date().toLocaleDateString("th-TH")}</span></p>
              <p>สิ้นสุด: <span className="text-foreground font-medium">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("th-TH")}</span></p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              เข้าสู่ระบบ
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 p-8 text-white">
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 font-bold text-sm backdrop-blur-sm">
              KP
            </div>
            <span className="text-lg font-bold">
              KPService<span className="text-blue-300">Pro</span>
            </span>
          </Link>

          <h2 className="text-2xl font-extrabold mb-2">ทดลองใช้ฟรี 7 วัน</h2>
          <p className="text-white/60 mb-8">เข้าถึงทุกฟีเจอร์ ไม่ต้องผูกบัตรเครดิต</p>

          <div className="space-y-5">
            {[
              { icon: Wrench, text: "จัดการงานซ่อมครบวงจร" },
              { icon: Shield, text: "ข้อมูลปลอดภัย ระดับสากล" },
              { icon: Clock, text: "ตั้งค่าเสร็จใน 5 นาที" },
              { icon: Zap, text: "ใช้งานได้ทันทีหลังสมัคร" },
              { icon: Star, text: "ซัพพอร์ตฟรีตลอดช่วงทดลอง" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-white/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            &ldquo;ใช้ KPServicePro มา 6 เดือน รายได้เพิ่มขึ้น 30% เพราะระบบ DVI ช่วยให้ลูกค้าเห็นปัญหาจริง ตัดสินใจซ่อมเร็วขึ้น&rdquo;
          </p>
          <p className="mt-2 text-xs text-white/50">- สมชาย, เจ้าของอู่ช่างเก่ง Auto Service</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto py-8 px-4 sm:px-8">
        <div className="w-full max-w-lg">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                KP
              </div>
              <span className="font-bold">
                KPService<span className="text-primary">Pro</span>
              </span>
            </Link>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={cn("h-0.5 w-8 sm:w-12 rounded-full transition-colors", step > s ? "bg-primary" : "bg-muted")} />
                )}
              </div>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">
              {step === 1 ? "ข้อมูลอู่" : step === 2 ? "ข้อมูลผู้ใช้" : "เลือกแพ็กเกจ"}
            </span>
          </div>

          {/* Step 1: Shop Info */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-extrabold mb-1">ข้อมูลอู่ของคุณ</h1>
              <p className="text-muted-foreground mb-6">กรอกข้อมูลเบื้องต้นเกี่ยวกับอู่ของคุณ</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ชื่ออู่ / ร้าน <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={(e) => updateForm("shopName", e.target.value)}
                      placeholder="เช่น อู่ช่างเก่ง Auto Service"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    เบอร์โทรอู่ <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={form.shopPhone}
                      onChange={(e) => updateForm("shopPhone", e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">ที่อยู่</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      value={form.shopAddress}
                      onChange={(e) => updateForm("shopAddress", e.target.value)}
                      placeholder="เลขที่ ซอย ถนน"
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">ตำบล/แขวง</label>
                    <input
                      type="text"
                      value={form.shopSubDistrict}
                      onChange={(e) => updateForm("shopSubDistrict", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">อำเภอ/เขต</label>
                    <input
                      type="text"
                      value={form.shopDistrict}
                      onChange={(e) => updateForm("shopDistrict", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      จังหวัด <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.shopProvince}
                      onChange={(e) => updateForm("shopProvince", e.target.value)}
                      placeholder="กรุงเทพมหานคร"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      value={form.shopPostalCode}
                      onChange={(e) => updateForm("shopPostalCode", e.target.value)}
                      placeholder="10110"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ขนาดอู่</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {shopSizes.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => updateForm("shopSize", size.value)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          form.shopSize === size.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <p className="text-sm font-semibold">{size.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{size.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Owner Info */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-extrabold mb-1">ข้อมูลผู้ใช้งาน</h1>
              <p className="text-muted-foreground mb-6">สร้างบัญชีผู้ดูแลระบบ (เจ้าของอู่)</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      ชื่อ <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.ownerFirstName}
                        onChange={(e) => updateForm("ownerFirstName", e.target.value)}
                        placeholder="ชื่อจริง"
                        className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      นามสกุล <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.ownerLastName}
                      onChange={(e) => updateForm("ownerLastName", e.target.value)}
                      placeholder="นามสกุล"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    อีเมล <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={form.ownerEmail}
                      onChange={(e) => updateForm("ownerEmail", e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">ใช้สำหรับเข้าสู่ระบบและรับการแจ้งเตือน</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={form.ownerPhone}
                      onChange={(e) => updateForm("ownerPhone", e.target.value)}
                      placeholder="081-234-5678"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    รหัสผ่าน <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={form.ownerPassword}
                      onChange={(e) => updateForm("ownerPassword", e.target.value)}
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={form.ownerConfirmPassword}
                      onChange={(e) => updateForm("ownerConfirmPassword", e.target.value)}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Plan Selection */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-extrabold mb-1">เลือกแพ็กเกจ</h1>
              <p className="text-muted-foreground mb-6">
                ทดลองใช้ฟรี 7 วัน ทุกแพ็กเกจ ไม่ต้องชำระเงินตอนนี้
              </p>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => updateForm("selectedPlan", plan.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all",
                      form.selectedPlan === plan.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{plan.name}</h3>
                          {plan.popular && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              แนะนำ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold">฿{plan.price}</p>
                        <p className="text-xs text-muted-foreground">{plan.period || '/ปี'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.features.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {f}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">ไม่ต้องชำระเงินตอนนี้</p>
                    <p className="text-xs text-blue-700 mt-1">
                      คุณจะได้ทดลองใช้ฟรี 7 วันเต็ม หลังหมดช่วงทดลอง สามารถเลือกชำระเงินเพื่อใช้งานต่อ
                      หรือยกเลิกได้ทุกเมื่อ ข้อมูลจะถูกเก็บรักษาไว้ 30 วัน
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                กลับหน้าหลัก
              </Link>
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                ถัดไป
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังสมัคร...
                  </>
                ) : (
                  <>
                    เริ่มทดลองฟรี 7 วัน
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            การสมัครทดลองใช้ถือว่าคุณยอมรับ{" "}
            <a href="#" className="underline hover:text-foreground">ข้อกำหนดการใช้งาน</a>{" "}
            และ{" "}
            <a href="#" className="underline hover:text-foreground">นโยบายความเป็นส่วนตัว</a>
          </p>
        </div>
      </div>
    </div>
  )
}
