import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  FileText,
  Receipt,
  CreditCard,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getInvoices, getReceipts, getExpenses } from "@/lib/actions/finance"
import Link from "next/link"

type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled"

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  paid: { label: "ชำระแล้ว", color: "bg-success/10 text-success" },
  pending: { label: "รอชำระ", color: "bg-warning/10 text-warning" },
  overdue: { label: "เกินกำหนด", color: "bg-error/10 text-error" },
  cancelled: { label: "ยกเลิก", color: "bg-muted text-muted-foreground" },
}

const tabs = [
  { key: "invoices", label: "ใบแจ้งหนี้", icon: FileText },
  { key: "receipts", label: "ใบเสร็จ", icon: Receipt },
  { key: "expenses", label: "ค่าใช้จ่าย", icon: CreditCard },
]

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "invoices"

  const [invoices, receipts, expenses] = await Promise.all([
    getInvoices(),
    getReceipts(),
    getExpenses(),
  ])

  // Calculate summary
  const totalRevenue = invoices
    .filter((inv: Record<string, unknown>) => inv.status === "paid")
    .reduce((sum: number, inv: Record<string, unknown>) => sum + Number(inv.total_amount || 0), 0)

  const totalExpenses = expenses
    .reduce((sum: number, exp: Record<string, unknown>) => sum + Number(exp.amount || 0), 0)

  const profit = totalRevenue - totalExpenses

  const pendingAmount = invoices
    .filter((inv: Record<string, unknown>) => inv.status === "pending" || inv.status === "overdue")
    .reduce((sum: number, inv: Record<string, unknown>) => sum + Number(inv.total_amount || 0), 0)

  const summaryCards = [
    { label: "รายรับ", value: totalRevenue, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
    { label: "รายจ่าย", value: totalExpenses, icon: TrendingDown, color: "text-error", bg: "bg-error/10" },
    { label: "กำไร", value: profit, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "ลูกหนี้ค้าง", value: pendingAmount, icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="การเงิน"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> สร้างใบแจ้งหนี้
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-6 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">{formatCurrency(card.value)}</p>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.bg)}>
                  <Icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={`/dashboard/finance?tab=${tab.key}`}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === "invoices" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ลูกค้า</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่ออก</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">กำหนดชำระ</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: Record<string, unknown>) => {
                    const customer = inv.customers as Record<string, unknown> | null
                    const job = inv.jobs as Record<string, unknown> | null
                    const status = inv.status as InvoiceStatus

                    return (
                      <tr key={inv.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{inv.invoice_number as string}</td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{customer?.name as string || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{job?.job_number as string || "-"}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(inv.total_amount) || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                            invoiceStatusConfig[status]?.color || "bg-muted text-muted-foreground"
                          )}>
                            {invoiceStatusConfig[status]?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(inv.issue_date as string)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(inv.due_date as string)}</td>
                      </tr>
                    )
                  })}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีใบแจ้งหนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "receipts" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ใบแจ้งหนี้</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">วิธีชำระ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((rec: Record<string, unknown>) => {
                    const invoice = rec.invoices as Record<string, unknown> | null
                    return (
                      <tr key={rec.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{rec.receipt_number as string}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{invoice?.invoice_number as string || "-"}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(rec.amount) || 0)}</td>
                        <td className="px-4 py-3 text-center text-sm text-card-foreground">
                          {rec.payment_method === "cash" ? "เงินสด" :
                           rec.payment_method === "transfer" ? "โอนเงิน" :
                           rec.payment_method === "credit_card" ? "บัตรเครดิต" :
                           rec.payment_method as string || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(rec.payment_date as string)}</td>
                      </tr>
                    )
                  })}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีใบเสร็จ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมวดหมู่</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รายละเอียด</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp: Record<string, unknown>) => (
                    <tr key={exp.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {exp.category as string || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{exp.description as string || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-error">{formatCurrency(Number(exp.amount) || 0)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(exp.expense_date as string)}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีค่าใช้จ่าย
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
