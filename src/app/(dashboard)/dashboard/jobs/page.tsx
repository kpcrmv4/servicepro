import {
  Plus,
  Search,
  Calendar,
  User,
  Wrench,
  AlertTriangle,
  Inbox,
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
import { createClient } from "@/lib/supabase/server"
import { getUserInfo } from "@/lib/actions/auth-helpers"
import Link from "next/link"
import type { JobStatus, JobPriority, JobType } from "@/lib/types/database"
import {
  JOB_STATUS,
  QUOTATION_STATUS,
  JOB_PRIORITY,
  JOB_TYPE_LABELS,
  QUEUE_COLUMNS,
} from "@/lib/constants/status-config"

// =============================================================================
// Tab definitions
// =============================================================================

const TABS = [
  { key: "reception", label: "รับรถ" },
  { key: "queue", label: "คิว/Kanban" },
  { key: "list", label: "รายการงาน" },
  { key: "planning", label: "ตารางงาน" },
  { key: "quotes", label: "ใบเสนอราคา" },
]

// =============================================================================
// Status filter sub-tabs for List view
// =============================================================================

const listStatusFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "in_progress", label: "กำลังซ่อม" },
  { value: "quality_check", label: "รอตรวจ QC" },
  { value: "waiting_pickup", label: "รอลูกค้ารับ" },
  { value: "completed", label: "เสร็จแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
]

const repairPhaseStatuses = ["in_progress", "quality_check", "waiting_pickup", "completed", "cancelled"]
const receptionStatuses = ["pending", "diagnosing", "quoted"]

// =============================================================================
// Status step dots
// =============================================================================

const statusSteps: string[] = ["in_progress", "quality_check", "waiting_pickup", "completed"]

