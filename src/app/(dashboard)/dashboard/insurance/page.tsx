"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Calendar,
  User,
  Car,
  Shield,
  DollarSign,
  FileCheck,
  Clock,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { InsuranceClaimStatus } from "@/lib/types/database"

interface ClaimItem {
  id: string
  claimNumber: string
  jobNumber: string
  customerName: string
  vehicle: string
  licensePlate: string
  insuranceCompany: string
  estimatedAmount: number
  approvedAmount: number | null
  status: InsuranceClaimStatus
  createdAt: string
}

const mockClaims: ClaimItem[] = [
  { id: "1", claimNumber: "CLM-2026-0001", jobNumber: "JOB-2026-0003", customerName: "วิชัย ศรีสุข", vehicle: "Isuzu D-Max", licensePlate: "จฉ 9012", insuranceCompany: "วิริยะประกันภัย", estimatedAmount: 42000, approvedAmount: 38500, status: "paid", createdAt: "2026-03-04" },
  { id: "2", claimNumber: "CLM-2026-0002", jobNumber: "JOB-2026-0009", customerName: "กัลยา ทองดี", vehicle: "MG ZS", licensePlate: "ฆง 5791", insuranceCompany: "กรุงเทพประกันภัย", estimatedAmount: 55000, approvedAmount: 52000, status: "approved", createdAt: "2026-03-01" },
  { id: "3", claimNumber: "CLM-2026-0003", jobNumber: "JOB-2026-0014", customerName: "อภิชาติ พงศ์พัฒน์", vehicle: "Honda Accord", licensePlate: "อพ 3344", insuranceCompany: "ทิพยประกันภัย", estimatedAmount: 28000, approvedAmount: null, status: "pending_approval", createdAt: "2026-03-03" },
  { id: "4", claimNumber: "CLM-2026-0004", jobNumber: "JOB-2026-0015", customerName: "มณีรัตน์ ศรีวิลัย", vehicle: "Toyota Yaris", licensePlate: "มศ 5566", insuranceCompany: "เมืองไทยประกันภัย", estimatedAmount: 15000, approvedAmount: null, status: "submitted", createdAt: "2026-03-05" },
  { id: "5", claimNumber: "CLM-2026-0005", jobNumber: "JOB-2026-0016", customerName: "สุรชัย พิพัฒน์กุล", vehicle: "Nissan Navara", licensePlate: "สพ 7788", insuranceCompany: "วิริยะประกันภัย", estimatedAmount: 85000, approvedAmount: null, status: "rejected", createdAt: "2026-02-28" },
  { id: "6", claimNumber: "CLM-2026-0006", jobNumber: "JOB-2026-0017", customerName: "ปิยะ ชัยรัตน์", vehicle: "Mitsubishi Triton", licensePlate: "ปช 9900", insuranceCompany: "กรุงเทพประกันภัย", estimatedAmount: 32000, approvedAmount: 30000, status: "paid", createdAt: "2026-02-25" },
  { id: "7", claimNumber: "CLM-2026-0007", jobNumber: "JOB-2026-0018", customerName: "จิราภา สมบูรณ์", vehicle: "Mazda 2", licensePlate: "จส 1234", insuranceCompany: "ทิพยประกันภัย", estimatedAmount: 18500, approvedAmount: 17000, status: "approved", createdAt: "2026-03-02" },
  { id: "8", claimNumber: "CLM-2026-0008", jobNumber: "JOB-2026-0019", customerName: "ณัฐพงษ์ เรืองศรี", vehicle: "Ford Everest", licensePlate: "ณร 5678", insuranceCompany: "เมืองไทยประกันภัย", estimatedAmount: 67000, approvedAmount: null, status: "pending_approval", createdAt: "2026-03-04" },
]

const statusConfig: Record<InsuranceClaimStatus, { label: string; className: string }> = {
  submitted: { label: "ยื่นแล้ว", className: "bg-warning/10 text-warning border-warning/20" },
  pending_approval: { label: "รออนุมัติ", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  approved: { label: "อนุมัติแล้ว", className: "bg-info/10 text-info border-info/20" },
  paid: { label: "เบิกเงินแล้ว", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "ปฏิเสธ", className: "bg-error/10 text-error border-error/20" },
}

const summaryCards = [
  {
    label: "เคลมทั้งหมด",
    value: mockClaims.length,
    amount: mockClaims.reduce((s, c) => s + c.estimatedAmount, 0),
    icon: Shield,
    color: "text-primary",
  },
  {
    label: "รออนุมัติ",
    value: mockClaims.filter((c) => c.status === "pending_approval" || c.status === "submitted").length,
    amount: mockClaims.filter((c) => c.status === "pending_approval" || c.status === "submitted").reduce((s, c) => s + c.estimatedAmount, 0),
    icon: Clock,
    color: "text-warning",
  },
  {
    label: "อนุมัติแล้ว",
    value: mockClaims.filter((c) => c.status === "approved").length,
    amount: mockClaims.filter((c) => c.status === "approved").reduce((s, c) => s + (c.approvedAmount || 0), 0),
    icon: FileCheck,
    color: "text-info",
  },
  {
    label: "เบิกเงินแล้ว",
    value: mockClaims.filter((c) => c.status === "paid").length,
    amount: mockClaims.filter((c) => c.status === "paid").reduce((s, c) => s + (c.approvedAmount || 0), 0),
    icon: CheckCircle2,
    color: "text-success",
  },
]

export default function InsurancePage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClaims = mockClaims.filter(
    (c) =>
      !searchQuery ||
      c.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.insuranceCompany.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        title="เคลมประกัน"
        action={
          <Button>
            <Plus className="h-4 w-4" />
            สร้างเคลมใหม่
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="rounded-xl border border-border bg-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold">{card.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(card.amount)}
                    </p>
                  </div>
                  <div className={cn("rounded-lg bg-muted p-2.5", card.color)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขเคลม, ลูกค้า, ทะเบียน, บริษัทประกัน..."
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
                <TableHead>เลขที่เคลม</TableHead>
                <TableHead>Job#</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>รถ</TableHead>
                <TableHead>บริษัทประกัน</TableHead>
                <TableHead className="text-right">ยอดประเมิน</TableHead>
                <TableHead className="text-right">ยอดอนุมัติ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id} className="cursor-pointer">
                  <TableCell className="font-medium text-primary">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-4 w-4" />
                      {claim.claimNumber}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {claim.jobNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="max-w-[120px] truncate">{claim.customerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs text-muted-foreground">{claim.licensePlate}</div>
                      <div className="text-sm">{claim.vehicle}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{claim.insuranceCompany}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(claim.estimatedAmount)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {claim.approvedAmount
                      ? formatCurrency(claim.approvedAmount)
                      : <span className="text-muted-foreground">-</span>
                    }
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        statusConfig[claim.status].className
                      )}
                    >
                      {statusConfig[claim.status].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateShort(claim.createdAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClaims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
