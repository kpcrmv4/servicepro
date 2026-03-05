"use client"

import { use, useState } from "react"
import Link from "next/link"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import {
  ArrowLeft,
  Gauge,
  Wrench,
  ClipboardCheck,
  CalendarClock,
  FileText,
  Camera,
  Download,
  PenLine,
} from "lucide-react"

const vehicleData: Record<string, {
  plate: string
  brand: string
  model: string
  year: number
  color: string
  mileage: number
  healthScore: number
}> = {
  v1: {
    plate: "กข 1234",
    brand: "Toyota",
    model: "Camry",
    year: 2022,
    color: "ขาว",
    mileage: 29850,
    healthScore: 85,
  },
  v2: {
    plate: "ขค 5678",
    brand: "Honda",
    model: "City",
    year: 2021,
    color: "ดำ",
    mileage: 45200,
    healthScore: 62,
  },
}

const serviceRecords = [
  {
    id: "SR-001",
    date: "2026-02-15",
    mileage: 29850,
    items: ["เปลี่ยนผ้าเบรคหน้า", "เปลี่ยนน้ำมันเบรค"],
    cost: 4500,
  },
  {
    id: "SR-002",
    date: "2025-11-20",
    mileage: 25000,
    items: ["เช็คระยะ 25,000 km", "เปลี่ยนน้ำมันเครื่อง", "เปลี่ยนกรองอากาศ"],
    cost: 3200,
  },
  {
    id: "SR-003",
    date: "2025-08-10",
    mileage: 20000,
    items: ["เช็คระยะ 20,000 km", "เปลี่ยนน้ำมันเครื่อง"],
    cost: 2800,
  },
  {
    id: "SR-004",
    date: "2025-04-05",
    mileage: 15000,
    items: ["เช็คระยะ 15,000 km", "เปลี่ยนน้ำมันเครื่อง", "เปลี่ยนหัวเทียน"],
    cost: 3800,
  },
  {
    id: "SR-005",
    date: "2024-12-18",
    mileage: 10000,
    items: ["เช็คระยะ 10,000 km", "เปลี่ยนน้ำมันเครื่อง"],
    cost: 2500,
  },
]

const dviItems = [
  { name: "ผ้าเบรคหน้า", status: "green" as const, note: "เปลี่ยนใหม่" },
  { name: "ผ้าเบรคหลัง", status: "yellow" as const, note: "เหลือ 40% ควรเปลี่ยนภายใน 5,000 km" },
  { name: "น้ำมันเครื่อง", status: "green" as const, note: "เปลี่ยนใหม่" },
  { name: "กรองอากาศ", status: "green" as const, note: "สภาพดี" },
  { name: "ยางหน้าซ้าย", status: "green" as const, note: "ดอกยาง 5mm" },
  { name: "ยางหน้าขวา", status: "green" as const, note: "ดอกยาง 5mm" },
  { name: "ยางหลังซ้าย", status: "yellow" as const, note: "ดอกยาง 3mm ควรเปลี่ยนเร็วๆ นี้" },
  { name: "ยางหลังขวา", status: "yellow" as const, note: "ดอกยาง 3mm ควรเปลี่ยนเร็วๆ นี้" },
  { name: "แบตเตอรี่", status: "red" as const, note: "แรงดัน 11.8V ต่ำกว่ามาตรฐาน ควรเปลี่ยน" },
  { name: "น้ำยาแอร์", status: "green" as const, note: "ปกติ" },
  { name: "ใบปัดน้ำฝน", status: "yellow" as const, note: "เริ่มมีรอยขีด" },
  { name: "ไฟหน้า-หลัง", status: "green" as const, note: "ปกติ" },
]

const upcomingMaintenance = [
  { name: "เช็คระยะ 30,000 km", due: "อีก 150 km", urgency: "warning" as const },
  { name: "เปลี่ยนน้ำมันเครื่อง", due: "อีก 2 เดือน", urgency: "normal" as const },
  { name: "ต่อ พ.ร.บ.", due: "หมด 30 มิ.ย. 2569", urgency: "normal" as const },
  { name: "เปลี่ยนยางหลัง", due: "แนะนำเปลี่ยนเร็วๆ นี้", urgency: "warning" as const },
  { name: "เปลี่ยนแบตเตอรี่", due: "แนะนำเปลี่ยนทันที", urgency: "error" as const },
]

