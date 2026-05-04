import {
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  FileText,
  FolderOpen,
  History,
  Search,
  ShoppingBag,
  ShoppingCart,
  Gift,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import {
  getParts,
  getPartCategories,
  getSuppliers,
  getPurchaseOrders,
  getStockMovements,
  getExpiringBatches,
  getActiveJobs,
  getPosSales,
} from "@/lib/actions/parts"
import { getServicePackages } from "@/lib/actions/service-packages"
import Link from "next/link"
import { InventoryActions, EditPartButton, ReceivePOButton } from "@/components/inventory/inventory-actions"
import { CategoryManager } from "@/components/inventory/category-manager"
import { PackagesTab } from "@/components/inventory/package-dialog"

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

const poStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "ร่าง", color: "bg-muted text-muted-foreground" },
  sent: { label: "ส่งแล้ว", color: "bg-primary/10 text-primary" },
  partial: { label: "รับบางส่วน", color: "bg-warning/10 text-warning" },
  received: { label: "รับครบ", color: "bg-success/10 text-success" },
  cancelled: { label: "ยกเลิก", color: "bg-error/10 text-error" },
}

const movementTypeConfig: Record<string, { label: string; color: string }> = {
  in: { label: "นำเข้า", color: "text-success" },
  out: { label: "เบิกออก", color: "text-error" },
  adjustment: { label: "ปรับปรุง", color: "text-primary" },
  return: { label: "คืน", color: "text-warning" },
}

