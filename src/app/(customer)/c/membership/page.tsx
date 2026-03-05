"use client"

import { useState } from "react"
import Link from "next/link"
import { cn, formatDateShort } from "@/lib/utils"
import {
  ArrowLeft,
  Crown,
  Sparkles,
  Gift,
  Users,
  Copy,
  Share2,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Ticket,
} from "lucide-react"

const tierInfo = {
  current: "Silver",
  emoji: "🥈",
  next: "Gold",
  nextEmoji: "🥇",
  nextDiscount: "10%",
  visitsToNext: 2,
  totalVisits: 8,
  requiredVisits: 10,
}

const pointsHistory = [
  { id: 1, type: "earn" as const, desc: "เปลี่ยนผ้าเบรค", points: 50, date: "2026-02-15" },
  { id: 2, type: "earn" as const, desc: "เช็คระยะ 25K", points: 80, date: "2025-11-20" },
  { id: 3, type: "redeem" as const, desc: "แลกส่วนลด ฿200", points: -200, date: "2025-10-05" },
  { id: 4, type: "earn" as const, desc: "เช็คระยะ 20K", points: 70, date: "2025-08-10" },
  { id: 5, type: "earn" as const, desc: "เปลี่ยนน้ำมันเครื่อง", points: 40, date: "2025-06-22" },
  { id: 6, type: "earn" as const, desc: "แนะนำเพื่อน (มานี)", points: 100, date: "2025-05-15" },
]

const coupons = [
  {
    id: 1,
    title: "Birthday 15% OFF",
    description: "ส่วนลด 15% ทุกบริการ เนื่องในวันเกิด",
    code: "BDAY-VIPA",
    expiry: "2026-03-31",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 2,
    title: "เช็คระยะ ลด 20%",
    description: "ส่วนลด 20% บริการเช็คระยะ",
    code: "CHECK20",
    expiry: "2026-04-30",
    color: "from-orange-500 to-red-500",
  },
]

const referrals = [
  { name: "คุณมานี", status: "ใช้บริการแล้ว", points: 100 },
  { name: "คุณดาว", status: "ใช้บริการแล้ว", points: 100 },
  { name: "คุณแอน", status: "สมัครแล้ว รอใช้บริการ", points: 0 },
]

export default function MembershipPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<"points" | "coupons" | "referral">("points")

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const progressPercent = (tierInfo.totalVisits / tierInfo.requiredVisits) * 100

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="p-1 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">สมาชิก</h1>
      </div>

      {/* Tier Card */}
      <div className="rounded-xl bg-gradient-to-br from-amber-100 to-yellow-50 border border-amber-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{tierInfo.emoji}</span>
            <div>
              <p className="text-sm text-amber-800/70">สถานะปัจจุบัน</p>
              <p className="text-xl font-bold text-amber-900">{tierInfo.current}</p>
            </div>
          </div>
          <Crown className="h-8 w-8 text-amber-400" />
        </div>

        {/* Progress to next tier */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-amber-800/70 mb-1.5">
            <span>เข้าใช้บริการ {tierInfo.totalVisits}/{tierInfo.requiredVisits} ครั้ง</span>
            <span>{tierInfo.nextEmoji} {tierInfo.next}</span>
          </div>
          <div className="h-2.5 rounded-full bg-amber-200/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-amber-700 mt-2 font-medium">
            อีก {tierInfo.visitsToNext} ครั้ง จะเลื่อนเป็น {tierInfo.nextEmoji} {tierInfo.next} (ส่วนลด {tierInfo.nextDiscount})
          </p>
        </div>
      </div>

      {/* Points Card */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">คะแนนสะสม</p>
            <p className="text-3xl font-bold mt-0.5">
              1,250 <span className="text-sm font-normal">แต้ม</span>
            </p>
          </div>
          <Sparkles className="h-8 w-8 opacity-40" />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {[
          { key: "points" as const, label: "ประวัติแต้ม", icon: Sparkles },
          { key: "coupons" as const, label: "คูปอง", icon: Ticket },
          { key: "referral" as const, label: "แนะนำเพื่อน", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors",
                activeSection === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Points History */}
      {activeSection === "points" && (
        <div className="space-y-2">
          {pointsHistory.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  item.type === "earn" ? "bg-success/10" : "bg-error/10"
                )}
              >
                {item.type === "earn" ? (
                  <ArrowDownRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-error" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.desc}</p>
                <p className="text-xs text-muted-foreground">{formatDateShort(item.date)}</p>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  item.type === "earn" ? "text-success" : "text-error"
                )}
              >
                {item.type === "earn" ? "+" : ""}{item.points}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Coupons */}
      {activeSection === "coupons" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">คูปองที่ใช้ได้ ({coupons.length})</p>
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="rounded-xl overflow-hidden border border-border bg-card"
            >
              <div className={cn("px-4 py-3 text-white bg-gradient-to-r", coupon.color)}>
                <p className="text-lg font-bold">{coupon.title}</p>
                <p className="text-xs opacity-90">{coupon.description}</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">รหัสคูปอง</p>
                  <p className="text-sm font-mono font-medium text-foreground">{coupon.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    หมด {formatDateShort(coupon.expiry)}
                  </span>
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    {copiedCode === coupon.code ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Referral */}
      {activeSection === "referral" && (
        <div className="space-y-4">
          {/* Referral Code */}
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">รหัสแนะนำเพื่อน</p>
            <p className="text-2xl font-bold font-mono text-foreground">VIPA-2026</p>
            <p className="text-xs text-muted-foreground mt-1">
              แนะนำเพื่อนมาใช้บริการ รับ 100 แต้มต่อคน
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleCopy("VIPA-2026")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                {copiedCode === "VIPA-2026" ? (
                  <>
                    <Check className="h-4 w-4 text-success" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    คัดลอก
                  </>
                )}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#06C755] text-white text-sm font-medium hover:bg-[#06C755]/90 transition-colors">
                <Share2 className="h-4 w-4" />
                แชร์ LINE
              </button>
            </div>
          </div>

          {/* Referred Friends */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              เพื่อนที่แนะนำ ({referrals.length} คน)
            </p>
            <div className="space-y-2">
              {referrals.map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                    {ref.name.charAt(3)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{ref.name}</p>
                    <p className="text-xs text-muted-foreground">{ref.status}</p>
                  </div>
                  {ref.points > 0 && (
                    <span className="text-sm font-medium text-success">+{ref.points}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
