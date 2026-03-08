import { Car, User, Clock, Wrench } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getJobs } from "@/lib/actions/jobs"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รอรับรถ", color: "border-warning", bg: "bg-warning/10" },
  checked_in: { label: "รับรถแล้ว", color: "border-blue-500", bg: "bg-blue-50" },
  diagnosing: { label: "ตรวจสอบ", color: "border-purple-500", bg: "bg-purple-50" },
  in_progress: { label: "กำลังซ่อม", color: "border-primary", bg: "bg-primary/10" },
  waiting_parts: { label: "รออะไหล่", color: "border-orange-500", bg: "bg-orange-50" },
  completed: { label: "เสร็จแล้ว", color: "border-success", bg: "bg-success/10" },
}

const columns = [
  { key: "pending", label: "รอรับรถ" },
  { key: "checked_in", label: "รับรถแล้ว" },
  { key: "in_progress", label: "กำลังซ่อม" },
  { key: "waiting_parts", label: "รออะไหล่" },
  { key: "completed", label: "เสร็จแล้ว" },
]

export default async function QueuePage() {
  const jobs = await getJobs()

  // Filter out delivered/cancelled
  const activeJobs = jobs.filter(
    (j: Record<string, unknown>) => j.status !== "delivered" && j.status !== "cancelled"
  )

  // Group by status
  const grouped: Record<string, Record<string, unknown>[]> = {}
  for (const col of columns) {
    grouped[col.key] = activeJobs.filter((j: Record<string, unknown>) => {
      if (col.key === "in_progress") return j.status === "in_progress" || j.status === "diagnosing"
      return j.status === col.key
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="คิวงานซ่อม" />

      <div className="px-4 sm:px-6">
        <p className="text-sm text-muted-foreground">
          งานที่เปิดอยู่ทั้งหมด: <span className="font-bold text-foreground">{activeJobs.length}</span> งาน
        </p>
      </div>

      {/* Kanban Board */}
      <div className="px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-4 min-w-[900px]">
          {columns.map((col) => {
            const colJobs = grouped[col.key] || []
            return (
              <div key={col.key} className="flex-1 min-w-[200px]">
                <div className={cn("rounded-t-lg px-3 py-2 text-sm font-medium text-center", statusConfig[col.key]?.bg)}>
                  {col.label} ({colJobs.length})
                </div>
                <div className="space-y-3 rounded-b-lg border border-t-0 border-border bg-muted/30 p-3 min-h-[300px]">
                  {colJobs.map((job: Record<string, unknown>) => {
                    const customer = job.customers as Record<string, unknown> | null
                    const vehicle = job.vehicles as Record<string, unknown> | null
                    return (
                      <Link
                        key={job.id as string}
                        href={`/dashboard/jobs/${job.id}`}
                        className={cn(
                          "block rounded-lg border-l-4 bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
                          statusConfig[job.status as string]?.color || "border-muted"
                        )}
                      >
                        <p className="text-xs font-bold text-primary">{job.job_number as string}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{customer?.name as string || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{vehicle?.license_plate as string || "-"}</span>
                          </div>
                          {job.description ? (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <Wrench className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{String(job.description)}</span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateShort(job.created_at as string)}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                  {colJobs.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">ไม่มีงาน</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
