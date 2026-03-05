"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Calendar,
  User,
  Car,
  Wrench,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateShort, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface JobItem {
  id: string
  jobNumber: string
  customerName: string
  vehicle: string
  licensePlate: string
  jobType: JobType
  priority: JobPriority
  status: JobStatus
  technicianName: string
  receivedDate: string
  estimatedCompletion: string
  grandTotal: number
}

const mockJobs: JobItem[] = [
  { id: "1", jobNumber: "JOB-2026-0001", customerName: "สมชาย วงศ์สวัสดิ์", vehicle: "Toyota Camry", licensePlate: "กข 1234", jobType: "repair", priority: "urgent", status: "in_progress", technicianName: "ช่างวิทย์", receivedDate: "2026-03-05", estimatedCompletion: "2026-03-07", grandTotal: 15800 },
  { id: "2", jobNumber: "JOB-2026-0002", customerName: "สุภาพร จันทร์เจริญ", vehicle: "Honda Civic", licensePlate: "ขค 5678", jobType: "maintenance", priority: "normal", status: "pending", technicianName: "-", receivedDate: "2026-03-05", estimatedCompletion: "2026-03-06", grandTotal: 4500 },
  { id: "3", jobNumber: "JOB-2026-0003", customerName: "วิชัย ศรีสุข", vehicle: "Isuzu D-Max", licensePlate: "จฉ 9012", jobType: "insurance", priority: "normal", status: "completed", technicianName: "ช่างสมศักดิ์", receivedDate: "2026-03-04", estimatedCompletion: "2026-03-05", grandTotal: 42000 },
  { id: "4", jobNumber: "JOB-2026-0004", customerName: "นภาพร แก้วมณี", vehicle: "Mazda 3", licensePlate: "ฌญ 3456", jobType: "inspection", priority: "low", status: "in_progress", technicianName: "ช่างอนันต์", receivedDate: "2026-03-04", estimatedCompletion: "2026-03-04", grandTotal: 1500 },
  { id: "5", jobNumber: "JOB-2026-0005", customerName: "ประยุทธ์ มั่นคง", vehicle: "Ford Ranger", licensePlate: "ฎฏ 7890", jobType: "repair", priority: "urgent", status: "quality_check", technicianName: "ช่างวิทย์", receivedDate: "2026-03-03", estimatedCompletion: "2026-03-05", grandTotal: 28500 },
  { id: "6", jobNumber: "JOB-2026-0006", customerName: "ธนพล สุขสันต์", vehicle: "Toyota Hilux Revo", licensePlate: "กท 2468", jobType: "maintenance", priority: "normal", status: "pending", technicianName: "-", receivedDate: "2026-03-03", estimatedCompletion: "2026-03-04", grandTotal: 6200 },
  { id: "7", jobNumber: "JOB-2026-0007", customerName: "พิมพ์ใจ รักษ์ดี", vehicle: "Honda HR-V", licensePlate: "ขง 1357", jobType: "repair", priority: "normal", status: "in_progress", technicianName: "ช่างวิทย์", receivedDate: "2026-03-02", estimatedCompletion: "2026-03-04", grandTotal: 12300 },
  { id: "8", jobNumber: "JOB-2026-0008", customerName: "อรุณ แสงทอง", vehicle: "Nissan Almera", licensePlate: "คม 8642", jobType: "other", priority: "low", status: "waiting_pickup", technicianName: "ช่างสมศักดิ์", receivedDate: "2026-03-02", estimatedCompletion: "2026-03-03", grandTotal: 8900 },
  { id: "9", jobNumber: "JOB-2026-0009", customerName: "กัลยา ทองดี", vehicle: "MG ZS", licensePlate: "ฆง 5791", jobType: "insurance", priority: "urgent", status: "in_progress", technicianName: "ช่างอนันต์", receivedDate: "2026-03-01", estimatedCompletion: "2026-03-05", grandTotal: 55000 },
  { id: "10", jobNumber: "JOB-2026-0010", customerName: "บริษัท เจริญกิจ จำกัด", vehicle: "Toyota Fortuner", licensePlate: "วว 1122", jobType: "maintenance", priority: "normal", status: "pending", technicianName: "-", receivedDate: "2026-03-01", estimatedCompletion: "2026-03-02", grandTotal: 7800 },
  { id: "11", jobNumber: "JOB-2026-0011", customerName: "สมหมาย ใจดี", vehicle: "Mitsubishi Pajero", licensePlate: "สห 4455", jobType: "repair", priority: "normal", status: "quality_check", technicianName: "ช่างสมศักดิ์", receivedDate: "2026-02-28", estimatedCompletion: "2026-03-02", grandTotal: 19500 },
  { id: "12", jobNumber: "JOB-2026-0012", customerName: "รัตนา ชัยชนะ", vehicle: "Honda City", licensePlate: "รช 6677", jobType: "inspection", priority: "low", status: "completed", technicianName: "ช่างอนันต์", receivedDate: "2026-02-28", estimatedCompletion: "2026-02-28", grandTotal: 1200 },
  { id: "13", jobNumber: "JOB-2026-0013", customerName: "วรากร พิทักษ์", vehicle: "Mazda CX-5", licensePlate: "วพ 8899", jobType: "repair", priority: "urgent", status: "waiting_pickup", technicianName: "ช่างวิทย์", receivedDate: "2026-02-27", estimatedCompletion: "2026-03-01", grandTotal: 35200 },
]

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: { label: "รอดำเนินการ", className: "bg-warning/10 text-warning border-warning/20" },
  in_progress: { label: "กำลังซ่อม", className: "bg-info/10 text-info border-info/20" },
  quality_check: { label: "รอตรวจ QC", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  waiting_pickup: { label: "รอลูกค้ารับ", className: "bg-info/10 text-info border-info/20" },
  completed: { label: "เสร็จแล้ว", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "ยกเลิก", className: "bg-error/10 text-error border-error/20" },
}

