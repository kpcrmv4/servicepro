"use client"

import { useState } from "react"
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
  BarChart3,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type TabKey = "invoices" | "receipts" | "expenses" | "reports"
type InvoiceStatus = "paid" | "pending" | "overdue"
type ReceiptStatus = "issued" | "voided"

const summaryCards = [
  { label: "รายรับเดือนนี้", value: 487500, icon: TrendingUp, color: "text-success", bg: "bg-success/10", trend: "+12.5%" },
  { label: "รายจ่าย", value: 198300, icon: TrendingDown, color: "text-error", bg: "bg-error/10", trend: "+3.2%" },
  { label: "กำไร", value: 289200, icon: DollarSign, color: "text-primary", bg: "bg-primary/10", trend: "+18.7%" },
  { label: "ลูกหนี้ค้าง", value: 125800, icon: AlertCircle, color: "text-warning", bg: "bg-warning/10", trend: "4 ราย" },
]

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "invoices", label: "ใบแจ้งหนี้", icon: FileText },
  { key: "receipts", label: "ใบเสร็จ", icon: Receipt },
  { key: "expenses", label: "ค่าใช้จ่าย", icon: CreditCard },
  { key: "reports", label: "รายงาน", icon: BarChart3 },
]

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  paid: { label: "ชำระแล้ว", color: "bg-success/10 text-success" },
  pending: { label: "รอชำระ", color: "bg-warning/10 text-warning" },
  overdue: { label: "เกินกำหนด", color: "bg-error/10 text-error" },
}

const mockInvoices = [
  { id: "INV-2026-0045", customer: "คุณสมชาย วงศ์สวัสดิ์", amount: 15800, status: "paid" as InvoiceStatus, date: "2026-03-05", dueDate: "2026-03-20" },
  { id: "INV-2026-0044", customer: "บ.ABC ทรานสปอร์ต จำกัด", amount: 48500, status: "pending" as InvoiceStatus, date: "2026-03-04", dueDate: "2026-03-19" },
  { id: "INV-2026-0043", customer: "คุณสุภาพร จันทร์เจริญ", amount: 8700, status: "paid" as InvoiceStatus, date: "2026-03-03", dueDate: "2026-03-18" },
  { id: "INV-2026-0042", customer: "คุณวิชัย ศรีสุข", amount: 32000, status: "overdue" as InvoiceStatus, date: "2026-02-15", dueDate: "2026-03-01" },
  { id: "INV-2026-0041", customer: "คุณอรุณ มีชัย", amount: 12500, status: "paid" as InvoiceStatus, date: "2026-03-02", dueDate: "2026-03-17" },
  { id: "INV-2026-0040", customer: "คุณนิตยา แสงจันทร์", amount: 45000, status: "pending" as InvoiceStatus, date: "2026-03-01", dueDate: "2026-03-16" },
  { id: "INV-2026-0039", customer: "บ.XYZ โลจิสติกส์ จำกัด", amount: 67800, status: "overdue" as InvoiceStatus, date: "2026-02-10", dueDate: "2026-02-25" },
  { id: "INV-2026-0038", customer: "คุณประเสริฐ ทองคำ", amount: 9800, status: "paid" as InvoiceStatus, date: "2026-02-28", dueDate: "2026-03-15" },
]

const mockReceipts = [
  { id: "REC-2026-0032", invoice: "INV-2026-0045", customer: "คุณสมชาย วงศ์สวัสดิ์", amount: 15800, method: "โอนเงิน", date: "2026-03-05", status: "issued" as ReceiptStatus },
  { id: "REC-2026-0031", invoice: "INV-2026-0043", customer: "คุณสุภาพร จันทร์เจริญ", amount: 8700, method: "เงินสด", date: "2026-03-03", status: "issued" as ReceiptStatus },
  { id: "REC-2026-0030", invoice: "INV-2026-0041", customer: "คุณอรุณ มีชัย", amount: 12500, method: "บัตรเครดิต", date: "2026-03-02", status: "issued" as ReceiptStatus },
  { id: "REC-2026-0029", invoice: "INV-2026-0038", customer: "คุณประเสริฐ ทองคำ", amount: 9800, method: "โอนเงิน", date: "2026-02-28", status: "issued" as ReceiptStatus },
  { id: "REC-2026-0028", invoice: "INV-2026-0035", customer: "คุณนภา รุ่งเรือง", amount: 22000, method: "เงินสด", date: "2026-02-25", status: "voided" as ReceiptStatus },
]

