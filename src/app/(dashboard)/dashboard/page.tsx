import {
  Wrench,
  Users,
  CheckCircle2,
  AlertTriangle,
  Car,
  Package,
  FileText,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import {
  getDashboardStats,
  getRecentJobs,
  getMonthlyJobChart,
  getTenantInfo,
} from "@/lib/actions/dashboard"
import { getParts } from "@/lib/actions/parts"
import { HeroCard } from "@/components/dashboard/hero-card"
import { QuickStatRow } from "@/components/dashboard/quick-stat-row"
import { MonthlyJobsChart } from "@/components/dashboard/monthly-jobs-chart"
import { JobStatusDonut } from "@/components/dashboard/job-status-donut"
import Link from "next/link"

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
      Number(p.stock_quantity) <= Number(p.min_stock)
  )

  const monthlyJobsCount = monthlyChart.reduce((s, d) => s + d.created, 0)
  const lastMonthAvg = monthlyJobsCount > 0 ? monthlyJobsCount / new Date().getDate() : 0
  // Naive trend: compare today's daily run-rate vs the running average.
  // Real "vs last month" comparison would need historical data — keep
  // it simple for now so the badge feels alive.
  const today = new Date().getDate()
  const todayCount = monthlyChart[today - 1]?.created || 0
  const trendPercent = lastMonthAvg > 0
    ? ((todayCount - lastMonthAvg) / lastMonthAvg) * 100
    : 0

  const profile = tenantInfo as
    | {
        full_name?: string
        tenants?: { name?: string; settings?: Record<string, unknown> }
      }
    | null
  const greeting = greetingByHour(new Date().getHours())
  const userName = profile?.full_name || ""
  const initials = userName ? userName.charAt(0).toUpperCase() : "?"
  const shopName =
    (profile?.tenants?.settings as { brand?: { display_name?: string } })?.brand
      ?.display_name || profile?.tenants?.name || null

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Hero card */}
      <HeroCard
        greeting={`${greeting}${userName ? `, ${userName.split(" ")[0]}` : ""}`}
        shopName={shopName}
        monthlyRevenue={stats?.monthlyRevenue || 0}
        monthlyJobsCount={monthlyJobsCount}
        trendPercent={trendPercent}
        initials={initials}
      />

      {/* Quick stats */}
      <QuickStatRow
        stats={[
          {
            label: "งานที่ดำเนินการ",
            value: stats?.activeJobs || 0,
            hint: `เสร็จวันนี้ ${stats?.completedToday || 0}`,
            icon: Wrench,
            tone: "purple",
          },
          {
            label: "ลูกค้าทั้งหมด",
            value: stats?.customersCount || 0,
            hint: "ในระบบ",
            icon: Users,
            tone: "pink",
          },
          {
            label: "งานเสร็จเดือนนี้",
            value: stats?.jobsByStatus?.completed || 0,
            hint: `${stats?.totalJobs || 0} งานทั้งหมด`,
            icon: CheckCircle2,
            tone: "mint",
          },
        ]}
      />

      {/* Monthly chart */}
      <MonthlyJobsChart data={monthlyChart} />

      {/* Donut + Pending invoices */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        <JobStatusDonut jobsByStatus={stats?.jobsByStatus || {}} />

        {/* Finance summary */}
        <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">การเงิน</h2>
            <Link
              href="/dashboard/finance"
              className="text-xs text-primary hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-pastel-mint p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/30">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">รายรับเดือนนี้</p>
                  <p className="text-base font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-pastel-amber p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/30">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">ค้างชำระ</p>
                  <p className="text-base font-bold">{formatCurrency(stats?.pendingAmount || 0)}</p>
                </div>
              </div>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold dark:bg-black/30">
                {stats?.pendingInvoicesCount || 0} ใบ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent jobs + Low stock */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold sm:text-lg">งานล่าสุด</h2>
            <Link
              href="/dashboard/jobs"
              className="text-xs text-primary hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="mt-3 space-y-2">
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
                    className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pastel-purple text-violet-600 dark:bg-pastel-purple dark:text-violet-300">
                      <Car className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground">
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
                        {(customer?.name as string) || "-"}
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
        <div className="rounded-3xl bg-card p-4 shadow-sm sm:p-6">
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
          <div className="mt-3 space-y-2">
            {lowStockParts.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                ไม่มีอะไหล่ใกล้หมด
              </div>
            ) : (
              lowStockParts.slice(0, 5).map((part: Record<string, unknown>) => (
                <div
                  key={part.id as string}
                  className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-pastel-amber text-amber-600 dark:text-amber-300">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {part.name as string}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {(part.part_number as string) || "-"}
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
                      เหลือ {part.stock_quantity as number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      ขั้นต่ำ {part.min_stock as number}
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
