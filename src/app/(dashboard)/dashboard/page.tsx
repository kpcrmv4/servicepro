import {
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  Car,
  Package,
  FileText,
  Plus,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { cn, formatCurrency } from "@/lib/utils"
import {
  getDashboardStats,
  getRecentJobs,
  getMonthlyJobChart,
  getTenantInfo,
} from "@/lib/actions/dashboard"
import { getParts } from "@/lib/actions/parts"
import { MonthlyJobsChart } from "@/components/dashboard/monthly-jobs-chart"
import { JobStatusDonut } from "@/components/dashboard/job-status-donut"

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  diagnosing: "ตรวจสอบ",
  quoted: "รออนุมัติ",
  ready_to_repair: "พร้อมซ่อม",
  in_progress: "กำลังซ่อม",
  waiting_parts: "รออะไหล่",
  waiting_insurance: "รอประกัน",
  on_hold: "พักงาน",
  quality_check: "ตรวจ QC",
  waiting_pickup: "รอลูกค้ารับ",
  completed: "เสร็จแล้ว",
  cancelled: "ยกเลิก",
}

const statusDots: Record<string, string> = {
  pending: "bg-amber-400",
  diagnosing: "bg-purple-400",
  quoted: "bg-blue-400",
  ready_to_repair: "bg-emerald-400",
  in_progress: "bg-violet-500",
  waiting_parts: "bg-orange-400",
  waiting_insurance: "bg-amber-500",
  on_hold: "bg-slate-400",
  quality_check: "bg-purple-500",
  waiting_pickup: "bg-cyan-400",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
}

function greetingByHour(h: number): string {
  if (h < 12) return "อรุณสวัสดิ์"
  if (h < 17) return "สวัสดีตอนบ่าย"
  return "สวัสดีตอนเย็น"
}

