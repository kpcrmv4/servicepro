import { DollarSign, Wrench, Users, Car, TrendingUp, TrendingDown } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { getInvoices, getExpenses } from "@/lib/actions/finance"

export default async function ReportsPage() {
  const [statsResult, invoices, expenses] = await Promise.all([
    getDashboardStats(),
    getInvoices(),
    getExpenses(),
  ])
  const stats = statsResult || { activeJobs: 0, completedToday: 0, totalJobs: 0, monthlyRevenue: 0, customersCount: 0, lowStockCount: 0, pendingInvoicesCount: 0, pendingAmount: 0, jobsByStatus: {} }

  const totalRevenue = invoices
    .filter((inv: Record<string, unknown>) => inv.status === "paid")
    .reduce((sum: number, inv: Record<string, unknown>) => sum + Number(inv.total_amount || 0), 0)

  const totalExpenses = expenses
    .reduce((sum: number, exp: Record<string, unknown>) => sum + Number(exp.amount || 0), 0)

  const profit = totalRevenue - totalExpenses

  // Job status breakdown
  const jobStatusCounts: Record<string, number> = {}
  const statusLabels: Record<string, string> = {
    pending: "รอรับรถ",
    checked_in: "รับรถแล้ว",
    diagnosing: "ตรวจสอบ",
    in_progress: "กำลังซ่อม",
    waiting_parts: "รออะไหล่",
    completed: "เสร็จแล้ว",
    delivered: "ส่งมอบแล้ว",
    cancelled: "ยกเลิก",
  }

  // Invoice status breakdown
  const invoiceStatusCounts: Record<string, number> = {}
  const invoiceStatusLabels: Record<string, string> = {
    paid: "ชำระแล้ว",
    pending: "รอชำระ",
    overdue: "เกินกำหนด",
    cancelled: "ยกเลิก",
  }

  for (const inv of invoices) {
    const s = inv.status as string
    invoiceStatusCounts[s] = (invoiceStatusCounts[s] || 0) + 1
  }

  return (
    <div className="space-y-6">
      <PageHeader title="รายงาน" />

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">รายรับรวม</p>
              <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">รายจ่ายรวม</p>
              <p className="mt-1 text-2xl font-bold text-error">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-error/10">
              <TrendingDown className="h-6 w-6 text-error" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">กำไร</p>
              <p className={cn("mt-1 text-2xl font-bold", profit >= 0 ? "text-primary" : "text-error")}>
                {formatCurrency(profit)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 px-6 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
              <p className="text-xl font-bold">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">งานที่เปิดอยู่</p>
              <p className="text-xl font-bold">{stats.activeJobs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">ลูกค้า</p>
              <p className="text-xl font-bold">{stats.customersCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">รถ</p>
              <p className="text-xl font-bold">{stats.totalJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="px-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold mb-4">สถานะใบแจ้งหนี้</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(invoiceStatusLabels).map(([key, label]) => (
              <div key={key} className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold">{invoiceStatusCounts[key] || 0}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="px-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-lg font-semibold mb-4">ค่าใช้จ่ายตามหมวดหมู่</h3>
          {expenses.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(
                expenses.reduce((acc: Record<string, number>, exp: Record<string, unknown>) => {
                  const cat = (exp.category as string) || "อื่นๆ"
                  acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0)
                  return acc
                }, {} as Record<string, number>)
              ).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                  <span className="text-sm font-medium">{category}</span>
                  <span className="text-sm font-bold text-error">{formatCurrency(amount as number)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูลค่าใช้จ่าย</p>
          )}
        </div>
      </div>
    </div>
  )
}
