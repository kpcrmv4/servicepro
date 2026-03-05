"use client"

import {
  DollarSign,
  Wrench,
  Clock,
  UserPlus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Car,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

const kpiCards = [
  {
    title: "รายรับวันนี้",
    value: formatCurrency(45200),
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    title: "งานวันนี้",
    value: "8",
    change: "+2 จากเมื่อวาน",
    trend: "up" as const,
    icon: Wrench,
    color: "text-primary",
    bg: "bg-primary-100",
  },
  {
    title: "งานค้าง",
    value: "5",
    change: "-1 จากเมื่อวาน",
    trend: "down" as const,
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning-light",
  },
  {
    title: "ลูกค้าใหม่เดือนนี้",
    value: "24",
    change: "+8.3%",
    trend: "up" as const,
    icon: UserPlus,
    color: "text-info",
    bg: "bg-info-light",
  },
]

const todayJobs = [
  { id: "JOB-2024-0142", customer: "คุณสมชาย ดีใจ", vehicle: "Toyota Camry 2022", type: "เช็คระยะ", status: "กำลังซ่อม", tech: "ช่างวิชัย", color: "bg-primary" },
  { id: "JOB-2024-0143", customer: "คุณสุภา แก้วใส", vehicle: "Honda Civic 2021", type: "ซ่อมเบรค", status: "รอตรวจ QC", tech: "ช่างสมศักดิ์", color: "bg-warning" },
  { id: "JOB-2024-0144", customer: "คุณธนา วิริยะ", vehicle: "Mazda CX-5 2023", type: "งานสี", status: "รอดำเนินการ", tech: "ยังไม่กำหนด", color: "bg-muted-foreground" },
  { id: "JOB-2024-0145", customer: "บ.ABC จำกัด", vehicle: "Isuzu D-Max 2020", type: "ซ่อมเครื่อง", status: "กำลังซ่อม", tech: "ช่างประยุทธ์", color: "bg-primary" },
  { id: "JOB-2024-0146", customer: "คุณนภา สวัสดี", vehicle: "Toyota Yaris 2019", type: "เปลี่ยนน้ำมัน", status: "รอลูกค้ารับ", tech: "ช่างวิชัย", color: "bg-success" },
]

const lowStockParts = [
  { name: "ผ้าเบรค Toyota (หน้า)", stock: 2, min: 5, sku: "BRK-TY-001" },
  { name: "น้ำมันเครื่อง 5W-30 (4L)", stock: 3, min: 10, sku: "OIL-5W30-4L" },
  { name: "กรองอากาศ Honda", stock: 1, min: 5, sku: "FLT-HD-AIR" },
  { name: "หัวเทียน NGK (4 ชิ้น)", stock: 4, min: 8, sku: "SPK-NGK-4P" },
]

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold">{card.value}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", card.bg)}>
                  <Icon className={cn("h-6 w-6", card.color)} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs">
                {card.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-success" />
                )}
                <span className="text-success">{card.change}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">รายรับ 7 วันย้อนหลัง</h2>
          <div className="mt-4 flex h-64 items-end gap-2">
            {[32, 45, 28, 55, 42, 38, 45].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    i === 6 ? "bg-primary" : "bg-primary/30"
                  )}
                  style={{ height: `${(h / 55) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Job Status Donut */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">สถานะงาน</h2>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-primary" strokeWidth="3" strokeDasharray="35 65" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-warning" strokeWidth="3" strokeDasharray="25 75" strokeDashoffset="-35" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-success" strokeWidth="3" strokeDasharray="20 80" strokeDashoffset="-60" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-error" strokeWidth="3" strokeDasharray="10 90" strokeDashoffset="-80" />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold">42</p>
                <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "กำลังซ่อม", count: 15, color: "bg-primary" },
                { label: "รอดำเนินการ", count: 10, color: "bg-warning" },
                { label: "เสร็จแล้ว", count: 8, color: "bg-success" },
                { label: "รอลูกค้ารับ", count: 5, color: "bg-info" },
                { label: "ยกเลิก", count: 4, color: "bg-error" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <div className={cn("h-3 w-3 rounded-full", item.color)} />
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Jobs */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">งานวันนี้</h2>
            <span className="text-sm text-muted-foreground">{todayJobs.length} งาน</span>
          </div>
          <div className="divide-y divide-border">
            {todayJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className={cn("h-2 w-2 rounded-full shrink-0", job.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{job.id}</span>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{job.customer}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Car className="h-3 w-3" />
                    <span className="truncate">{job.vehicle}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium">{job.status}</p>
                  <p className="text-[10px] text-muted-foreground">{job.tech}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Parts */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">อะไหล่ใกล้หมด</h2>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="divide-y divide-border">
            {lowStockParts.map((part) => (
              <div key={part.sku} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{part.name}</p>
                  <p className="text-xs text-muted-foreground">{part.sku}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    part.stock <= 2 ? "text-error" : "text-warning"
                  )}>
                    เหลือ {part.stock}
                  </p>
                  <p className="text-[10px] text-muted-foreground">ขั้นต่ำ {part.min}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-3">
            <button className="text-sm text-primary hover:underline">ดูทั้งหมด →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