const mockExpenses = [
  { id: "EXP-001", description: "ค่าน้ำมันเครื่อง (สต็อก)", category: "วัสดุอะไหล่", amount: 28500, date: "2026-03-04" },
  { id: "EXP-002", description: "ค่าไฟฟ้า ก.พ. 69", category: "สาธารณูปโภค", amount: 8500, date: "2026-03-03" },
  { id: "EXP-003", description: "ค่าน้ำประปา ก.พ. 69", category: "สาธารณูปโภค", amount: 1200, date: "2026-03-03" },
  { id: "EXP-004", description: "เงินเดือนพนักงาน มี.ค. 69", category: "เงินเดือน", amount: 120000, date: "2026-03-01" },
  { id: "EXP-005", description: "ค่าเช่าสถานที่ มี.ค. 69", category: "ค่าเช่า", amount: 25000, date: "2026-03-01" },
  { id: "EXP-006", description: "ค่ากรองน้ำมัน (สต็อก)", category: "วัสดุอะไหล่", amount: 5600, date: "2026-02-28" },
  { id: "EXP-007", description: "ค่าอินเทอร์เน็ต มี.ค. 69", category: "สาธารณูปโภค", amount: 1500, date: "2026-03-01" },
  { id: "EXP-008", description: "ค่าอุปกรณ์ซ่อมบำรุง", category: "อุปกรณ์", amount: 8000, date: "2026-02-27" },
]

const expenseCategoryColors: Record<string, string> = {
  "วัสดุอะไหล่": "bg-blue-100 text-blue-700",
  "สาธารณูปโภค": "bg-amber-100 text-amber-700",
  "เงินเดือน": "bg-purple-100 text-purple-700",
  "ค่าเช่า": "bg-rose-100 text-rose-700",
  "อุปกรณ์": "bg-cyan-100 text-cyan-700",
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("invoices")
  const [search, setSearch] = useState("")

  return (
    <div className="space-y-6">
      <PageHeader title="การเงิน" />

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
              <p className="mt-2 text-xs text-muted-foreground">{card.trend}</p>
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
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6">
        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาใบแจ้งหนี้..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ลูกค้า</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่ออก</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ครบกำหนด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.filter((inv) => {
                      if (!search) return true
                      const s = search.toLowerCase()
                      return inv.id.toLowerCase().includes(s) || inv.customer.toLowerCase().includes(s)
                    }).map((inv) => (
                      <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{inv.id}</td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{inv.customer}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", invoiceStatusConfig[inv.status].color)}>
                            {invoiceStatusConfig[inv.status].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(inv.date)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(inv.dueDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Receipts Tab */}
        {activeTab === "receipts" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่ใบเสร็จ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อ้างอิง</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ลูกค้า</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ช่องทาง</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {mockReceipts.map((rec) => (
                    <tr key={rec.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{rec.id}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{rec.invoice}</td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{rec.customer}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(rec.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{rec.method}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(rec.date)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          rec.status === "issued" ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        )}>
                          {rec.status === "issued" ? "ออกแล้ว" : "ยกเลิก"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === "expenses" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รหัส</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รายการ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมวดหมู่</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{exp.id}</td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{exp.description}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          expenseCategoryColors[exp.category] || "bg-muted text-muted-foreground"
                        )}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(exp.amount)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(exp.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-4 py-3 text-right">
              <span className="text-sm text-muted-foreground">รวมทั้งหมด: </span>
              <span className="text-sm font-bold text-card-foreground">
                {formatCurrency(mockExpenses.reduce((sum, e) => sum + e.amount, 0))}
              </span>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-card-foreground">รายรับรายเดือน</h3>
              <p className="mt-1 text-xs text-muted-foreground">ม.ค. - มี.ค. 2569</p>
              <div className="mt-4 flex items-end gap-2">
                {[320000, 415000, 487500].map((val, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-primary/80"
                      style={{ height: `${(val / 500000) * 120}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{["ม.ค.", "ก.พ.", "มี.ค."][i]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-card-foreground">รายจ่ายตามหมวดหมู่</h3>
              <p className="mt-1 text-xs text-muted-foreground">เดือน มี.ค. 2569</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "เงินเดือน", pct: 60, color: "bg-purple-500" },
                  { label: "วัสดุอะไหล่", pct: 17, color: "bg-blue-500" },
                  { label: "ค่าเช่า", pct: 13, color: "bg-rose-500" },
                  { label: "สาธารณูปโภค", pct: 6, color: "bg-amber-500" },
                  { label: "อื่นๆ", pct: 4, color: "bg-gray-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="text-card-foreground font-medium">{item.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={cn("h-2 rounded-full", item.color)} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
