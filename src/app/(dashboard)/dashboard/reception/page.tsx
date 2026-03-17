import { Plus, Search, Car, User, Calendar, Wrench } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getReceptionJobs } from "@/lib/actions/reception"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "bg-warning/10 text-warning" },
  diagnosing: { label: "กำลังตรวจสอบ", color: "bg-purple-100 text-purple-700" },
  quoted: { label: "รอลูกค้าอนุมัติ", color: "bg-blue-100 text-blue-700" },
}

const tabFilters = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: "รอตรวจสอบ" },
  { value: "diagnosing", label: "กำลังตรวจสอบ" },
  { value: "quoted", label: "รอลูกค้าอนุมัติ" },
]

export default async function ReceptionPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const params = await searchParams
  const activeTab = params.status || "all"
  const jobs = await getReceptionJobs({
    search: params.search,
    status: activeTab !== "all" ? activeTab : undefined,
  })

  const allJobs = activeTab !== "all" ? await getReceptionJobs() : jobs

  const todayJobs = allJobs.filter((j: Record<string, unknown>) => {
    const d = new Date(j.created_at as string).toDateString()
    return d === new Date().toDateString()
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="รับรถเข้าอู่"
        action={
          <Link
            href="/dashboard/reception/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> รับรถใหม่
          </Link>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">รับรถวันนี้</p>
          <p className="mt-1 text-2xl font-bold text-primary">{todayJobs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">รอตรวจสอบ/เสนอราคา</p>
          <p className="mt-1 text-2xl font-bold">{allJobs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">รอลูกค้าอนุมัติ</p>
          <p className="mt-1 text-2xl font-bold text-info">{allJobs.filter((j: Record<string, unknown>) => j.status === "quoted").length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 sm:px-6">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" name="search" placeholder="ค้นหาเลข Job, ทะเบียน, ชื่อลูกค้า..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          {params.status && <input type="hidden" name="status" value={params.status} />}
        </form>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 max-w-2xl">
          {tabFilters.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/reception?status=${tab.value}${params.search ? `&search=${params.search}` : ""}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Reception Jobs */}
      <div className="px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: Record<string, unknown>) => {
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
          {jobs.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              ไม่มีรถที่รอดำเนินการ
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
