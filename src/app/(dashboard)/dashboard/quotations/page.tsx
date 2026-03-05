"use client"

import { useState } from "react"
import { Plus, Search, Calendar, User, Car, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { QuotationStatus } from "@/lib/types/database"

interface QuotationItem {
  id: string
  quotationNumber: string
  customerName: string
  vehicle: string
  licensePlate: string
  status: QuotationStatus
  total: number
  createdAt: string
  validUntil: string
}

const mockQuotations: QuotationItem[] = [
  { id: "1", quotationNumber: "QT-2026-0001", customerName: "สมชาย วงศ์สวัสดิ์", vehicle: "Toyota Camry", licensePlate: "กข 1234", status: "approved", total: 15800, createdAt: "2026-03-05", validUntil: "2026-03-12" },
  { id: "2", quotationNumber: "QT-2026-0002", customerName: "สุภาพร จันทร์เจริญ", vehicle: "Honda Civic", licensePlate: "ขค 5678", status: "sent", total: 4500, createdAt: "2026-03-05", validUntil: "2026-03-12" },
  { id: "3", quotationNumber: "QT-2026-0003", customerName: "วิชัย ศรีสุข", vehicle: "Isuzu D-Max", licensePlate: "จฉ 9012", status: "draft", total: 42000, createdAt: "2026-03-04", validUntil: "2026-03-11" },
  { id: "4", quotationNumber: "QT-2026-0004", customerName: "นภาพร แก้วมณี", vehicle: "Mazda 3", licensePlate: "ฌญ 3456", status: "rejected", total: 8900, createdAt: "2026-03-03", validUntil: "2026-03-10" },
  { id: "5", quotationNumber: "QT-2026-0005", customerName: "กัลยา ทองดี", vehicle: "MG ZS", licensePlate: "ฆง 5791", status: "approved", total: 55000, createdAt: "2026-03-02", validUntil: "2026-03-09" },
  { id: "6", quotationNumber: "QT-2026-0006", customerName: "ธนพล สุขสันต์", vehicle: "Toyota Hilux Revo", licensePlate: "กท 2468", status: "expired", total: 6200, createdAt: "2026-02-20", validUntil: "2026-02-27" },
  { id: "7", quotationNumber: "QT-2026-0007", customerName: "พิมพ์ใจ รักษ์ดี", vehicle: "Honda HR-V", licensePlate: "ขง 1357", status: "sent", total: 12300, createdAt: "2026-03-01", validUntil: "2026-03-08" },
  { id: "8", quotationNumber: "QT-2026-0008", customerName: "บริษัท เจริญกิจ จำกัด", vehicle: "Toyota Fortuner", licensePlate: "วว 1122", status: "draft", total: 7800, createdAt: "2026-03-04", validUntil: "2026-03-11" },
]

const statusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  draft: { label: "แบบร่าง", className: "bg-muted text-muted-foreground border-border" },
  sent: { label: "ส่งแล้ว", className: "bg-info/10 text-info border-info/20" },
  approved: { label: "อนุมัติ", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "ปฏิเสธ", className: "bg-error/10 text-error border-error/20" },
  expired: { label: "หมดอายุ", className: "bg-warning/10 text-warning border-warning/20" },
}

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredQuotations = mockQuotations.filter(
    (q) =>
      !searchQuery ||
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        title="ใบเสนอราคา"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            สร้างใบเสนอราคา
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขที่, ลูกค้า, ทะเบียน..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>รถ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead>วันหมดอายุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((q) => (
                <TableRow key={q.id} className="cursor-pointer">
                  <TableCell className="font-medium text-primary">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      {q.quotationNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {q.customerName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs text-muted-foreground">{q.licensePlate}</div>
                      <div className="text-sm">{q.vehicle}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        statusConfig[q.status].className
                      )}
                    >
                      {statusConfig[q.status].label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(q.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateShort(q.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateShort(q.validUntil)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredQuotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    ไม่พบข้อมูล
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