function StatusDots({ currentStatus }: { currentStatus: string }) {
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

// =============================================================================
// Empty state component
// =============================================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Inbox className="mb-3 h-10 w-10" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// =============================================================================
// Main Page
// =============================================================================

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "list"
  const activeStatus = params.status || "all"

  // ─── Fetch jobs ───────────────────────────────────────────────────────────
  const allJobs = await getJobs({ search: params.search })

  // ─── Fetch quotations (for quotes tab) ────────────────────────────────────
  let quotations: Record<string, unknown>[] = []
  if (activeTab === "quotes") {
    const supabase = await createClient()
    const userInfo = await getUserInfo()
    if (userInfo?.tenant_id) {
      const { data } = await supabase
        .from("quotations")
        .select(`
          *,
          customers(id, name, phone),
          vehicles(id, license_plate, brand, model)
        `)
        .eq("tenant_id", userInfo.tenant_id)
        .order("created_at", { ascending: false })
      quotations = (data || []) as Record<string, unknown>[]
    }
  }

  // ─── Derived data ─────────────────────────────────────────────────────────
  const receptionJobs = allJobs.filter((j: Record<string, unknown>) =>
    receptionStatuses.includes(j.status as string)
  )

  const repairJobs = allJobs.filter((j: Record<string, unknown>) =>
    repairPhaseStatuses.includes(j.status as string)
  )

  const listJobs = activeStatus === "all"
    ? repairJobs
    : repairJobs.filter((j: Record<string, unknown>) => j.status === activeStatus)

  const tabCounts: Record<string, number> = {
    all: repairJobs.length,
    in_progress: repairJobs.filter((j: Record<string, unknown>) => j.status === "in_progress").length,
    quality_check: repairJobs.filter((j: Record<string, unknown>) => j.status === "quality_check").length,
    waiting_pickup: repairJobs.filter((j: Record<string, unknown>) => j.status === "waiting_pickup").length,
    completed: repairJobs.filter((j: Record<string, unknown>) => j.status === "completed").length,
    cancelled: repairJobs.filter((j: Record<string, unknown>) => j.status === "cancelled").length,
  }

  // Planning: group by estimated_completion date
  const planningJobs = allJobs.filter(
    (j: Record<string, unknown>) => j.status !== "completed" && j.status !== "cancelled"
  )
  const planningByDate = new Map<string, Record<string, unknown>[]>()
  for (const job of planningJobs) {
    const date = (job as Record<string, unknown>).estimated_completion as string | null
    const key = date ? date.split("T")[0] : "ไม่ระบุ"
    if (!planningByDate.has(key)) planningByDate.set(key, [])
    planningByDate.get(key)!.push(job as Record<string, unknown>)
  }
  const planningDates = Array.from(planningByDate.keys()).sort((a, b) => {
    if (a === "ไม่ระบุ") return 1
    if (b === "ไม่ระบุ") return -1
    return a.localeCompare(b)
  })

  const today = new Date().toISOString().split("T")[0]

  // ─── Build search param helper ────────────────────────────────────────────
  function tabHref(tabKey: string, extra?: Record<string, string>) {
    const p = new URLSearchParams()
    p.set("tab", tabKey)
    if (params.search) p.set("search", params.search)
    if (extra) {
      for (const [k, v] of Object.entries(extra)) p.set(k, v)
    }
    return `/dashboard/jobs?${p.toString()}`
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
        {/* ================================================================= */}
        {/* Main Tab Bar                                                      */}
        {/* ================================================================= */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-1 pb-px">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard/jobs?tab=${tab.key}${params.search ? `&search=${params.search}` : ""}`}
              className={cn(
                "shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-b-2 border-primary bg-primary/5 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* ================================================================= */}
        {/* RECEPTION TAB                                                     */}
        {/* ================================================================= */}
        {activeTab === "reception" && (
          <div className="space-y-4">
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
              <input type="hidden" name="tab" value="reception" />
            </form>

            {receptionJobs.length === 0 ? (
              <EmptyState message="ไม่มีรถรอรับเข้าอู่" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {receptionJobs.map((job: Record<string, unknown>) => {
                  const customer = job.customers as Record<string, unknown> | null
                  const vehicle = job.vehicles as Record<string, unknown> | null
                  const status = job.status as string
                  const statusStyle = JOB_STATUS[status]

                  return (
                    <Link
                      key={job.id as string}
                      href={`/dashboard/jobs/${job.id}`}
                      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/50"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-medium text-primary">
                          {job.job_number as string}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                            statusStyle?.className || "bg-muted text-muted-foreground"
                          )}
                        >
                          {statusStyle?.label || status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">
                            {(customer?.name as string) || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {(vehicle?.license_plate as string) || "-"}
                          </span>
                          <span className="text-xs">
                            {vehicle?.brand as string} {vehicle?.model as string}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {formatDateShort(job.created_at as string)}
                          </span>
                        </div>
                        {typeof job.description === 'string' && job.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {job.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* QUEUE / KANBAN TAB                                                */}
        {/* ================================================================= */}
        {activeTab === "queue" && (() => {
          const queueStatus = params.status || "all"
          const queueJobs = queueStatus === "all"
            ? allJobs.filter((j: Record<string, unknown>) => j.status !== "cancelled")
            : allJobs.filter((j: Record<string, unknown>) => j.status === queueStatus)

          return (
            <div className="space-y-4">
              {/* Summary bar - counts per status */}
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {QUEUE_COLUMNS.map((col) => {
                  const count = allJobs.filter((j: Record<string, unknown>) => j.status === col.key).length
                  const isActive = queueStatus === col.key
                  return (
                    <Link
                      key={col.key}
                      href={tabHref("queue", { status: col.key })}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-colors",
                        isActive
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border bg-card hover:border-primary/20 hover:bg-accent/30"
                      )}
                    >
                      <div className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                      <span className={cn(
                        "text-lg font-bold",
                        count > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {count}
                      </span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">
                        {col.label}
                      </span>
                    </Link>
                  )
                })}
              </div>

              {/* "ทั้งหมด" toggle */}
              <div className="flex items-center gap-2">
                <Link
                  href={tabHref("queue", { status: "all" })}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    queueStatus === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  ทั้งหมด ({allJobs.filter((j: Record<string, unknown>) => j.status !== "cancelled").length})
                </Link>
                {queueStatus !== "all" && (
                  <span className="text-sm text-muted-foreground">
                    กรอง: <span className="font-medium text-foreground">{QUEUE_COLUMNS.find(c => c.key === queueStatus)?.label}</span>
                  </span>
                )}
              </div>

              {/* Job cards */}
              {queueJobs.length === 0 ? (
                <EmptyState message="ไม่มีรายการในสถานะนี้" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {queueJobs.map((job: Record<string, unknown>) => {
                    const customer = job.customers as Record<string, unknown> | null
                    const vehicle = job.vehicles as Record<string, unknown> | null
                    const tech = job.assigned_user as Record<string, unknown> | null
                    const priority = job.priority as string
                    const status = job.status as string
                    const statusStyle = JOB_STATUS[status]
                    const col = QUEUE_COLUMNS.find(c => c.key === status)

                    return (
                      <Link
                        key={job.id as string}
                        href={`/dashboard/jobs/${job.id}`}
                        className={cn(
                          "group block rounded-xl border-l-4 border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30",
                          col?.color || "border-l-muted"
                        )}
                      >
                        {/* Top row: job number + badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-primary">
                            {job.job_number as string}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {priority === "urgent" && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-error/10 text-error border border-error/20 px-1.5 py-0.5 text-[10px] font-medium">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                ด่วน
                              </span>
                            )}
                            <span className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium",
                              statusStyle?.className || "bg-muted text-muted-foreground"
                            )}>
                              {statusStyle?.label || status}
                            </span>
                          </div>
                        </div>

                        {/* Customer + Vehicle */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {(customer?.name as string) || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-muted/50 rounded px-1.5 py-0.5">
                              {(vehicle?.license_plate as string) || "-"}
                            </span>
                            <span className="truncate">
                              {vehicle?.brand as string} {vehicle?.model as string}
                            </span>
                          </div>
                        </div>

                        {/* Bottom row: technician + date */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                          {tech ? (
                            <div className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{tech.full_name as string}</span>
                            </div>
                          ) : (
                            <span className="text-warning">ยังไม่มอบหมาย</span>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-3 w-3" />
                            {formatDateShort(job.created_at as string)}
                          </div>
                        </div>

                        {/* Description preview */}
                        {typeof job.description === "string" && job.description && (
                          <p className="mt-2 text-xs text-muted-foreground line-clamp-1 border-t border-border pt-2">
                            {job.description}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* ================================================================= */}
        {/* LIST TAB (DEFAULT)                                                */}
        {/* ================================================================= */}
        {activeTab === "list" && (
          <div className="space-y-4">
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
              <input type="hidden" name="tab" value="list" />
              {params.status && <input type="hidden" name="status" value={params.status} />}
            </form>

            {/* Status sub-filter tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
              {listStatusFilters.map((tab) => (
                <Link
                  key={tab.value}
                  href={tabHref("list", { status: tab.value })}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeStatus === tab.value
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
                  {listJobs.map((job: Record<string, unknown>) => {
                    const customer = job.customers as Record<string, unknown> | null
                    const vehicle = job.vehicles as Record<string, unknown> | null
                    const tech = job.assigned_user as Record<string, unknown> | null
                    const status = job.status as JobStatus
                    const priority = job.priority as JobPriority
                    const jobType = job.type as JobType
                    const statusStyle = JOB_STATUS[status]
                    const priorityStyle = JOB_PRIORITY[priority]

                    return (
                      <TableRow key={job.id as string}>
                        <TableCell>
                          <Link
                            href={`/dashboard/jobs/${job.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {job.job_number as string}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[120px] truncate">
                              {(customer?.name as string) || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {(vehicle?.license_plate as string) || "-"}
                            </div>
                            <div className="text-sm">
                              {vehicle?.brand as string} {vehicle?.model as string}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-md px-2 py-0.5 text-xs font-medium"
                          >
                            {JOB_TYPE_LABELS[jobType] || jobType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                              priorityStyle?.className
                            )}
                          >
                            {priority === "urgent" && (
                              <AlertTriangle className="mr-1 h-3 w-3" />
                            )}
                            {priorityStyle?.label || priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                                statusStyle?.className
                              )}
                            >
                              {statusStyle?.label || status}
                            </span>
                            <StatusDots currentStatus={status} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {(tech?.full_name as string) || "-"}
                            </span>
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
                  {listJobs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-muted-foreground"
                      >
                        {params.search
                          ? "ไม่พบข้อมูลที่ค้นหา"
                          : "ยังไม่มีงานซ่อม"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PLANNING TAB                                                      */}
        {/* ================================================================= */}
        {activeTab === "planning" && (
          <div className="space-y-6">
            {planningDates.length === 0 ? (
              <EmptyState message="ไม่มีงานที่กำลังดำเนินการ" />
            ) : (
              planningDates.map((dateKey) => {
                const dateJobs = planningByDate.get(dateKey)!
                const isToday = dateKey === today
                const isPast = dateKey !== "ไม่ระบุ" && dateKey < today
                const isFuture = dateKey !== "ไม่ระบุ" && dateKey > today

                return (
                  <div key={dateKey} className="flex gap-4">
                    {/* Date circle */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                          isToday
                            ? "bg-blue-500"
                            : isPast
                              ? "bg-red-500"
                              : isFuture
                                ? "bg-gray-400"
                                : "bg-gray-300"
                        )}
                      >
                        {dateKey === "ไม่ระบุ"
                          ? "?"
                          : new Date(dateKey).getDate()}
                      </div>
                      {dateKey !== "ไม่ระบุ" && (
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          {formatDateShort(dateKey)}
                        </span>
                      )}
                      {dateKey === "ไม่ระบุ" && (
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          ไม่ระบุ
                        </span>
                      )}
                    </div>

                    {/* Job cards */}
                    <div className="flex-1 space-y-2">
                      {dateJobs.map((job) => {
                        const customer = job.customers as Record<string, unknown> | null
                        const vehicle = job.vehicles as Record<string, unknown> | null
                        const tech = job.assigned_user as Record<string, unknown> | null
                        const status = job.status as string
                        const statusStyle = JOB_STATUS[status]

                        return (
                          <Link
                            key={job.id as string}
                            href={`/dashboard/jobs/${job.id}`}
                            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-primary">
                                  {job.job_number as string}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                                    statusStyle?.className
                                  )}
                                >
                                  {statusStyle?.label || status}
                                </span>
                              </div>
                              <p className="truncate text-sm">
                                {(customer?.name as string) || "-"}
                                {" / "}
                                {(vehicle?.license_plate as string) || ""}{" "}
                                {vehicle?.brand as string} {vehicle?.model as string}
                              </p>
                            </div>
                            {tech && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wrench className="h-3 w-3" />
                                <span className="hidden sm:inline">
                                  {tech.full_name as string}
                                </span>
                              </div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* QUOTES TAB                                                        */}
        {/* ================================================================= */}
        {activeTab === "quotes" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>รถ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead>ใช้ได้ถึง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => {
                    const customer = q.customers as Record<string, unknown> | null
                    const vehicle = q.vehicles as Record<string, unknown> | null
                    const status = q.status as string
                    const statusStyle = QUOTATION_STATUS[status]

                    return (
                      <TableRow key={q.id as string}>
                        <TableCell>
                          <span className="font-medium text-primary">
                            {q.quotation_number as string}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="max-w-[120px] truncate">
                              {(customer?.name as string) || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {(vehicle?.license_plate as string) || "-"}
                            </div>
                            <div className="text-sm">
                              {vehicle?.brand as string} {vehicle?.model as string}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(q.total) || 0)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                              statusStyle?.color || "bg-muted text-muted-foreground"
                            )}
                          >
                            {statusStyle?.label || status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDateShort(q.created_at as string)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {q.valid_until
                              ? formatDateShort(q.valid_until as string)
                              : "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {quotations.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        ยังไม่มีใบเสนอราคา
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
