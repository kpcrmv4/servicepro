"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Download,
  FileText,
  ImageIcon,
  Printer,
  User,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateTime, formatDateShort } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { JobStatus, JobItemType } from "@/lib/types/database"

const statusSteps = [
  { key: "pending" as JobStatus, label: "รอดำเนินการ" },
  { key: "in_progress" as JobStatus, label: "กำลังซ่อม" },
  { key: "quality_check" as JobStatus, label: "รอตรวจ QC" },
  { key: "waiting_pickup" as JobStatus, label: "รอลูกค้ารับ" },
  { key: "completed" as JobStatus, label: "เสร็จ" },
]

const mockJob = {
  id: "1",
  jobNumber: "JOB-2026-0001",
  customerName: "สมชาย วงศ์สวัสดิ์",
  customerPhone: "081-234-5678",
  customerType: "individual" as const,
  licensePlate: "กข 1234",
  vehicle: "Toyota Camry",
  vehicleYear: 2566,
  vehicleColor: "ขาว",
  mileage: 45230,
  jobType: "repair",
  priority: "urgent" as const,
  status: "in_progress" as JobStatus,
  technicianName: "ช่างวิทย์",
  receivedDate: "2026-03-05T09:30:00",
  estimatedCompletion: "2026-03-07",
  description: "เครื่องยนต์มีเสียงดังผิดปกติ สายพานอาจต้องเปลี่ยน น้ำมันรั่ว",
  bayNumber: "Bay 3",
}

const mockJobItems = [
  { id: "1", description: "สายพานไทม์มิ่ง", type: "part" as JobItemType, quantity: 1, unitPrice: 3500, total: 3500 },
  { id: "2", description: "ลูกรอกสายพาน", type: "part" as JobItemType, quantity: 2, unitPrice: 1200, total: 2400 },
  { id: "3", description: "น้ำมันเครื่อง SAE 5W-40", type: "part" as JobItemType, quantity: 4, unitPrice: 350, total: 1400 },
  { id: "4", description: "กรองน้ำมันเครื่อง", type: "part" as JobItemType, quantity: 1, unitPrice: 280, total: 280 },
  { id: "5", description: "ค่าแรงเปลี่ยนสายพาน", type: "labor" as JobItemType, quantity: 1, unitPrice: 4500, total: 4500 },
  { id: "6", description: "ค่าแรงเปลี่ยนถ่ายน้ำมัน", type: "labor" as JobItemType, quantity: 1, unitPrice: 500, total: 500 },
]

const subtotal = mockJobItems.reduce((sum, item) => sum + item.total, 0)
const discount = 500
const vat = (subtotal - discount) * 0.07
const grandTotal = subtotal - discount + vat

const mockTimeline = [
  { id: "1", status: "pending" as JobStatus, notes: "รับรถเข้าระบบ - ลูกค้าแจ้งเครื่องยนต์มีเสียงดัง", user: "คุณแป้ง (Reception)", createdAt: "2026-03-05T09:30:00" },
  { id: "2", status: "pending" as JobStatus, notes: "ตรวจเช็คเบื้องต้น พบสายพานชำรุด น้ำมันรั่วซึม", user: "ช่างวิทย์", createdAt: "2026-03-05T10:15:00" },
  { id: "3", status: "pending" as JobStatus, notes: "แจ้งราคากับลูกค้า - ลูกค้าอนุมัติ", user: "คุณแป้ง (Reception)", createdAt: "2026-03-05T11:00:00" },
  { id: "4", status: "in_progress" as JobStatus, notes: "เริ่มดำเนินการซ่อม - ถอดสายพานเก่า", user: "ช่างวิทย์", createdAt: "2026-03-05T13:00:00" },
  { id: "5", status: "in_progress" as JobStatus, notes: "ติดตั้งสายพานใหม่ กำลังเปลี่ยนถ่ายน้ำมัน", user: "ช่างวิทย์", createdAt: "2026-03-05T15:30:00" },
]

