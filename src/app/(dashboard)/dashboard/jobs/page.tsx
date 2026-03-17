import {
  Plus,
  Search,
  Calendar,
  User,
  Wrench,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { cn, formatDateShort, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { getJobs } from "@/lib/actions/jobs"
import Link from "next/link"
import type { JobStatus, JobPriority, JobType } from "@/lib/types/database"

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

const tabFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "in_progress", label: "กำลังซ่อม" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "quality_check", label: "รอตรวจ QC" },
  { value: "waiting_pickup", label: "รอลูกค้ารับ" },
  { value: "completed", label: "เสร็จแล้ว" },
]

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const activeTab = params.status || "all"
  const jobs = await getJobs({
    status: activeTab,
    search: params.search,
  })

  // Get counts for each tab
  const allJobs = await getJobs()
  const tabCounts: Record<string, number> = {
    all: allJobs.length,
    in_progress: allJobs.filter((j: Record<string, unknown>) => j.status === "in_progress").length,
    pending: allJobs.filter((j: Record<string, unknown>) => j.status === "pending").length,
    quality_check: allJobs.filter((j: Record<string, unknown>) => j.status === "quality_check").length,
    waiting_pickup: allJobs.filter((j: Record<string, unknown>) => j.status === "waiting_pickup").length,
    completed: allJobs.filter((j: Record<string, unknown>) => j.status === "completed").length,
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="จัดการงานซ่อม"
        action={
          <Link href="/dashboard/jobs/new">
            <Button>
              <Plus className="h-4 w-4" />
              สร้าง Job Order
            </Button>
          </Link>
        }
      />

      <div className="p-4 space-y-4 sm:p-6">
        {/* Search */}
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="ค้นหา Job, ลูกค้า, ทะเบียน..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {params.status && <input type="hidden" name="status" value={params.status} />}
        </form>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {tabFilters.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/jobs?status=${tab.value}${params.search ? `&search=${params.search}` : ""}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                {tabCounts[tab.value] || 0}
              </span>
            </Link>
          ))}
        </div>

        {/* Table */}
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
                <TableHead className="text-right">ยอดรวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null
                const vehicle = job.vehicles as Record<string, unknown> | null
                const tech = job.assigned_user as Record<string, unknown> | null
                const status = job.status as JobStatus
                const priority = job.priority as JobPriority
                const jobType = job.type as JobType

                return (
                  <TableRow key={job.id as string}>
                    <TableCell>
                      <Link href={`/dashboard/jobs/${job.id}`} className="font-medium text-primary hover:underline">
                        {job.job_number as string}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="max-w-[120px] truncate">{customer?.name as string || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-xs text-muted-foreground">{vehicle?.license_plate as string || "-"}</div>
                        <div className="text-sm">{vehicle?.brand as string} {vehicle?.model as string}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md px-2 py-0.5 text-xs font-medium">
                        {jobTypeLabels[jobType] || jobType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        priorityConfig[priority]?.className
                      )}>
                        {priority === "urgent" && <AlertTriangle className="mr-1 h-3 w-3" />}
                        {priorityConfig[priority]?.label || priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className={cn(
                          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                          statusConfig[status]?.className
                        )}>
                          {statusConfig[status]?.label || status}
                        </span>
                        <StatusDots currentStatus={status} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{tech?.full_name as string || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateShort(job.created_at as string)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(job.grand_total) || 0)}
                    </TableCell>
                  </TableRow>
                )
              })}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {params.search ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีงานซ่อม"}
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
