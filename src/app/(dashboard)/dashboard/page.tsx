import {
  DollarSign,
  Wrench,
  Clock,
  Users,
  AlertTriangle,
  Car,
  FileText,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { getDashboardStats, getRecentJobs } from "@/lib/actions/dashboard"
import { getParts } from "@/lib/actions/parts"
import { StatCard } from "@/components/ui/stat-card"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังซ่อม",
  quality_check: "ตรวจสอบ QC",
  waiting_pickup: "รอลูกค้ารับ",
  completed: "เสร็จแล้ว",
  cancelled: "ยกเลิก",
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  quality_check: "bg-purple-500",
  waiting_pickup: "bg-green-500",
  completed: "bg-emerald-600",
  cancelled: "bg-red-500",
}

export default async function DashboardPage() {
  const [stats, recentJobs, allParts] = await Promise.all([
    getDashboardStats(),
    getRecentJobs(5),
    getParts(),
  ])

  const lowStockParts = allParts.filter(
    (p: { stock_quantity: number; min_stock: number }) =>
      Number(p.stock_quantity) <= Number(p.min_stock)
  )

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const kpiCards: Array<{
    title: string
    value: string
    subtitle: string
    icon: typeof DollarSign
    tone: "mint" | "purple" | "amber" | "pink"
  }> = [
    {
      title: "รายรับเดือนนี้",
      value: formatCurrency(stats?.monthlyRevenue || 0),
      subtitle: `${stats?.pendingInvoicesCount || 0} ใบแจ้งหนี้ค้าง`,
      icon: DollarSign,
      tone: "mint",
    },
    {
      title: "งานที่กำลังดำเนินการ",
      value: String(stats?.activeJobs || 0),
      subtitle: `${stats?.completedToday || 0} เสร็จวันนี้`,
      icon: Wrench,
      tone: "purple",
    },
    {
      title: "งานรอดำเนินการ",
      value: String(stats?.jobsByStatus?.pending || 0),
      subtitle: `${stats?.totalJobs || 0} งานทั้งหมด`,
      icon: Clock,
      tone: "amber",
    },
    {
      title: "ลูกค้าทั้งหมด",
      value: String(stats?.customersCount || 0),
      subtitle: `${stats?.lowStockCount || 0} อะไหล่ใกล้หมด`,
      icon: Users,
      tone: "pink",
    },
  ]

  const totalJobs = stats?.totalJobs || 0

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* KPI Cards — pastel toned */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Job Status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">สถานะงาน</h2>
          <div className="mt-4 flex items-center justify-center gap-8">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-muted" strokeWidth="3" />
                {totalJobs > 0 && (
                  <>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="3"
                      strokeDasharray={`${((stats?.jobsByStatus?.in_progress || 0) / totalJobs) * 100} ${100 - ((stats?.jobsByStatus?.in_progress || 0) / totalJobs) * 100}`}
                      strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-yellow-500" strokeWidth="3"
                      strokeDasharray={`${((stats?.jobsByStatus?.pending || 0) / totalJobs) * 100} ${100 - ((stats?.jobsByStatus?.pending || 0) / totalJobs) * 100}`}
                      strokeDashoffset={`-${((stats?.jobsByStatus?.in_progress || 0) / totalJobs) * 100}`} />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="3"
                      strokeDasharray={`${((stats?.jobsByStatus?.completed || 0) / totalJobs) * 100} ${100 - ((stats?.jobsByStatus?.completed || 0) / totalJobs) * 100}`}
                      strokeDashoffset={`-${(((stats?.jobsByStatus?.in_progress || 0) + (stats?.jobsByStatus?.pending || 0)) / totalJobs) * 100}`} />
                  </>
                )}
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold">{totalJobs}</p>
                <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(stats?.jobsByStatus || {}).map(([key, count]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className={cn("h-3 w-3 rounded-full", statusColors[key] || "bg-gray-400")} />
                  <span className="text-muted-foreground">{statusLabels[key] || key}</span>
                  <span className="font-semibold ml-auto">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Finance Summary */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">สรุปการเงินเดือนนี้</h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium">รายรับ</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium">ค้างชำระ</span>
              </div>
              <span className="text-lg font-bold text-amber-600">
                {formatCurrency(stats?.pendingAmount || 0)}
              </span>
            </div>
            <Link
              href="/dashboard/finance"
              className="block text-center text-sm text-primary hover:underline"
            >
              ดูรายละเอียดการเงิน →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">งานล่าสุด</h2>
            <Link href="/dashboard/jobs" className="text-sm text-primary hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentJobs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                ยังไม่มีงาน
              </div>
            ) : (
              recentJobs.map((job: Record<string, unknown>) => (
                <Link
                  key={job.id as string}
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn("h-2 w-2 rounded-full shrink-0", statusColors[job.status as string] || "bg-gray-400")} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{job.job_number as string}</span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                        {job.type === 'maintenance' ? 'เช็คระยะ' : job.type === 'repair' ? 'ซ่อม' : job.type === 'insurance' ? 'ประกัน' : job.type as string}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {(job.customers as Record<string, unknown>)?.name as string || '-'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Car className="h-3 w-3" />
                      <span className="truncate">
                        {(job.vehicles as Record<string, unknown>)?.license_plate as string}{' '}
                        {(job.vehicles as Record<string, unknown>)?.brand as string}{' '}
                        {(job.vehicles as Record<string, unknown>)?.model as string}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium">{statusLabels[job.status as string] || job.status as string}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(job.assigned_user as Record<string, unknown>)?.full_name as string || 'ยังไม่กำหนด'}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Parts */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">อะไหล่ใกล้หมด</h2>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="divide-y divide-border">
            {lowStockParts.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                ไม่มีอะไหล่ใกล้หมด
              </div>
            ) : (
              lowStockParts.slice(0, 5).map((part: Record<string, unknown>) => (
                <div key={part.id as string} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{part.name as string}</p>
                    <p className="text-xs text-muted-foreground">{part.part_number as string}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      Number(part.stock_quantity) <= 2 ? "text-error" : "text-warning"
                    )}>
                      เหลือ {part.stock_quantity as number}
                    </p>
                    <p className="text-[10px] text-muted-foreground">ขั้นต่ำ {part.min_stock as number}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-5 py-3">
            <Link href="/dashboard/inventory" className="text-sm text-primary hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