export default async function DashboardPage() {
  const [stats, recentJobs, allParts, monthlyChart, tenantInfo] = await Promise.all([
    getDashboardStats(),
    getRecentJobs(6),
    getParts(),
    getMonthlyJobChart(),
    getTenantInfo(),
  ])

  const lowStockParts = allParts.filter(
    (p: { stock_quantity: number; min_stock: number }) =>
      Number(p.stock_quantity) <= Number(p.min_stock),
  )

  const profile = tenantInfo as
    | {
        full_name?: string
        tenants?: { name?: string; settings?: Record<string, unknown> }
      }
    | null
  const greeting = greetingByHour(new Date().getHours())
  const userName = profile?.full_name || ""
  const firstName = userName.split(" ")[0]
  const shopName =
    (profile?.tenants?.settings as { brand?: { display_name?: string } })?.brand
      ?.display_name || profile?.tenants?.name || null

  const todayDateLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const monthlyJobsCount = monthlyChart.reduce((s, d) => s + d.created, 0)

  // Stat tiles — white card with pastel gradient edge accent
  const stats4 = [
    {
      label: "งานวันนี้",
      value: stats?.activeJobs ?? 0,
      hint: `เสร็จวันนี้ ${stats?.completedToday ?? 0}`,
      icon: Wrench,
      iconBg: "bg-pastel-purple",
      iconColor: "text-violet-600 dark:text-violet-300",
      // RGB tuple for the pastel gradient + glow (matches CSS var --pastel-purple)
      pastel: "232, 226, 255",
    },
    {
      label: "รายรับเดือนนี้",
      value: formatCurrency(stats?.monthlyRevenue ?? 0),
      hint: `${monthlyJobsCount} งาน`,
      icon: TrendingUp,
      iconBg: "bg-pastel-mint",
      iconColor: "text-emerald-600 dark:text-emerald-300",
      pastel: "221, 245, 229",
    },
    {
      label: "ลูกค้าทั้งหมด",
      value: stats?.customersCount ?? 0,
      hint: "ในระบบ",
      icon: Users,
      iconBg: "bg-pastel-pink",
      iconColor: "text-pink-600 dark:text-pink-300",
      pastel: "255, 226, 238",
    },
    {
      label: "ค้างชำระ",
      value: formatCurrency(stats?.pendingAmount ?? 0),
      hint: `${stats?.pendingInvoicesCount ?? 0} ใบ`,
      icon: AlertTriangle,
      iconBg: "bg-pastel-amber",
      iconColor: "text-amber-600 dark:text-amber-300",
      pastel: "255, 239, 213",
    },
  ]

  return (
    <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-6">
      {/* Greeting bar — flat, no big hero gradient */}
      <header className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {todayDateLabel}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""} <span className="text-2xl">👋</span>
          </h1>
          {shopName && (
            <p className="mt-0.5 text-sm text-muted-foreground">{shopName}</p>
          )}
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-primary)] transition-colors hover:bg-primary/90 sm:h-10"
        >
          <Plus className="h-4 w-4" />
          สร้างงานซ่อม
        </Link>
      </header>

      {/* Stat tiles — white card with pastel gradient edge + soft pastel glow */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats4.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-resting)] sm:p-4"
              style={{
                boxShadow: `0 4px 24px -8px rgba(${s.pastel}, 0.9), var(--shadow-resting)`,
              }}
            >
              {/* Top edge gradient accent — pastel fade */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(to right, rgb(${s.pastel}), rgba(${s.pastel}, 0.4))`,
                }}
              />
              {/* Soft corner gradient wash */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl"
                style={{ background: `rgb(${s.pastel})` }}
              />

              <div className="relative flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-xl font-bold sm:text-2xl">{s.value}</p>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    s.iconBg,
                  )}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", s.iconColor)} />
                </div>
              </div>
              {s.hint && (
                <p className="relative mt-2 text-[11px] text-muted-foreground">
                  {s.hint}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Charts — chart 60% / donut 40% on desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthlyJobsChart data={monthlyChart} />
        </div>
        <div className="lg:col-span-2">
          <JobStatusDonut jobsByStatus={stats?.jobsByStatus || {}} />
        </div>
      </div>

      {/* Recent jobs + Low stock — side by side on desktop */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)] sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">งานล่าสุด</h2>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-primary hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {recentJobs.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีงาน
              </div>
            ) : (
              recentJobs.map((job: Record<string, unknown>) => {
                const customer = job.customers as Record<string, unknown> | null
                const vehicle = job.vehicles as Record<string, unknown> | null
                const technician = job.assigned_user as Record<string, unknown> | null
                const status = job.status as string
                return (
                  <Link
                    key={job.id as string}
                    href={`/dashboard/jobs/${job.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pastel-purple text-violet-600 dark:text-violet-300">
                      <Car className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {job.job_number as string}
                        </span>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            statusDots[status] || "bg-muted-foreground",
                          )}
                        />
                      </div>
                      <p className="truncate text-sm font-semibold">
                        {(customer?.name as string) || "—"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {(vehicle?.license_plate as string) || ""}{" "}
                        {(vehicle?.brand as string) || ""}{" "}
                        {(vehicle?.model as string) || ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-medium">
                        {statusLabels[status] || status}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(technician?.full_name as string) || "ยังไม่กำหนด"}
                      </p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)] sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
              อะไหล่ใกล้หมด
              {lowStockParts.length > 0 && (
                <span className="rounded-full bg-pastel-rose px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  {lowStockParts.length}
                </span>
              )}
            </h2>
            <Link
              href="/dashboard/inventory"
              className="text-xs text-primary hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="mt-3 space-y-1">
            {lowStockParts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500/60" />
                ไม่มีอะไหล่ใกล้หมด
              </div>
            ) : (
              lowStockParts.slice(0, 5).map((part: Record<string, unknown>) => (
                <div
                  key={part.id as string}
                  className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pastel-amber text-amber-600 dark:text-amber-300">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {part.name as string}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {(part.part_number as string) || "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        Number(part.stock_quantity) <= 2
                          ? "text-red-600"
                          : "text-amber-600",
                      )}
                    >
                      {part.stock_quantity as number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      / {part.min_stock as number}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