const tabs = [
  { key: "parts", label: "อะไหล่", icon: Package },
  { key: "orders", label: "ใบสั่งซื้อ", icon: ShoppingBag },
  { key: "history", label: "ประวัติเบิก", icon: History },
  { key: "categories", label: "หมวดหมู่", icon: FolderOpen },
  { key: "pos", label: "POS", icon: ShoppingCart },
  { key: "packages", label: "แพ็กเกจบริการ", icon: Gift },
]

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; stock?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "parts"

  const [parts, categories, suppliers, purchaseOrders, movements, expiringBatches, jobs, posSales, servicePackages] =
    await Promise.all([
      getParts(params.search),
      getPartCategories(),
      getSuppliers(),
      getPurchaseOrders(),
      getStockMovements(),
      getExpiringBatches(),
      getActiveJobs(),
      getPosSales(),
      getServicePackages(),
    ])

  // Summary counts
  const totalParts = parts.length
  const inStockCount = parts.filter((p: Record<string, unknown>) =>
    getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "in_stock").length
  const lowStockCount = parts.filter((p: Record<string, unknown>) =>
    getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "low_stock").length
  const outOfStockCount = parts.filter((p: Record<string, unknown>) =>
    getStockStatus(Number(p.stock_quantity), Number(p.min_stock)) === "out_of_stock").length

  const stockFilter = params.stock || "all"
  const filteredParts = parts.filter((p: Record<string, unknown>) => {
    const status = getStockStatus(Number(p.stock_quantity), Number(p.min_stock))
    if (stockFilter === "low" && status !== "low_stock") return false
    if (stockFilter === "out" && status !== "out_of_stock") return false
    return true
  })

  const summaryCards = [
    { label: "อะไหล่ทั้งหมด", value: totalParts, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "มีสต็อก", value: inStockCount, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "ใกล้หมด", value: lowStockCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "หมดสต็อก", value: outOfStockCount, icon: XCircle, color: "text-error", bg: "bg-error/10" },
  ]

  const categoryLabels: Record<string, string> = {}
  categories.forEach((c: Record<string, unknown>) => { categoryLabels[c.id as string] = c.name as string })

  return (
    <div className="space-y-6">
      <PageHeader
        title="คลังอะไหล่"
        breadcrumb={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "คลังอะไหล่" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/inventory/storage"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              📦 คลังจัดเก็บ 3D
            </a>
            <InventoryActions
              parts={parts}
              categories={categories}
              suppliers={suppliers}
              jobs={jobs}
              expiringBatches={expiringBatches}
            />
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-6">
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

      {/* Expiring batches alert */}
      {expiringBatches.length > 0 && (
        <div className="mx-4 rounded-lg border border-warning/30 bg-warning/5 p-3 sm:mx-6">
          <div className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" />
            อะไหล่ใกล้หมดอายุ ({expiringBatches.length} รายการ)
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {expiringBatches.slice(0, 5).map((b: Record<string, unknown>) => {
              const part = b.parts as Record<string, unknown> | null
              return (
                <span key={b.id as string} className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs text-warning">
                  {part?.name as string} - หมดอายุ {formatDateShort(b.expiry_date as string)} (เหลือ {Number(b.quantity_remaining)})
                </span>
              )
            })}
            {expiringBatches.length > 5 && (
              <span className="text-xs text-muted-foreground">+{expiringBatches.length - 5} รายการ</span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 sm:px-6">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={`/dashboard/inventory?tab=${tab.key}`}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6">
        {/* ==================== PARTS TAB ==================== */}
        {activeTab === "parts" && (
          <div className="space-y-4">
            {/* Stock filter + Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 rounded-lg bg-muted/50 p-0.5">
                {[
                  { key: "all", label: "ทั้งหมด" },
                  { key: "low", label: "ใกล้หมด" },
                  { key: "out", label: "หมด" },
                ].map((f) => (
                  <Link key={f.key}
                    href={`/dashboard/inventory?tab=parts&stock=${f.key}${params.search ? `&search=${params.search}` : ''}`}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      stockFilter === f.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {f.label}
                  </Link>
                ))}
              </div>
              <form className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" name="search" placeholder="ค้นหาอะไหล่..."
                  defaultValue={params.search || ""}
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="hidden" name="tab" value="parts" />
                {stockFilter !== "all" && <input type="hidden" name="stock" value={stockFilter} />}
              </form>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รหัส</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่ออะไหล่</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมวดหมู่</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ทุนเฉลี่ย</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคาขาย</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สต็อก</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part: Record<string, unknown>) => {
                      const stock = Number(part.stock_quantity)
                      const minStock = Number(part.min_stock)
                      const status = getStockStatus(stock, minStock)
                      const catName = (part.part_categories as Record<string, unknown>)?.name as string

                      return (
                        <tr key={part.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono text-sm">
                            <EditPartButton part={part} categories={categories} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-card-foreground">{part.name as string}</div>
                            {part.brand ? <div className="text-xs text-muted-foreground">{part.brand as string}</div> : null}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                              {catName || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground">{formatCurrency(Number(part.cost_price) || 0)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(part.selling_price) || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-card-foreground">{stock} <span className="text-xs text-muted-foreground">{part.unit as string}</span></td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", statusConfig[status].color)}>
                              {statusConfig[status].label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredParts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          {params.search ? "ไม่พบอะไหล่ที่ค้นหา" : "ยังไม่มีข้อมูลอะไหล่"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PURCHASE ORDERS TAB ==================== */}
        {activeTab === "orders" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่ PO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ซัพพลายเออร์</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">รายการ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ยอดรวม</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po: Record<string, unknown>) => {
                    const supplier = po.suppliers as Record<string, unknown> | null
                    const items = po.items as Array<Record<string, unknown>> || []
                    const status = po.status as string
                    const config = poStatusConfig[status] || poStatusConfig.draft

                    return (
                      <tr key={po.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{po.po_number as string}</td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{supplier?.name as string || "-"}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{items.length}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(po.total) || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", config.color)}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(po.created_at as string)}</td>
                        <td className="px-4 py-3 text-center">
                          {(status === 'draft' || status === 'sent' || status === 'partial') && (
                            <ReceivePOButton purchaseOrder={po} />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีใบสั่งซื้อ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== HISTORY TAB ==================== */}
        {activeTab === "history" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ประเภท</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อะไหล่</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จำนวน</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อ้างอิง</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมายเหตุ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">โดย</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m: Record<string, unknown>) => {
                    const part = m.parts as Record<string, unknown> | null
                    const job = m.jobs as Record<string, unknown> | null
                    const po = m.purchase_orders as Record<string, unknown> | null
                    const user = m.created_by_user as Record<string, unknown> | null
                    const typeConfig = movementTypeConfig[m.type as string] || movementTypeConfig.adjustment

                    return (
                      <tr key={m.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(m.created_at as string)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("text-xs font-medium", typeConfig.color)}>{typeConfig.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-card-foreground">{part?.name as string || "-"}</div>
                          <div className="text-xs text-muted-foreground">{part?.part_number as string || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium">
                          <span className={m.type === 'out' ? 'text-error' : 'text-success'}>
                            {m.type === 'out' ? '-' : '+'}{Number(m.quantity)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {job ? `Job: ${job.job_number}` : po ? `PO: ${po.po_number}` : m.reference as string || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{m.notes as string || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user?.full_name as string || "-"}</td>
                      </tr>
                    )
                  })}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีประวัติการเบิก/นำเข้า
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== CATEGORIES TAB ==================== */}
        {activeTab === "categories" && (
          <div className="rounded-xl border border-border bg-card p-4">
            <CategoryManager categories={categories} />
          </div>
        )}

        {/* ==================== POS TAB ==================== */}
        {activeTab === "pos" && (
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">รายการ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ยอดรวม</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ชำระ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ลูกค้า</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ผู้ขาย</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {posSales.map((sale: Record<string, unknown>) => {
                    const items = sale.items as Array<Record<string, unknown>> || []
                    const customer = sale.customers as Record<string, unknown> | null
                    const user = sale.created_by_user as Record<string, unknown> | null

                    return (
                      <tr key={sale.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-medium text-primary">{sale.sale_number as string}</td>
                        <td className="px-4 py-3 text-center text-sm text-muted-foreground">{items.length}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(sale.total) || 0)}</td>
                        <td className="px-4 py-3 text-center text-sm text-card-foreground">
                          {sale.payment_method === "cash" ? "เงินสด" :
                           sale.payment_method === "transfer" ? "โอนเงิน" :
                           sale.payment_method === "credit_card" ? "บัตรเครดิต" :
                           sale.payment_method === "promptpay" ? "PromptPay" :
                           sale.payment_method as string || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{customer?.name as string || "ลูกค้าทั่วไป"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{user?.full_name as string || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(sale.created_at as string)}</td>
                      </tr>
                    )
                  })}
                  {posSales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        ยังไม่มีประวัติการขาย
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== PACKAGES TAB ==================== */}
        {activeTab === "packages" && (
          <PackagesTab servicePackages={servicePackages} />
        )}
      </div>
    </div>
  )
}
