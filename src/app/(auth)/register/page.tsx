"use client"

import { useState } from "react"
import Link from "next/link"
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  MapPin,
  Wrench,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"

const provinces = [
  "กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "ชลบุรี",
  "เชียงใหม่", "นครราชสีมา", "ขอนแก่น", "สงขลา", "ภูเก็ต",
  "อุดรธานี", "นครปฐม", "ระยอง", "สุราษฎร์ธานี", "เชียงราย",
]

const jobTypes = [
  "ซ่อมทั่วไป", "งานสี/ตัวถัง", "ช่วงล่าง", "เครื่องยนต์",
  "ระบบไฟฟ้า", "แอร์รถยนต์", "เช็คระยะ/บำรุงรักษา", "ยาง/ล้อ",
]

const steps = [
  { num: 1, title: "ข้อมูลผู้ใช้" },
  { num: 2, title: "ข้อมูลอู่" },
  { num: 3, title: "เลือกแผน" },
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium">("pro")
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])

  const toggleJob = (job: string) => {
    setSelectedJobs((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    console.log("Register submitted")
    await new Promise((r) => setTimeout(r, 2000))
    setIsLoading(false)
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
              step >= s.num
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span className={cn(
              "ml-2 text-sm hidden sm:inline",
              step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                "mx-3 h-px w-8 sm:w-12",
                step > s.num ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: User Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">ข้อมูลผู้ใช้</h2>
            <p className="text-sm text-muted-foreground">สร้างบัญชีเพื่อเริ่มต้นใช้งาน</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="อีเมล"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                placeholder="เบอร์โทร"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="รหัสผ่าน"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่าน"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            ถัดไป <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Shop Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">ข้อมูลอู่</h2>
            <p className="text-sm text-muted-foreground">กรอกข้อมูลอู่ของคุณ</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ชื่ออู่"
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                <option value="">เลือกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">จำนวน Bay/Lift</label>
                <select className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>1-2</option>
                  <option>3-5</option>
                  <option>6-10</option>
                  <option>10+</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">จำนวนช่าง</label>
                <select className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option>1-3</option>
                  <option>4-8</option>
                  <option>9-15</option>
                  <option>15+</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">ประเภทงานหลัก</label>
              <div className="grid grid-cols-2 gap-2">
                {jobTypes.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => toggleJob(job)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                      selectedJobs.includes(job)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-primary/50"
                    )}
                  >
                    <Wrench className="h-3 w-3" />
                    {job}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              ถัดไป <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Plan */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">เลือกแผน</h2>
            <p className="text-sm text-muted-foreground">ทดลองใช้ฟรี 30 วัน ทุกแผน</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Pro Plan */}
            <button
              onClick={() => setSelectedPlan("pro")}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition-colors",
                selectedPlan === "pro" ? "border-primary bg-primary/5" : "border-input"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Pro</h3>
                {selectedPlan === "pro" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold">฿X,XXX<span className="text-sm font-normal text-muted-foreground">/ปี</span></p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> ระบบหน้าร้านครบ</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> DVI & Customer Portal</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> สต็อก + การเงิน</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> CRM + Loyalty</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> Dashboard + Reports</li>
              </ul>
            </button>

            {/* Premium Plan */}
            <button
              onClick={() => setSelectedPlan("premium")}
              className={cn(
                "relative rounded-xl border-2 p-5 text-left transition-colors",
                selectedPlan === "premium" ? "border-accent bg-accent/5" : "border-input"
              )}
            >
              <div className="absolute -top-3 right-4 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold text-white">
                แนะนำ
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Premium</h3>
                {selectedPlan === "premium" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold">฿XX,XXX<span className="text-sm font-normal text-muted-foreground">/ปี</span></p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> ทุกอย่างใน Pro</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> Landing Page Builder</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> ร้านค้าออนไลน์</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> Custom Domain</li>
                <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-success" /> White-label</li>
              </ul>
            </button>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
            ✓ ไม่ต้องใส่บัตรเครดิต &nbsp;•&nbsp; ✓ ยกเลิกได้ทุกเมื่อ &nbsp;•&nbsp; ✓ ใช้งานได้ทันที
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-2 rounded-lg border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "สมัครทดลองใช้ฟรี 30 วัน"
              )}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            มีบัญชีแล้ว?{" "}
            <Link href="/login" className="text-primary hover:underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
