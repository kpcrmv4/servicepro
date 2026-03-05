"use client"

import { useState } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Wrench,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

interface Technician {
  id: string
  name: string
  role: string
  color: string
  busyPercent: number
}

interface ScheduleJob {
  id: string
  jobNumber: string
  vehicle: string
  licensePlate: string
  techId: string
  time: string
  duration: number // hours
  type: "repair" | "maintenance" | "insurance" | "inspection"
}

const technicians: Technician[] = [
  { id: "t1", name: "ช่างวิทย์", role: "ช่างหลัก", color: "bg-blue-500", busyPercent: 85 },
  { id: "t2", name: "ช่างสมศักดิ์", role: "ช่างหลัก", color: "bg-emerald-500", busyPercent: 70 },
  { id: "t3", name: "ช่างอนันต์", role: "ช่างหลัก", color: "bg-amber-500", busyPercent: 60 },
  { id: "t4", name: "ช่างประยุทธ์", role: "ช่างซ่อมตัวถัง", color: "bg-purple-500", busyPercent: 45 },
  { id: "t5", name: "ช่างนพดล", role: "ช่างไฟฟ้า", color: "bg-rose-500", busyPercent: 55 },
  { id: "t6", name: "ช่างธีรพงษ์", role: "ช่างซ่อมทั่วไป", color: "bg-cyan-500", busyPercent: 30 },
]

const weekDays = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
const weekDates = ["3 มี.ค.", "4 มี.ค.", "5 มี.ค.", "6 มี.ค.", "7 มี.ค.", "8 มี.ค.", "9 มี.ค."]

const typeLabels: Record<string, string> = {
  repair: "ซ่อม",
  maintenance: "บำรุงรักษา",
  insurance: "ประกัน",
  inspection: "ตรวจเช็ค",
}

const typeColors: Record<string, string> = {
  repair: "border-l-red-400",
  maintenance: "border-l-blue-400",
  insurance: "border-l-amber-400",
  inspection: "border-l-emerald-400",
}

const scheduleJobs: ScheduleJob[] = [
  // Monday
  { id: "s1", jobNumber: "JOB-0001", vehicle: "Toyota Camry", licensePlate: "กข 1234", techId: "t1", time: "09:00", duration: 4, type: "repair" },
  { id: "s2", jobNumber: "JOB-0002", vehicle: "Honda Civic", licensePlate: "ขค 5678", techId: "t2", time: "10:00", duration: 2, type: "maintenance" },
  { id: "s3", jobNumber: "JOB-0015", vehicle: "Nissan March", licensePlate: "ฉช 4411", techId: "t5", time: "09:00", duration: 3, type: "repair" },
  // Tuesday
  { id: "s4", jobNumber: "JOB-0003", vehicle: "Isuzu D-Max", licensePlate: "จฉ 9012", techId: "t3", time: "08:30", duration: 6, type: "insurance" },
  { id: "s5", jobNumber: "JOB-0004", vehicle: "Mazda 3", licensePlate: "ฌญ 3456", techId: "t1", time: "09:00", duration: 3, type: "inspection" },
  { id: "s6", jobNumber: "JOB-0016", vehicle: "BMW 320d", licensePlate: "ฐณ 7722", techId: "t4", time: "10:00", duration: 5, type: "repair" },
  // Wednesday (today)
  { id: "s7", jobNumber: "JOB-0005", vehicle: "Ford Ranger", licensePlate: "ฎฏ 7890", techId: "t1", time: "08:00", duration: 8, type: "repair" },
  { id: "s8", jobNumber: "JOB-0006", vehicle: "Toyota Hilux", licensePlate: "กท 2468", techId: "t2", time: "09:00", duration: 3, type: "maintenance" },
  { id: "s9", jobNumber: "JOB-0007", vehicle: "Honda HR-V", licensePlate: "ขง 1357", techId: "t3", time: "13:00", duration: 4, type: "repair" },
  { id: "s10", jobNumber: "JOB-0017", vehicle: "MG ZS", licensePlate: "ฆง 5791", techId: "t6", time: "09:00", duration: 2, type: "inspection" },
  // Thursday
  { id: "s11", jobNumber: "JOB-0008", vehicle: "Nissan Almera", licensePlate: "คม 8642", techId: "t4", time: "09:00", duration: 5, type: "repair" },
  { id: "s12", jobNumber: "JOB-0009", vehicle: "MG ZS", licensePlate: "ฆง 5791", techId: "t5", time: "10:00", duration: 3, type: "maintenance" },
  { id: "s13", jobNumber: "JOB-0018", vehicle: "Toyota Yaris", licensePlate: "สห 3344", techId: "t2", time: "08:30", duration: 2, type: "inspection" },
  // Friday
  { id: "s14", jobNumber: "JOB-0010", vehicle: "Toyota Fortuner", licensePlate: "วว 1122", techId: "t1", time: "08:00", duration: 4, type: "maintenance" },
  { id: "s15", jobNumber: "JOB-0011", vehicle: "Mitsubishi Pajero", licensePlate: "ฒณ 4455", techId: "t3", time: "09:00", duration: 6, type: "repair" },
  { id: "s16", jobNumber: "JOB-0019", vehicle: "Suzuki Swift", licensePlate: "ดต 6677", techId: "t6", time: "13:00", duration: 3, type: "maintenance" },
  // Saturday
  { id: "s17", jobNumber: "JOB-0012", vehicle: "Suzuki Swift", licensePlate: "ดต 6677", techId: "t2", time: "09:00", duration: 2, type: "inspection" },
  { id: "s18", jobNumber: "JOB-0013", vehicle: "Hyundai Creta", licensePlate: "ถท 8899", techId: "t1", time: "09:00", duration: 5, type: "repair" },
  // Sunday
  { id: "s19", jobNumber: "JOB-0014", vehicle: "Kia Seltos", licensePlate: "บผ 2233", techId: "t3", time: "10:00", duration: 3, type: "insurance" },
]