const typeLabels: Record<JobItemType, string> = {
  part: "อะไหล่",
  labor: "ค่าแรง",
  other: "อื่นๆ",
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const currentStepIndex = statusSteps.findIndex(
    (s) => s.key === mockJob.status
  )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {mockJob.jobNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockJob.vehicle} - {mockJob.licensePlate}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md border px-3 py-1 text-sm font-medium",
            mockJob.priority === "urgent"
              ? "bg-error/10 text-error border-error/20"
              : "bg-info/10 text-info border-info/20"
          )}
        >
          {mockJob.priority === "urgent" && (
            <AlertTriangle className="mr-1.5 h-4 w-4" />
          )}
          {mockJob.priority === "urgent" ? "ด่วน" : "ปกติ"}
        </span>
      </div>

      {/* Status Progress Bar */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, i) => {
            const isCompleted = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-center whitespace-nowrap",
                      isCurrent
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1",
                      i < currentStepIndex ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer & Vehicle */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">ข้อมูลลูกค้า & รถ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="h-4 w-4 text-primary" />
                      ข้อมูลลูกค้า
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อ</span>
                        <span className="font-medium">{mockJob.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เบอร์โทร</span>
                        <span>{mockJob.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ประเภท</span>
                        <span>บุคคล</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Car className="h-4 w-4 text-primary" />
                      ข้อมูลรถ
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ทะเบียน</span>
                        <span className="font-medium">{mockJob.licensePlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">รุ่น</span>
                        <span>{mockJob.vehicle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ปี/สี</span>
                        <span>{mockJob.vehicleYear} / {mockJob.vehicleColor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เลขไมล์</span>
                        <span>{mockJob.mileage.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </div>
                {mockJob.description && (
                  <>
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <span className="font-medium">อาการ/รายละเอียด: </span>
                      <span className="text-muted-foreground">{mockJob.description}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Repair Items */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">รายการซ่อม</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รายการ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead className="text-center">จำนวน</TableHead>
                      <TableHead className="text-right">ราคาต่อหน่วย</TableHead>
                      <TableHead className="text-right">รวม</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockJobItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-md px-2 py-0.5 text-xs font-medium"
                          >
                            {typeLabels[item.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รวมก่อนส่วนลด</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ส่วนลด</span>
                    <span className="text-error">-{formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT 7%</span>
                    <span>{formatCurrency(vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">ประวัติการดำเนินงาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTimeline.map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full",
                            i === 0 ? "bg-primary" : "bg-muted-foreground/30"
                          )}
                        />
                        {i < mockTimeline.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm">{event.notes}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{event.user}</span>
                          <span>-</span>
                          <span>{formatDateTime(event.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Job Info */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">ข้อมูล Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เลขที่</span>
                  <span className="font-medium">{mockJob.jobNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ประเภท</span>
                  <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-medium">
                    ซ่อม
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="inline-flex items-center rounded-md border border-error/20 bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    ด่วน
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สถานะ</span>
                  <span className="inline-flex items-center rounded-md border border-info/20 bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                    กำลังซ่อม
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ช่าง</span>
                  <span className="flex items-center gap-1">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    {mockJob.technicianName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bay</span>
                  <span>{mockJob.bayNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">วันที่รับ</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateShort(mockJob.receivedDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">กำหนดเสร็จ</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDateShort(mockJob.estimatedCompletion)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">เปลี่ยนสถานะ</label>
                  <div className="mt-1.5">
                    <Select defaultValue="in_progress">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">รอดำเนินการ</SelectItem>
                        <SelectItem value="in_progress">กำลังซ่อม</SelectItem>
                        <SelectItem value="quality_check">รอตรวจ QC</SelectItem>
                        <SelectItem value="waiting_pickup">รอลูกค้ารับ</SelectItem>
                        <SelectItem value="completed">เสร็จแล้ว</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="h-4 w-4" />
                  มอบหมายช่าง
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="h-4 w-4" />
                  พิมพ์ใบรับรถ
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4" />
                  สร้างใบเสนอราคา
                </Button>
              </CardContent>
            </Card>

            {/* Photos */}
            <Card className="rounded-xl border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">รูปภาพ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-muted/50"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
