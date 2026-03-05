"use client"

import { useState } from "react"
import {
  LayoutGrid,
  List,
  User,
  Car,
  Wrench,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { JobStatus, JobPriority, JobType } from "@/lib/types/database"

interface QueueCard {
  id: string
  jobNumber: string
  customerName: string
  licensePlate: string
  vehicleModel: string
  priority: JobPriority
  jobType: JobType
  technicianName: string
  daysInStatus: number
  status: JobStatus
}

const priorityConfig: Record<JobPriority, { label: string; borderColor: string; badgeClass: string }> = {
  urgent: { label: "ด่วน", borderColor: "border-l-red-500", badgeClass: "bg-error/10 text-error border-error/20" },
  normal: { label: "ปกติ", borderColor: "border-l-blue-500", badgeClass: "bg-info/10 text-info border-info/20" },
  low: { label: "รอได้", borderColor: "border-l-gray-400", badgeClass: "bg-muted text-muted-foreground border-border" },
}

const jobTypeLabels: Record<JobType, string> = {
  repair: "ซ่อม",
  maintenance: "บำรุงรักษา",
  inspection: "ตรวจเช็ค",
  insurance: "ประกัน",
  warranty: "รับประกัน",
  other: "อื่นๆ",
}

const columns: { key: JobStatus; label: string; color: string }[] = [
  { key: "pending", label: "รอดำเนินการ", color: "bg-warning" },
  { key: "in_progress", label: "กำลังซ่อม", color: "bg-info" },
  { key: "quality_check", label: "รอตรวจ QC", color: "bg-purple-500" },
  { key: "waiting_pickup", label: "รอลูกค้ารับ", color: "bg-blue-500" },
  { key: "completed", label: "เสร็จแล้ว", color: "bg-success" },
]

const mockQueueCards: QueueCard[] = [
  // pending
  { id: "1", jobNumber: "JOB-2026-0002", customerName: "สุภาพร จันทร์เจริญ", licensePlate: "ขค 5678", vehicleModel: "Honda Civic", priority: "normal", jobType: "maintenance", technicianName: "-", daysInStatus: 0, status: "pending" },
  { id: "2", jobNumber: "JOB-2026-0006", customerName: "ธนพล สุขสันต์", licensePlate: "กท 2468", vehicleModel: "Toyota Hilux Revo", priority: "normal", jobType: "maintenance", technicianName: "-", daysInStatus: 2, status: "pending" },
  { id: "3", jobNumber: "JOB-2026-0010", customerName: "บริษัท เจริญกิจ จำกัด", licensePlate: "วว 1122", vehicleModel: "Toyota Fortuner", priority: "low", jobType: "maintenance", technicianName: "-", daysInStatus: 4, status: "pending" },
  // in_progress
  { id: "4", jobNumber: "JOB-2026-0001", customerName: "สมชาย วงศ์สวัสดิ์", licensePlate: "กข 1234", vehicleModel: "Toyota Camry", priority: "urgent", jobType: "repair", technicianName: "ช่างวิทย์", daysInStatus: 0, status: "in_progress" },
  { id: "5", jobNumber: "JOB-2026-0004", customerName: "นภาพร แก้วมณี", licensePlate: "ฌญ 3456", vehicleModel: "Mazda 3", priority: "low", jobType: "inspection", technicianName: "ช่างอนันต์", daysInStatus: 1, status: "in_progress" },
  { id: "6", jobNumber: "JOB-2026-0007", customerName: "พิมพ์ใจ รักษ์ดี", licensePlate: "ขง 1357", vehicleModel: "Honda HR-V", priority: "normal", jobType: "repair", technicianName: "ช่างวิทย์", daysInStatus: 3, status: "in_progress" },
  { id: "7", jobNumber: "JOB-2026-0009", customerName: "กัลยา ทองดี", licensePlate: "ฆง 5791", vehicleModel: "MG ZS", priority: "urgent", jobType: "insurance", technicianName: "ช่างอนันต์", daysInStatus: 4, status: "in_progress" },
  // quality_check
  { id: "8", jobNumber: "JOB-2026-0005", customerName: "ประยุทธ์ มั่นคง", licensePlate: "ฎฏ 7890", vehicleModel: "Ford Ranger", priority: "urgent", jobType: "repair", technicianName: "ช่างวิทย์", daysInStatus: 1, status: "quality_check" },
  { id: "9", jobNumber: "JOB-2026-0011", customerName: "สมหมาย ใจดี", licensePlate: "สห 4455", vehicleModel: "Mitsubishi Pajero", priority: "normal", jobType: "repair", technicianName: "ช่างสมศักดิ์", daysInStatus: 2, status: "quality_check" },
  // waiting_pickup
  { id: "10", jobNumber: "JOB-2026-0008", customerName: "อรุณ แสงทอง", licensePlate: "คม 8642", vehicleModel: "Nissan Almera", priority: "low", jobType: "other", technicianName: "ช่างสมศักดิ์", daysInStatus: 1, status: "waiting_pickup" },
  { id: "11", jobNumber: "JOB-2026-0013", customerName: "วรากร พิทักษ์", licensePlate: "วพ 8899", vehicleModel: "Mazda CX-5", priority: "urgent", jobType: "repair", technicianName: "ช่างวิทย์", daysInStatus: 3, status: "waiting_pickup" },
  // completed
  { id: "12", jobNumber: "JOB-2026-0003", customerName: "วิชัย ศรีสุข", licensePlate: "จฉ 9012", vehicleModel: "Isuzu D-Max", priority: "normal", jobType: "insurance", technicianName: "ช่างสมศักดิ์", daysInStatus: 0, status: "completed" },
  { id: "13", jobNumber: "JOB-2026-0012", customerName: "รัตนา ชัยชนะ", licensePlate: "รช 6677", vehicleModel: "Honda City", priority: "low", jobType: "inspection", technicianName: "ช่างอนันต์", daysInStatus: 0, status: "completed" },
]

const statusSteps: JobStatus[] = ["pending", "in_progress", "quality_check", "waiting_pickup", "completed"]

function MiniProgressBar({ status }: { status: JobStatus }) {
  const currentIndex = statusSteps.indexOf(status)
  const progress = ((currentIndex + 1) / statusSteps.length) * 100
  return (
    <div className="h-1 w-full rounded-full bg-muted">
      <div
        className="h-1 rounded-full bg-primary transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default function QueuePage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  function getColumnCards(status: JobStatus) {
    return mockQueueCards.filter((c) => c.status === status)
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="คิวรอ - Queue Board" />

      <div className="p-6 space-y-4">
        {/* View Toggle */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "kanban" | "list")}
        >
          <TabsList>
            <TabsTrigger value="kanban">
              <LayoutGrid className="mr-1.5 h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="mr-1.5 h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          {/* Kanban View */}
          <TabsContent value="kanban">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {columns.map((col) => {
                const cards = getColumnCards(col.key)
                return (
                  <div key={col.key} className="flex flex-col rounded-xl border border-border bg-muted/30">
                    {/* Column Header */}
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", col.color)} />
                        <span className="text-sm font-semibold">{col.label}</span>
                      </div>
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                        {cards.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className={cn(
                            "cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                            "border-l-4",
                            priorityConfig[card.priority].borderColor
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary">
                              {card.jobNumber}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                                priorityConfig[card.priority].badgeClass
                              )}
                            >
                              {card.priority === "urgent" && (
                                <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                              )}
                              {priorityConfig[card.priority].label}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="truncate">{card.customerName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Car className="h-3 w-3" />
                              <span>{card.licensePlate} - {card.vehicleModel}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] font-medium">
                              {jobTypeLabels[card.jobType]}
                            </Badge>
                            {card.technicianName !== "-" && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wrench className="h-3 w-3" />
                                <span>{card.technicianName}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{card.daysInStatus} วัน</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <MiniProgressBar status={card.status} />
                          </div>
                        </div>
                      ))}
                      {cards.length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          ไม่มีงาน
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* List View */}
          <TabsContent value="list">
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่ Job</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>รถ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ช่าง</TableHead>
                    <TableHead>วันในสถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockQueueCards.map((card) => (
                    <TableRow key={card.id} className="cursor-pointer">
                      <TableCell className="font-medium text-primary">
                        {card.jobNumber}
                      </TableCell>
                      <TableCell>{card.customerName}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-xs text-muted-foreground">{card.licensePlate}</div>
                          <div className="text-sm">{card.vehicleModel}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-medium">
                          {jobTypeLabels[card.jobType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                            priorityConfig[card.priority].badgeClass
                          )}
                        >
                          {priorityConfig[card.priority].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {columns.find((c) => c.key === card.status)?.label}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                          {card.technicianName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {card.daysInStatus} วัน
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
