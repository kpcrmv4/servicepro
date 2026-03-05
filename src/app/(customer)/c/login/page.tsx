"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Phone,
  MessageCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react"

export default function CustomerLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", ""])
  const [loading, setLoading] = useState(false)

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10)
    setPhoneNumber(cleaned)
  }

  const formatPhone = (phone: string) => {
    if (phone.length <= 3) return phone
    if (phone.length <= 6) return `${phone.slice(0, 3)}-${phone.slice(3)}`
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`
  }

  const handleSendOtp = () => {
    if (phoneNumber.length < 9) return
    setLoading(true)
    setTimeout(() => {
      setOtpSent(true)
      setLoading(false)
    }, 1000)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value.replace(/\D/g, "")
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const isOtpComplete = otp.every((d) => d !== "")

  const handleVerify = () => {
    if (!isOtpComplete) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-primary-foreground text-2xl font-bold">อู่</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">อู่ช่างสมชาย</h1>
        <p className="text-sm text-muted-foreground mt-1">ระบบลูกค้า</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">เข้าสู่ระบบ</h2>

          {!otpSent ? (
            /* Phone Number Input */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  เบอร์โทร
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={formatPhone(phoneNumber)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="0XX-XXX-XXXX"
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phoneNumber.length < 9 || loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  phoneNumber.length >= 9 && !loading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    ส่ง OTP
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* OTP Input */
            <div className="space-y-4">
              <div className="text-center">
                <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  กรอกรหัส OTP ที่ส่งไปยัง
                </p>
                <p className="text-sm font-medium text-foreground">{formatPhone(phoneNumber)}</p>
              </div>

              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={cn(
                      "h-12 w-12 rounded-lg border bg-background text-center text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors",
                      digit ? "border-primary" : "border-border"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={!isOtpComplete || loading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isOtpComplete && !loading
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "ยืนยัน"
                )}
              </button>

              <button
                onClick={() => {
                  setOtpSent(false)
                  setOtp(["", "", "", ""])
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center transition-colors"
              >
                เปลี่ยนเบอร์โทร
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">หรือ</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* LINE Login */}
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#06C755] text-white text-sm font-medium hover:bg-[#06C755]/90 transition-colors">
          <MessageCircle className="h-5 w-5" />
          เข้าสู่ระบบด้วย LINE
        </button>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground mt-5">
          ยังไม่มีบัญชี?{" "}
          <Link href="#" className="text-primary font-medium hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
