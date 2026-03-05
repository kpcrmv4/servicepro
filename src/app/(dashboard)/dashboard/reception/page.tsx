"use client"

import { useState } from "react"
import { Search, Plus, Car, User, Calendar, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { VehicleCheckinForm } from "@/components/forms/vehicle-checkin-form"
import type { JobStatus, JobType } from "@/lib/types/database"

interface CheckinItem {
  id: string
  jobNumber: string
  customerName: string
  licensePlate: string
  vehicleModel: string
  jobType: JobType
  receivedDate: string
  status: JobStatus
  technicianName: string
}

const mockCheckins: CheckinItem[] = [
  {
    id: "1",
    jobNumber: "JOB-2026-0001",
    customerName: "สมชาย วงศ์สวัสดิ์",
    licensePlate: "กข 1234",
    vehicleModel: "Toyota Camry",
    jobType: "repair",
    receivedDate: "2026-03-05",
    status: "in_progress",
    technicianName: "ช่างวิทย์",
  },
  {
    id: "2",
    jobNumber: "JOB-2026-0002",
    customerName: "สุภาพร จันทร์เจริญ",
    licensePlate: "ขค 5678",
    vehicleModel: "Honda Civic",
    jobType: "maintenance",
    receivedDate: "2026-03-05",
    status: "pending",
    technicianName: "-",
  },
  {
    id: "3",
    jobNumber: "JOB-2026-0003",
    customerName: "วิชัย ศรีสุข",
    licensePlate: "จฉ 9012",
    vehicleModel: "Isuzu D-Max",
    jobType: "insurance",
    receivedDate: "2026-03-04",
    status: "completed",
    technicianName: "ช่างสมศักดิ์",
  },
  {
    id: "4",
    jobNumber: "JOB-2026-0004",
    customerName: "นภาพร แก้วมณี",
    licensePlate: "ฌญ 3456",
    vehicleModel: "Mazda 3",
    jobType: "inspection",
    receivedDate: "2026-03-04",
    status: "in_progress",
    technicianName: "ช่างอนันต์",
  },
  {
    id: "5",
    jobNumber: "JOB-2026-0005",
    customerName: "ประยุทธ์ มั่นคง",
    licensePlate: "ฎฏ 7890",
    vehicleModel: "Ford Ranger",
    jobType: "repair",
    receivedDate: "2026-03-03",
    status: "cancelled",
    technicianName: "-",
  },
  {
    id: "6",
    jobNumber: "JOB-2026-0006",
    customerName: "ธนพล สุขสันต์",
    licensePlate: "กท 2468",
    vehicleModel: "Toyota Hilux Revo",
    jobType: "maintenance",
    receivedDate: "2026-03-03",
    status: "pending",
    technicianName: "-",
  },
  {
    id: "7",
    jobNumber: "JOB-2026-0007",
    customerName: "พิมพ์ใจ รักษ์ดี",
    licensePlate: "ขง 1357",
    vehicleModel: "Honda HR-V",
    jobType: "repair",
    receivedDate: "2026-03-02",
    status: "in_progress",
    technicianName: "ช่างวิทย์",
  },
  {
    id: "8",
    jobNumber: "JOB-2026-0008",
    customerName: "อรุณ แสงทอง",
    licensePlate: "คม 8642",
    vehicleModel: "Nissan Almera",
    jobType: "other",
    receivedDate: "2026-03-02",
    status: "completed",
    technicianName: "ช่างสมศักดิ์",
  },
  {
    id: "9",
    jobNumber: "JOB-2026-0009",
    customerName: "กัลยา ทองดี",
    licensePlate: "ฆง 5791",
    vehicleModel: "MG ZS",
    jobType: "insurance",
    receivedDate: "2026-03-01",
    status: "in_progress",
    technicianName: "ช่างอนันต์",
  },
  {
    id: "10",
    jobNumber: "JOB-2026-0010",
    customerName: "บริษัท เจริญกิจ จำกัด",
    licensePlate: "วว 1122",
    vehicleModel: "Toyota Fortuner",
    jobType: "maintenance",
    receivedDate: "2026-03-01",
    status: "pending",
    technicianName: "-",
  },
]

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending: {
    label: "รอดำเนินการ",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  in_progress: {
    label: "กำลังซ่อม",
    className: "bg-info/10 text-info border-info/20",
  },
  quality_check: {
    label: "รอตรวจ QC",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  waiting_pickup: {
    label: "รอลูกค้ารับ",
    className: "bg-info/10 text-info border-info/20",
  },
  completed: {
    label: "เสร็จแล้ว",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "ยกเลิก",
    className: "bg-error/10 text-error border-error/20",
  },
}

const jobTypeLabels: Record<JobType, string> = {
  repair: "ซ่อม",
  maintenance: "บำรุงรักษา",
  inspection: "ตรวจเช็ค",
  insurance: "ประกัน",
  warranty: "รับประกัน",
  other: "อื่นๆ",
}

export default function ReceptionPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredCheckins = mockCheckins.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())

    const matchType = jobTypeFilter === "all" || item.jobType === jobTypeFilter
    const matchStatus = statusFilter === "all" || item.status === statusFilter

    return matchSearch && matchType && matchStatus
  })

  return (
    <div className="flex flex-col">
      <PageHeader
        title="รับรถเข้าซ่อม"
        description="บันทึกข้อมูลรถเข้าซ่อม"
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            รับรถใหม่
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขที่งาน, ลูกค้า, ทะเบียน..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="w-40">
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ประเภทงาน - ทั้งหมด</SelectItem>
                  <SelectItem value="repair">ซ่อม</SelectItem>
                  <SelectItem value="maintenance">บำรุงรักษา</SelectItem>
                  <SelectItem value="inspection">ตรวจเช็ค</SelectItem>
                  <SelectItem value="insurance">ประกัน</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะ - ทั้งหมด</SelectItem>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="in_progress">กำลังซ่อม</SelectItem>
                  <SelectItem value="completed">เสร็จแล้ว</SelectItem>
                  <SelectItem value="cancelled">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่งาน</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ทะเบียน / รุ่นรถ</TableHead>
                <TableHead>ประเภทงาน</TableHead>
                <TableHead>วันที่รับ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ช่าง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCheckins.map((item) => (
                <TableRow key={item.id} className="cursor-pointer">
                  <TableCell className="font-medium text-primary">
                    {item.jobNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {item.customerName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{item.licensePlate}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.vehicleModel}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-medium">
                      {jobTypeLabels[item.jobType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateShort(item.receivedDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        statusConfig[item.status].className
                      )}
                    >
                      {statusConfig[item.status].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{item.technicianName}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCheckins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูลที่ค้นหา
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sheet for new check-in */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>รับรถเข้าซ่อมใหม่</SheetTitle>
            <SheetDescription>
              กรอกข้อมูลลูกค้าและรถเพื่อเปิดงานซ่อม
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <VehicleCheckinForm onCancel={() => setSheetOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
