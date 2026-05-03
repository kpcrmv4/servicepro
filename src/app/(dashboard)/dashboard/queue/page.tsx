import { Car, User, Clock, Wrench, AlertTriangle, PauseCircle } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getJobs } from "@/lib/actions/jobs"
import { QUEUE_COLUMNS, JOB_STATUS } from "@/lib/constants/status-config"
import Link from "next/link"

const HOLD_STATES = new Set(["waiting_parts", "waiting_insurance", "on_hold"])

export default async function QueuePage() {
  const jobs = await getJobs()

  // Filter out cancelled/completed-tail (keep completed for the last column)
  const activeJobs = jobs.filter(
    (j: Record<string, unknown>) => j.status !== "cancelled",
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="คิวงานซ่อม"
        description="ลากแก้ไขสถานะงานในแต่ละขั้นตอน รวมงานที่หยุดรออะไหล่/รอประกัน"
      />

      <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6">
        <span className="text-sm text-muted-foreground">
          งานที่เปิดอยู่:{" "}
          <span className="font-bold text-foreground">{activeJobs.length}</span> งาน
        </span>
        {activeJobs.filter((j) => HOLD_STATES.has(j.status as string)).length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
            <PauseCircle className="h-3 w-3" />
            พักงาน {activeJobs.filter((j) => HOLD_STATES.has(j.status as string)).length} รายการ
          </span>
        )}
      </div>

      {/* Kanban Board */}
      <div className="px-4 sm:px-6 overflow-x-auto">
        <div className="flex gap-3 min-w-[1400px] pb-4">
          {QUEUE_COLUMNS.map((col) => {
            const colJobs = activeJobs.filter(
              (j: Record<string, unknown>) => j.status === col.key,
            )
            return (
              <div key={col.key} className="flex w-[200px] shrink-0 flex-col">
                <div
                  className={cn(
                    "rounded-t-lg px-3 py-2 text-sm font-semibold text-center",
                    col.bg,
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                    {col.label}
                    <span className="rounded-full bg-white/60 px-1.5 text-[11px] font-bold">
                      {colJobs.length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 border-border bg-muted/30 p-2 min-h-[400px]">
                  {colJobs.map((job: Record<string, unknown>) => {
                    const customer = job.customers as Record<string, unknown> | null
                    const vehicle = job.vehicles as Record<string, unknown> | null
                    const isHeld = HOLD_STATES.has(job.status as string)
                    const holdReason = job.hold_reason as string | null
                    const holdUntil = job.hold_until as string | null
                    const status = JOB_STATUS[job.status as string]
                    return (
                      <Link
                        key={job.id as string}
                        href={`/dashboard/jobs/${job.id}`}
                        className={cn(
                          "block rounded-lg border-l-4 bg-card p-2.5 shadow-sm transition-shadow hover:shadow-md",
                          col.color,
                        )}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-primary">
                            {job.job_number as string}
                          </p>
                          {job.priority === "urgent" && (
                            <span className="rounded bg-red-100 px-1 text-[10px] font-bold text-red-700">
                              ด่วน
                            </span>
                          )}
                        </div>

                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">
                              {(customer?.name as string) || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Car className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate font-medium">
                              {(vehicle?.license_plate as string) || "-"}
                            </span>
                          </div>
                          {job.description ? (
                            <div className="flex items-start gap-1.5 text-muted-foreground">
                              <Wrench className="h-3 w-3 mt-0.5 shrink-0" />
                              <span className="line-clamp-1">
                                {String(job.description)}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Hold info */}
                        {isHeld && (holdReason || holdUntil) && (
                          <div className="mt-2 flex items-start gap-1.5 rounded border border-amber-200 bg-amber-50 p-1.5 text-[11px] text-amber-800">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            <div className="min-w-0">
                              {holdReason && (
                                <div className="line-clamp-2">{holdReason}</div>
                              )}
                              {holdUntil && (
                                <div className="font-medium">
                                  ETA: {new Date(holdUntil).toLocaleDateString("th-TH")}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateShort(job.created_at as string)}</span>
                          </div>
                          {status && (
                            <span className={cn("rounded px-1.5 py-0.5", status.color)}>
                              {status.label}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                  {colJobs.length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      —
                    </p>
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
