"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Wrench,
  Zap,
  Car,
  Settings,
  Star,
  ClipboardCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type EmployeeStatus = "available" | "working" | "leave"
type EmployeeRole = "ช่างหลัก" | "ช่างซ่อมตัวถัง" | "ช่างไฟฟ้า" | "ช่างซ่อมทั่วไป" | "ช่างแอร์" | "พนักงานรับรถ"

interface Employee {
  id: string
  name: string
  role: EmployeeRole
  status: EmployeeStatus
  jobsThisMonth: number
  qcScore: number
  avgReview: number
  skills: string[]
  color: string
}

const statusConfig: Record<EmployeeStatus, { label: string; dotColor: string }> = {
  available: { label: "ว่าง", dotColor: "bg-success" },
  working: { label: "กำลังซ่อม", dotColor: "bg-warning" },
  leave: { label: "ลา", dotColor: "bg-error" },
}

const roleColors: Record<EmployeeRole, string> = {
  "ช่างหลัก": "bg-blue-100 text-blue-700",
  "ช่างซ่อมตัวถัง": "bg-purple-100 text-purple-700",
  "ช่างไฟฟ้า": "bg-amber-100 text-amber-700",
  "ช่างซ่อมทั่วไป": "bg-cyan-100 text-cyan-700",
  "ช่างแอร์": "bg-teal-100 text-teal-700",
  "พนักงานรับรถ": "bg-rose-100 text-rose-700",
}

const mockEmployees: Employee[] = [
  {
    id: "E01", name: "วิทยา สมบูรณ์", role: "ช่างหลัก", status: "working",
    jobsThisMonth: 12, qcScore: 96, avgReview: 4.8,
    skills: ["เครื่องยนต์", "เกียร์", "ระบบฉีด"],
    color: "bg-blue-500",
  },
  {
    id: "E02", name: "สมศักดิ์ แก้วใส", role: "ช่างหลัก", status: "working",
    jobsThisMonth: 10, qcScore: 92, avgReview: 4.6,
    skills: ["เครื่องยนต์", "ช่วงล่าง", "เบรก"],
    color: "bg-emerald-500",
  },
  {
    id: "E03", name: "อนันต์ พิทักษ์", role: "ช่างหลัก", status: "available",
    jobsThisMonth: 8, qcScore: 88, avgReview: 4.5,
    skills: ["เครื่องยนต์", "ระบบระบาย", "ท่อไอเสีย"],
    color: "bg-amber-500",
  },
  {
    id: "E04", name: "ประยุทธ์ ทรงศิลป์", role: "ช่างซ่อมตัวถัง", status: "working",
    jobsThisMonth: 6, qcScore: 94, avgReview: 4.7,
    skills: ["ตัวถัง", "ทำสี", "เคาะพ่นสี"],
    color: "bg-purple-500",
  },
  {
    id: "E05", name: "นพดล ฉายแสง", role: "ช่างไฟฟ้า", status: "available",
    jobsThisMonth: 9, qcScore: 90, avgReview: 4.4,
    skills: ["ไฟฟ้า", "ระบบชาร์จ", "แอร์", "เซ็นเซอร์"],
    color: "bg-rose-500",
  },
  {
    id: "E06", name: "ธีรพงษ์ มานะ", role: "ช่างซ่อมทั่วไป", status: "available",
    jobsThisMonth: 7, qcScore: 85, avgReview: 4.3,
    skills: ["เบรก", "ช่วงล่าง", "ยาง", "น้ำมัน"],
    color: "bg-cyan-500",
  },
  {
    id: "E07", name: "วิโรจน์ สุขสำราญ", role: "ช่างแอร์", status: "leave",
    jobsThisMonth: 5, qcScore: 91, avgReview: 4.5,
    skills: ["แอร์", "ระบบทำความเย็น", "ไฟฟ้า"],
    color: "bg-teal-500",
  },
  {
    id: "E08", name: "ชัยวัฒน์ เจริญสุข", role: "ช่างซ่อมทั่วไป", status: "working",
    jobsThisMonth: 11, qcScore: 87, avgReview: 4.2,
    skills: ["เครื่องยนต์", "เบรก", "น้ำมัน", "กรอง"],
    color: "bg-indigo-500",
  },
  {
    id: "E09", name: "ปิยะ รุ่งโรจน์", role: "พนักงานรับรถ", status: "available",
    jobsThisMonth: 35, qcScore: 95, avgReview: 4.9,
    skills: ["รับรถ", "ประเมินราคา", "ลูกค้าสัมพันธ์"],
    color: "bg-rose-400",
  },
  {
    id: "E10", name: "สุนิสา ทองอ่อน", role: "พนักงานรับรถ", status: "available",
    jobsThisMonth: 30, qcScore: 97, avgReview: 4.8,
    skills: ["รับรถ", "ใบเสนอราคา", "ลูกค้าสัมพันธ์", "ประกัน"],
    color: "bg-pink-400",
  },
]

export default function EmployeesPage() {
  const [search, setSearch] = useState("")

  const filtered = mockEmployees.filter((e) => {
    if (!search) return true
    const s = search.toLowerCase()
    return e.name.toLowerCase().includes(s) || e.role.includes(s) || e.skills.some((sk) => sk.includes(s))
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="พนักงาน"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มพนักงาน
          </button>
        }
      />

      {/* Search */}
      <div className="px-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, ตำแหน่ง หรือทักษะ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white",
                    emp.color
                  )}
                >
                  {emp.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{emp.name}</h3>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", roleColors[emp.role])}>
                    {emp.role}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", statusConfig[emp.status].dotColor)} />
                <span className="text-xs text-muted-foreground">{statusConfig[emp.status].label}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Wrench className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">งาน</span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-card-foreground">{emp.jobsThisMonth}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">QC</span>
                </div>
                <p className={cn(
                  "mt-0.5 text-sm font-bold",
                  emp.qcScore >= 90 ? "text-success" : emp.qcScore >= 80 ? "text-warning" : "text-error"
                )}>
                  {emp.qcScore}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">รีวิว</span>
                </div>
                <p className="mt-0.5 text-sm font-bold text-card-foreground">{emp.avgReview}</p>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {emp.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            ไม่พบพนักงานที่ค้นหา
          </div>
        )}
      </div>
    </div>
  )
}
