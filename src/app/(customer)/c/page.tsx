"use client"

import { useState } from "react"
import Link from "next/link"
import { cn, formatCurrency } from "@/lib/utils"
import {
  Car,
  CalendarPlus,
  Phone,
  MessageCircle,
  ChevronRight,
  Wrench,
  Sparkles,
  Tag,
} from "lucide-react"

const vehicles = [
  {
    id: "v1",
    brand: "Toyota",
    model: "Camry",
    plate: "กข 1234",
    healthScore: 85,
    color: "text-success",
    bgColor: "bg-success/10",
    ringColor: "ring-success/30",
    image: "🚗",
  },
  {
    id: "v2",
    brand: "Honda",
    model: "City",
    plate: "ขค 5678",
    healthScore: 62,
    color: "text-warning",
    bgColor: "bg-warning/10",
    ringColor: "ring-warning/30",
    image: "🚙",
  },
]

const activeJob = {
  id: "JOB-2025-0142",
  vehicle: "Toyota Camry กข 1234",
  service: "เปลี่ยนผ้าเบรคหน้า-หลัง",
  status: "กำลังซ่อม",
  progress: 60,
  estimatedDone: "16:00 วันนี้",
  technician: "ช่างสมชาย",
  token: "abc123",
}

function HealthScoreCircle({
  score,
  size = 48,
}: {
  score: number
  size?: number
}) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-error"
  const strokeColor =
    score >= 80
      ? "stroke-success"
      : score >= 60
        ? "stroke-warning"
        : "stroke-error"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={strokeColor}
        />
      </svg>
      <span className={cn("absolute text-xs font-bold", color)}>{score}</span>
    </div>
  )
}

export default function CustomerHomePage() {
  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            สวัสดี, คุณวิภา
          </h1>
          <p className="text-sm text-muted-foreground">ยินดีต้อนรับกลับมา</p>
        </div>
        <Link
          href="/c/membership"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-50 border border-amber-200 text-sm"
        >
          <span>🥈</span>
          <span className="font-medium text-amber-700">Silver</span>
        </Link>
      </div>

      {/* Points Card */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">คะแนนสะสม</p>
            <p className="text-2xl font-bold mt-0.5">1,250 <span className="text-sm font-normal">แต้ม</span></p>
          </div>
          <Sparkles className="h-8 w-8 opacity-50" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href="/c/membership"
            className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            ดูสิทธิพิเศษ →
          </Link>
        </div>
      </div>

      {/* My Vehicles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">รถของฉัน</h2>
          <Link
            href="/c/vehicles/v1"
            className="text-sm text-primary hover:underline"
          >
            ดูทั้งหมด
          </Link>
        </div>
        <div className="space-y-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/c/vehicles/${v.id}`}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
            >
              <div className="text-3xl">{v.image}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {v.brand} {v.model}
                </p>
                <p className="text-xs text-muted-foreground">{v.plate}</p>
              </div>
              <HealthScoreCircle score={v.healthScore} />
            </Link>
          ))}
        </div>
      </section>

      {/* Active Job */}
      <section>
        <h2 className="font-semibold text-foreground mb-3">งานปัจจุบัน</h2>
        <Link
          href={`/c/track/${activeJob.token}`}
          className="block p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{activeJob.id}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {activeJob.status}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{activeJob.service}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{activeJob.vehicle}</p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>ความคืบหน้า</span>
              <span>{activeJob.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${activeJob.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              เสร็จโดยประมาณ: {activeJob.estimatedDone}
            </p>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="font-semibold text-foreground mb-3">เมนูลัด</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/c/booking"
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">จองคิว</span>
          </Link>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-success" />
            </div>
            <span className="text-xs font-medium text-foreground">โทรหาร้าน</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
            <div className="h-10 w-10 rounded-full bg-[#06C755]/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-[#06C755]" />
            </div>
            <span className="text-xs font-medium text-foreground">แชท Line</span>
          </button>
        </div>
      </section>

      {/* Promotion Banner */}
      <section>
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="h-4 w-4" />
              <span className="text-xs font-medium opacity-90">โปรโมชั่น</span>
            </div>
            <p className="font-bold text-lg">ลด 20% เช็คระยะ</p>
            <p className="text-sm opacity-90 mt-0.5">สำหรับสมาชิก Silver ขึ้นไป</p>
            <Link
              href="/c/booking"
              className="inline-block mt-3 px-4 py-1.5 rounded-full bg-white text-orange-600 text-sm font-medium hover:bg-white/90 transition-colors"
            >
              จองเลย
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
