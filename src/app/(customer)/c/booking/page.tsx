"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react"

const myVehicles = [
  { id: "v1", brand: "Toyota", model: "Camry", plate: "กข 1234", emoji: "🚗" },
  { id: "v2", brand: "Honda", model: "City", plate: "ขค 5678", emoji: "🚙" },
]

const serviceTypes = [
  { id: "maintenance", label: "เช็คระยะ", icon: "🔧" },
  { id: "repair", label: "ซ่อมทั่วไป", icon: "🛠️" },
  { id: "brake", label: "เบรค", icon: "🛞" },
  { id: "oil", label: "เปลี่ยนน้ำมัน", icon: "🛢️" },
  { id: "tire", label: "ยาง", icon: "⭕" },
  { id: "battery", label: "แบตเตอรี่", icon: "🔋" },
  { id: "ac", label: "แอร์", icon: "❄️" },
  { id: "body", label: "ตัวถัง/สี", icon: "🎨" },
  { id: "other", label: "อื่นๆ", icon: "📋" },
]

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
]

const dviRecommendations = [
  { item: "ผ้าเบรคหลัง", note: "เหลือ 40%", urgency: "yellow" },
  { item: "ยางหลัง (ซ้าย-ขวา)", note: "ดอกยาง 3mm", urgency: "yellow" },
  { item: "แบตเตอรี่", note: "แรงดันต่ำ 11.8V", urgency: "red" },
]

const stepLabels = ["เลือกรถ", "ประเภท", "อาการ", "วัน-เวลา", "ยืนยัน"]

function getNextDays(count: number) {
  const days = []
  const today = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push({
      date: d,
      dayName: d.toLocaleDateString("th-TH", { weekday: "short" }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString("th-TH", { month: "short" }),
      isToday: i === 0,
      isSunday: d.getDay() === 0,
    })
  }
  return days
}

export default function BookingPage() {
  const [step, setStep] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [symptoms, setSymptoms] = useState("")
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const days = getNextDays(14)
  const [dateOffset, setDateOffset] = useState(0)
  const visibleDays = days.slice(dateOffset, dateOffset + 7)

  const canNext = () => {
    switch (step) {
      case 0: return selectedVehicle !== null
      case 1: return selectedService !== null
      case 2: return true
      case 3: return selectedDate !== null && selectedTime !== null
      default: return false
    }
  }

  const getVehicle = () => myVehicles.find((v) => v.id === selectedVehicle)
  const getService = () => serviceTypes.find((s) => s.id === selectedService)
  const getDate = () => selectedDate !== null ? days[selectedDate] : null

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/c"
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground">จองคิว</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-6">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "text-[10px]",
                i <= step ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 0: Select Vehicle */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground">เลือกรถของคุณ</h2>
          <div className="space-y-3">
            {myVehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border bg-card text-left transition-all",
                  selectedVehicle === v.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="text-3xl">{v.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {v.brand} {v.model}
                  </p>
                  <p className="text-xs text-muted-foreground">{v.plate}</p>
                </div>
                {selectedVehicle === v.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>

          {/* DVI Recommendations */}
          {selectedVehicle === "v1" && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-medium text-foreground">
                  แนะนำจาก DVI ล่าสุด
                </h3>
              </div>
              <div className="space-y-1.5">
                {dviRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{rec.urgency === "red" ? "🔴" : "🟡"}</span>
                    <span className="text-foreground">{rec.item}</span>
                    <span className="text-muted-foreground text-xs">({rec.note})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Select Service Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground">เลือกประเภทบริการ</h2>
          <div className="grid grid-cols-3 gap-3">
            {serviceTypes.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border bg-card transition-all",
                  selectedService === svc.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span className="text-2xl">{svc.icon}</span>
                <span className="text-xs font-medium text-foreground">{svc.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Describe Symptoms */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground">อธิบายอาการ</h2>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="เช่น เบรคมีเสียงดังเอี๊ยดเวลาเหยียบ, น้ำมันรั่ว..."
            rows={4}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors w-full justify-center">
            <Camera className="h-4 w-4" />
            แนบรูปภาพ
          </button>
          <p className="text-xs text-muted-foreground text-center">
            ไม่จำเป็นต้องกรอก สามารถข้ามขั้นตอนนี้ได้
          </p>
        </div>
      )}

      {/* Step 3: Select Date & Time */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground">เลือกวัน-เวลา</h2>

          {/* Date Picker */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setDateOffset(Math.max(0, dateOffset - 7))}
                disabled={dateOffset === 0}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {visibleDays[0]?.monthName} {visibleDays[0]?.date.getFullYear() ? visibleDays[0]?.date.getFullYear() + 543 : ""}
              </span>
              <button
                onClick={() => setDateOffset(Math.min(7, dateOffset + 7))}
                disabled={dateOffset >= 7}
                className="p-1 rounded hover:bg-muted disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {visibleDays.map((day, i) => {
                const dayIndex = dateOffset + i
                return (
                  <button
                    key={dayIndex}
                    onClick={() => !day.isSunday && setSelectedDate(dayIndex)}
                    disabled={day.isSunday}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-2 rounded-lg text-center transition-colors",
                      day.isSunday && "opacity-30 cursor-not-allowed",
                      selectedDate === dayIndex
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="text-[10px]">{day.dayName}</span>
                    <span className="text-sm font-medium">{day.dayNum}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">เลือกเวลา</h3>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    "py-2 rounded-lg border text-sm font-medium transition-colors",
                    selectedTime === time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Summary & Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground">ยืนยันการจอง</h2>
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">รถ</span>
              <span className="text-sm font-medium text-foreground">
                {getVehicle()?.emoji} {getVehicle()?.brand} {getVehicle()?.model} ({getVehicle()?.plate})
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">ประเภทบริการ</span>
              <span className="text-sm font-medium text-foreground">
                {getService()?.icon} {getService()?.label}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">อาการ</span>
              <span className="text-sm font-medium text-foreground text-right max-w-[60%]">
                {symptoms || "ไม่ได้ระบุ"}
              </span>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">วัน-เวลา</span>
              <span className="text-sm font-medium text-foreground">
                {getDate()
                  ? `${getDate()!.dayNum} ${getDate()!.monthName} | ${selectedTime}`
                  : "-"}
              </span>
            </div>
          </div>

          <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            ยืนยันจองคิว
          </button>
          <p className="text-xs text-muted-foreground text-center">
            ระบบจะส่งการยืนยันผ่าน LINE / SMS
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      {step < 4 && (
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2.5 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              ย้อนกลับ
            </button>
          )}
          <button
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors",
              canNext()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {step === 3 ? "ดูสรุป" : "ถัดไป"}
          </button>
        </div>
      )}
    </div>
  )
}