const priorityConfig: Record<JobPriority, { label: string; className: string }> = {
  urgent: { label: "ด่วน", className: "bg-error/10 text-error border-error/20" },
  normal: { label: "ปกติ", className: "bg-info/10 text-info border-info/20" },
  low: { label: "รอได้", className: "bg-muted text-muted-foreground border-border" },
}

const jobTypeLabels: Record<JobType, string> = {
  repair: "ซ่อม",
  maintenance: "บำรุงรักษา",
  inspection: "ตรวจเช็ค",
  insurance: "ประกัน",
  warranty: "รับประกัน",
  other: "อื่นๆ",
}

const statusSteps: JobStatus[] = ["pending", "in_progress", "quality_check", "waiting_pickup", "completed"]

function StatusDots({ currentStatus }: { currentStatus: JobStatus }) {
  const currentIndex = statusSteps.indexOf(currentStatus)
  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, i) => (
        <div
          key={step}
          className={cn(
            "h-2 w-2 rounded-full",
            i <= currentIndex ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

const tabFilters: { value: string; label: string; filterStatus?: JobStatus }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "in_progress", label: "กำลังซ่อม", filterStatus: "in_progress" },
  { value: "pending", label: "รอดำเนินการ", filterStatus: "pending" },
  { value: "quality_check", label: "รอตรวจ QC", filterStatus: "quality_check" },
  { value: "waiting_pickup", label: "รอลูกค้ารับ", filterStatus: "waiting_pickup" },
  { value: "completed", label: "เสร็จแล้ว", filterStatus: "completed" },
]

export default function JobsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  function getFilteredJobs(tabValue: string) {
    return mockJobs.filter((job) => {
      const matchSearch =
        !searchQuery ||
        job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())

      const tab = tabFilters.find((t) => t.value === tabValue)
      const matchStatus = !tab?.filterStatus || job.status === tab.filterStatus

      return matchSearch && matchStatus
    })
  }

  function renderJobTable(jobs: JobItem[]) {
    return (
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
              <TableHead>วันที่รับ</TableHead>
              <TableHead>กำหนดเสร็จ</TableHead>
              <TableHead className="text-right">ยอดรวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow
                key={job.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
              >
                <TableCell className="font-medium text-primary">
                  {job.jobNumber}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[120px] truncate">{job.customerName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="text-xs text-muted-foreground">{job.licensePlate}</div>
                    <div className="text-sm">{job.vehicle}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-medium">
                    {jobTypeLabels[job.jobType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                      priorityConfig[job.priority].className
                    )}
                  >
                    {job.priority === "urgent" && <AlertTriangle className="mr-1 h-3 w-3" />}
                    {priorityConfig[job.priority].label}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        statusConfig[job.status].className
                      )}
                    >
                      {statusConfig[job.status].label}
                    </span>
                    <StatusDots currentStatus={job.status} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{job.technicianName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateShort(job.receivedDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateShort(job.estimatedCompletion)}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(job.grandTotal)}
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="จัดการงานซ่อม"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            สร้าง Job Order
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหา Job, ลูกค้า, ทะเบียน..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            {tabFilters.map((tab) => {
              const count = getFilteredJobs(tab.value).length
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                    {count}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {tabFilters.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {renderJobTable(getFilteredJobs(tab.value))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
