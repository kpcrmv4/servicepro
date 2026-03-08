import { Plus, Search, Car, User, Calendar, Wrench } from "lucide-react"
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
  cancelled: { label: "ยกเลิก", color: "bg-error/10 text-error" },
}

export default async function ReceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const jobs = await getJobs(params.search ? { search: params.search } : undefined)

  // Filter to show only active jobs (not delivered/cancelled)
  const activeJobs = jobs.filter(
    (j: Record<string, unknown>) => j.status !== "delivered" && j.status !== "cancelled"
  )

  const todayJobs = activeJobs.filter((j: Record<string, unknown>) => {
    const d = new Date(j.created_at as string).toDateString()
    return d === new Date().toDateString()
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="รับรถเข้าซ่อม"
        action={
          <Link
            href="/dashboard/jobs"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> เปิด Job ใหม่
          </Link>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 px-6 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">งานวันนี้</p>
          <p className="mt-1 text-2xl font-bold text-primary">{todayJobs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">งานที่ยังเปิดอยู่</p>
          <p className="mt-1 text-2xl font-bold">{activeJobs.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-6">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" name="search" placeholder="ค้นหาเลข Job, ทะเบียน, ชื่อลูกค้า..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </form>
      </div>

      {/* Active Jobs */}
      <div className="px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeJobs.map((job: Record<string, unknown>) => {
            const customer = job.customers as Record<string, unknown> | null
            const vehicle = job.vehicles as Record<string, unknown> | null
            const status = job.status as string

            return (
              <Link
                key={job.id as string}
                href={`/dashboard/jobs/${job.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{job.job_number as string}</span>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusConfig[status]?.color || "bg-muted text-muted-foreground"
                  )}>
                    {statusConfig[status]?.label || status}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{customer?.name as string || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicle?.license_plate as string || "-"} {vehicle?.brand as string} {vehicle?.model as string}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateShort(job.created_at as string)}</span>
                  </div>
                  {job.description ? (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{String(job.description)}</span>
                    </div>
                  ) : null}
                </div>
              </Link>
            )
          })}
          {activeJobs.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีงานที่เปิดอยู่
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
