import { Calendar, Car, User, Wrench, Clock } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getJobs } from "@/lib/actions/jobs"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอรับรถ", color: "bg-warning/10 text-warning" },
  checked_in: { label: "รับรถแล้ว", color: "bg-blue-100 text-blue-700" },
  diagnosing: { label: "ตรวจสอบ", color: "bg-purple-100 text-purple-700" },
  in_progress: { label: "กำลังซ่อม", color: "bg-primary/10 text-primary" },
  waiting_parts: { label: "รออะไหล่", color: "bg-orange-100 text-orange-700" },
  completed: { label: "เสร็จแล้ว", color: "bg-success/10 text-success" },
  delivered: { label: "ส่งมอบแล้ว", color: "bg-muted text-muted-foreground" },
}

export default async function PlanningPage() {
  const jobs = await getJobs()

  // Group jobs by estimated completion date or created date
  const activeJobs = jobs.filter(
    (j: Record<string, unknown>) => j.status !== "delivered" && j.status !== "cancelled"
  )

  // Group by date
  const grouped: Record<string, Record<string, unknown>[]> = {}
  for (const job of activeJobs) {
    const dateStr = (job.estimated_completion as string) || (job.created_at as string)
    const date = new Date(dateStr).toISOString().split("T")[0]
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(job)
  }

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="space-y-6">
      <PageHeader title="วางแผนงาน" />

      <div className="px-4 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">งานที่ต้องทำ</p>
            <p className="text-2xl font-bold">{activeJobs.length}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 sm:px-6 space-y-6">
        {sortedDates.map((date) => {
          const dateJobs = grouped[date]
          const isToday = date === new Date().toISOString().split("T")[0]
          const isPast = new Date(date) < new Date(new Date().toISOString().split("T")[0])

          return (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                  isToday ? "bg-primary text-primary-foreground" :
                  isPast ? "bg-error/10 text-error" : "bg-muted text-muted-foreground"
                )}>
                  {new Date(date).getDate()}
                </div>
                <div>
                  <p className={cn("text-sm font-medium", isToday && "text-primary")}>
                    {isToday ? "วันนี้" : formatDateShort(date)}
                  </p>
                  <p className="text-xs text-muted-foreground">{dateJobs.length} งาน</p>
                </div>
              </div>

              <div className="ml-4 border-l-2 border-border pl-6 space-y-3">
                {dateJobs.map((job: Record<string, unknown>) => {
                  const customer = job.customers as Record<string, unknown> | null
                  const vehicle = job.vehicles as Record<string, unknown> | null
                  return (
                    <Link
                      key={job.id as string}
                      href={`/dashboard/jobs/${job.id}`}
                      className="block rounded-lg border border-border bg-card p-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">{job.job_number as string}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          statusConfig[job.status as string]?.color || "bg-muted text-muted-foreground"
                        )}>
                          {statusConfig[job.status as string]?.label || job.status as string}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{customer?.name as string || "-"}</span>
                        <span className="flex items-center gap-1"><Car className="h-3 w-3" />{vehicle?.license_plate as string || "-"}</span>
                        {job.description ? (
                          <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{String(job.description).slice(0, 30)}</span>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {sortedDates.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            ยังไม่มีงานที่ต้องวางแผน
          </div>
        )}
      </div>
    </div>
  )
}