const documents = [
  { type: "ใบเสนอราคา", id: "QT-2026-0089", date: "2026-02-14", amount: 4500 },
  { type: "ใบแจ้งหนี้", id: "INV-2026-0076", date: "2026-02-15", amount: 4500 },
  { type: "ใบเสร็จรับเงิน", id: "RC-2026-0076", date: "2026-02-15", amount: 4500 },
  { type: "ใบเสนอราคา", id: "QT-2025-0301", date: "2025-11-19", amount: 3200 },
  { type: "ใบเสร็จรับเงิน", id: "RC-2025-0290", date: "2025-11-20", amount: 3200 },
]

const statusIcon: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
}

const tabs = [
  { key: "service", label: "สมุดซ่อม", icon: Wrench },
  { key: "dvi", label: "ตรวจสภาพ", icon: ClipboardCheck },
  { key: "schedule", label: "กำหนดการ", icon: CalendarClock },
  { key: "docs", label: "เอกสาร", icon: FileText },
]

function HealthScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-error"
  const strokeColor =
    score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-error"

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={strokeColor}
        />
      </svg>
      <div className={cn("absolute flex flex-col items-center", color)}>
        <span className="text-xl font-bold">{score}</span>
        <span className="text-[10px] -mt-1">/100</span>
      </div>
    </div>
  )
}

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("service")
  const vehicle = vehicleData[id] || vehicleData["v1"]

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-3 pb-4">
        <Link
          href="/c"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Link>

        <div className="flex items-center gap-4">
          <HealthScoreCircle score={vehicle.healthScore} />
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-sm text-muted-foreground">
              ทะเบียน {vehicle.plate} | ปี {vehicle.year} | สี{vehicle.color}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {vehicle.mileage.toLocaleString()} km
              </span>
            </div>
          </div>
        </div>

        <button className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <PenLine className="h-4 w-4" />
          อัพเดทเลขไมล์
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-2">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        {/* Service Book Tab */}
        {activeTab === "service" && (
          <div className="space-y-0">
            {serviceRecords.map((record, index) => (
              <div key={record.id} className="relative pl-6 pb-6 last:pb-0">
                {index < serviceRecords.length - 1 && (
                  <div className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />
                )}
                <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-card" />

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDateShort(record.date)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {record.mileage.toLocaleString()} km
                    </span>
                  </div>
                  <ul className="space-y-0.5 mb-2">
                    {record.items.map((item, i) => (
                      <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                        <Wrench className="h-3 w-3 mt-1 text-muted-foreground shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="text-sm font-medium text-primary">
                    {formatCurrency(record.cost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DVI Report Tab */}
        {activeTab === "dvi" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">รายงานตรวจสภาพ (DVI)</h3>
                <p className="text-xs text-muted-foreground">ตรวจเมื่อ 15 ก.พ. 2569</p>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>🟢 {dviItems.filter((i) => i.status === "green").length}</span>
                <span>🟡 {dviItems.filter((i) => i.status === "yellow").length}</span>
                <span>🔴 {dviItems.filter((i) => i.status === "red").length}</span>
              </div>
            </div>

            <div className="space-y-2">
              {dviItems.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl border bg-card",
                    item.status === "red"
                      ? "border-error/30"
                      : item.status === "yellow"
                        ? "border-warning/30"
                        : "border-border"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{statusIcon[item.status]}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center gap-2">
              <Camera className="h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">รูปภาพตรวจสภาพจะแสดงที่นี่</p>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-1">การบำรุงรักษาที่กำลังจะถึง</h3>
            {upcomingMaintenance.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl border bg-card flex items-center justify-between",
                  item.urgency === "error"
                    ? "border-error/30"
                    : item.urgency === "warning"
                      ? "border-warning/30"
                      : "border-border"
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p
                    className={cn(
                      "text-xs mt-0.5",
                      item.urgency === "error"
                        ? "text-error"
                        : item.urgency === "warning"
                          ? "text-warning"
                          : "text-muted-foreground"
                    )}
                  >
                    {item.due}
                  </p>
                </div>
                <Link
                  href="/c/booking"
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  จองคิว
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === "docs" && (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-border bg-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.id} | {formatDateShort(doc.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(doc.amount)}
                  </span>
                  <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