// Map day index (0=Mon) to jobs
function getJobsForDay(dayIndex: number): ScheduleJob[] {
  const dayJobMap: Record<number, string[]> = {
    0: ["s1", "s2", "s3"],
    1: ["s4", "s5", "s6"],
    2: ["s7", "s8", "s9", "s10"],
    3: ["s11", "s12", "s13"],
    4: ["s14", "s15", "s16"],
    5: ["s17", "s18"],
    6: ["s19"],
  }
  const ids = dayJobMap[dayIndex] || []
  return scheduleJobs.filter((j) => ids.includes(j.id))
}

export default function PlanningPage() {
  const [selectedTech, setSelectedTech] = useState<string | null>(null)

  const getTechColor = (techId: string) => {
    return technicians.find((t) => t.id === techId)?.color || "bg-gray-500"
  }

  const getTechName = (techId: string) => {
    return technicians.find((t) => t.id === techId)?.name || "-"
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="ตารางงาน"
        description="จัดตารางซ่อมและมอบหมายงาน"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">3 - 9 มี.ค. 2569</span>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 gap-6 p-6">
        {/* Left: Technician list */}
        <div className="w-64 shrink-0 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">ช่างเทคนิค</h3>
          {technicians.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
              className={cn(
                "w-full rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50",
                selectedTech === tech.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                    tech.color
                  )}
                >
                  {tech.name.slice(4, 6)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-card-foreground truncate">{tech.name}</div>
                  <div className="text-xs text-muted-foreground">{tech.role}</div>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>ภาระงาน</span>
                  <span>{tech.busyPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      tech.busyPercent >= 80
                        ? "bg-error"
                        : tech.busyPercent >= 60
                        ? "bg-warning"
                        : "bg-success"
                    )}
                    style={{ width: `${tech.busyPercent}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right: Weekly calendar */}
        <div className="flex-1 overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-7 gap-2">
            {weekDays.map((day, idx) => (
              <div key={day} className="flex flex-col">
                {/* Day header */}
                <div
                  className={cn(
                    "mb-2 rounded-lg px-3 py-2 text-center",
                    idx === 2
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <div className="text-xs font-medium">{day}</div>
                  <div className="text-sm font-bold">{weekDates[idx]}</div>
                </div>

                {/* Jobs for this day */}
                <div className="space-y-2">
                  {getJobsForDay(idx)
                    .filter((job) => !selectedTech || job.techId === selectedTech)
                    .map((job) => (
                      <div
                        key={job.id}
                        className={cn(
                          "rounded-lg border border-border bg-card p-2.5 border-l-4 cursor-pointer hover:shadow-md transition-shadow",
                          typeColors[job.type]
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-primary">
                            {job.jobNumber}
                          </span>
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            {typeLabels[job.type]}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-card-foreground truncate">
                          {job.vehicle}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {job.licensePlate}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white",
                              getTechColor(job.techId)
                            )}
                          >
                            {getTechName(job.techId).slice(4, 5)}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {getTechName(job.techId)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {job.time} ({job.duration} ชม.)
                        </div>
                      </div>
                    ))}
                  {getJobsForDay(idx).filter(
                    (job) => !selectedTech || job.techId === selectedTech
                  ).length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                      ว่าง
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">ประเภทงาน:</span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border-l-4 border-l-red-400 bg-muted" /> ซ่อม
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border-l-4 border-l-blue-400 bg-muted" /> บำรุงรักษา
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border-l-4 border-l-amber-400 bg-muted" /> ประกัน
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded border-l-4 border-l-emerald-400 bg-muted" /> ตรวจเช็ค
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
