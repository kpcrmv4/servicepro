import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getParts } from "@/lib/actions/parts"

type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

const statusConfig: Record<StockStatus, { label: string; color: string }> = {
  in_stock: { label: "มีของ", color: "bg-success/10 text-success" },
  low_stock: { label: "ใกล้หมด", color: "bg-warning/10 text-warning" },
  out_of_stock: { label: "หมด", color: "bg-error/10 text-error" },
}

function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "out_of_stock"
  if (stock <= minStock) return "low_stock"
  return "in_stock"
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>
}) {
  const params = await searchParams
  const parts = await getParts(params.search)

  const totalParts = parts.length
  const inStockCount = parts.filter((p: Record<string, unknown>) => getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "in_stock").length
  const lowStockCount = parts.filter((p: Record<string, unknown>) => getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "low_stock").length
  const outOfStockCount = parts.filter((p: Record<string, unknown>) => getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "out_of_stock").length

  const activeTab = params.tab || "all"

  const filteredParts = parts.filter((p: Record<string, unknown>) => {
    const status = getStockStatus(Number(p.stock_quantity), Number(p.min_stock))
    if (activeTab === "low" && status !== "low_stock") return false
    if (activeTab === "out" && status !== "out_of_stock") return false
    return true
  })

  const summaryCards = [
    { label: "อะไหล่ทั้งหมด", value: totalParts, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "มีสต็อก", value: inStockCount, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "ใกล้หมด", value: lowStockCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "หมดสต็อก", value: outOfStockCount, icon: XCircle, color: "text-error", bg: "bg-error/10" },
  ]

  const tabs = [
    { key: "all", label: "อะไหล่ทั้งหมด" },
    { key: "low", label: "ใกล้หมด" },
    { key: "out", label: "หมดสต็อก" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="คลังอะไหล่"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มอะไหล่
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
                  <p className="mt-1 text-2xl font-bold text-card-foreground">{card.value}</p>
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
          {tabs.map((tab) => (
            <a
              key={tab.key}
              href={`/dashboard/inventory?tab=${tab.key}${params.search ? `&search=${params.search}` : ""}`}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium text-center transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* Search + Table */}
      <div className="px-6">
        <form className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="ค้นหารหัสหรือชื่ออะไหล่..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {params.tab && <input type="hidden" name="tab" value={params.tab} />}
        </form>

        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รหัส</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่ออะไหล่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคาทุน</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคาขาย</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สต็อก</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ขั้นต่ำ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part: Record<string, unknown>) => {
                  const stock = Number(part.stock_quantity)
                  const minStock = Number(part.min_stock)
                  const status = getStockStatus(stock, minStock)

                  return (
                    <tr key={part.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{part.part_number as string}</td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{part.name as string}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          {part.category as string || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{formatCurrency(Number(part.cost_price) || 0)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(part.sell_price) || 0)}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-card-foreground">{stock}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{minStock}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusConfig[status].color
                        )}>
                          {statusConfig[status].label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredParts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {params.search ? "ไม่พบอะไหล่ที่ค้นหา" : "ยังไม่มีข้อมูลอะไหล่"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
