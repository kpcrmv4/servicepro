"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ShoppingCart,
  Filter,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type StockStatus = "in_stock" | "low_stock" | "out_of_stock"
type PartCategory = "น้ำมัน" | "กรอง" | "เบรก" | "จุดระเบิด" | "สายพาน" | "ช่วงล่าง" | "ไฟฟ้า" | "เครื่องยนต์" | "แอร์" | "อื่นๆ"
type TabKey = "all" | "low" | "out" | "order"

interface Part {
  id: string
  code: string
  name: string
  category: PartCategory
  costPrice: number
  sellPrice: number
  stock: number
  minStock: number
  status: StockStatus
}

const statusConfig: Record<StockStatus, { label: string; color: string }> = {
  in_stock: { label: "มีของ", color: "bg-success/10 text-success" },
  low_stock: { label: "ใกล้หมด", color: "bg-warning/10 text-warning" },
  out_of_stock: { label: "หมด", color: "bg-error/10 text-error" },
}

const mockParts: Part[] = [
  { id: "1", code: "OIL-001", name: "น้ำมันเครื่อง 5W-30 สังเคราะห์ (4L)", category: "น้ำมัน", costPrice: 850, sellPrice: 1200, stock: 45, minStock: 10, status: "in_stock" },
  { id: "2", code: "OIL-002", name: "น้ำมันเครื่อง 10W-40 (4L)", category: "น้ำมัน", costPrice: 550, sellPrice: 850, stock: 32, minStock: 10, status: "in_stock" },
  { id: "3", code: "OIL-003", name: "น้ำมันเกียร์ ATF (1L)", category: "น้ำมัน", costPrice: 280, sellPrice: 450, stock: 18, minStock: 5, status: "in_stock" },
  { id: "4", code: "FLT-001", name: "กรองน้ำมันเครื่อง Toyota", category: "กรอง", costPrice: 120, sellPrice: 250, stock: 25, minStock: 10, status: "in_stock" },
  { id: "5", code: "FLT-002", name: "กรองอากาศ Honda", category: "กรอง", costPrice: 180, sellPrice: 350, stock: 8, minStock: 10, status: "low_stock" },
  { id: "6", code: "FLT-003", name: "กรองแอร์ Universal", category: "กรอง", costPrice: 150, sellPrice: 300, stock: 3, minStock: 5, status: "low_stock" },
  { id: "7", code: "BRK-001", name: "ผ้าเบรกหน้า Toyota Vios/Yaris", category: "เบรก", costPrice: 450, sellPrice: 850, stock: 12, minStock: 5, status: "in_stock" },
  { id: "8", code: "BRK-002", name: "ผ้าเบรกหน้า Honda Civic", category: "เบรก", costPrice: 550, sellPrice: 950, stock: 0, minStock: 5, status: "out_of_stock" },
  { id: "9", code: "BRK-003", name: "จานเบรกหน้า Toyota Camry", category: "เบรก", costPrice: 1200, sellPrice: 1800, stock: 4, minStock: 3, status: "in_stock" },
  { id: "10", code: "SPK-001", name: "หัวเทียน NGK Iridium", category: "จุดระเบิด", costPrice: 180, sellPrice: 350, stock: 40, minStock: 20, status: "in_stock" },
  { id: "11", code: "SPK-002", name: "หัวเทียน Denso Platinum", category: "จุดระเบิด", costPrice: 200, sellPrice: 380, stock: 0, minStock: 10, status: "out_of_stock" },
  { id: "12", code: "BLT-001", name: "สายพานหน้าเครื่อง Toyota 1ZZ", category: "สายพาน", costPrice: 350, sellPrice: 650, stock: 6, minStock: 3, status: "in_stock" },
  { id: "13", code: "BLT-002", name: "สายพานไทม์มิ่ง Honda L15A", category: "สายพาน", costPrice: 1800, sellPrice: 2800, stock: 2, minStock: 3, status: "low_stock" },
  { id: "14", code: "SUS-001", name: "โช้คอัพหน้า Kayaba Toyota Vios", category: "ช่วงล่าง", costPrice: 1500, sellPrice: 2500, stock: 4, minStock: 4, status: "low_stock" },
  { id: "15", code: "ELC-001", name: "แบตเตอรี่ 3K 46B24L", category: "ไฟฟ้า", costPrice: 1800, sellPrice: 2800, stock: 8, minStock: 3, status: "in_stock" },
  { id: "16", code: "ENG-001", name: "ปะเก็นฝาสูบ Toyota 1NZ", category: "เครื่องยนต์", costPrice: 2200, sellPrice: 3500, stock: 1, minStock: 2, status: "low_stock" },
  { id: "17", code: "AC-001", name: "คอมเพรสเซอร์แอร์ Toyota Vios", category: "แอร์", costPrice: 4500, sellPrice: 7000, stock: 0, minStock: 1, status: "out_of_stock" },
  { id: "18", code: "OTH-001", name: "น้ำยาหม้อน้ำ (1L)", category: "อื่นๆ", costPrice: 80, sellPrice: 150, stock: 30, minStock: 10, status: "in_stock" },
]

const categories: PartCategory[] = ["น้ำมัน", "กรอง", "เบรก", "จุดระเบิด", "สายพาน", "ช่วงล่าง", "ไฟฟ้า", "เครื่องยนต์", "แอร์", "อื่นๆ"]

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "อะไหล่ทั้งหมด" },
  { key: "low", label: "ใกล้หมด" },
  { key: "out", label: "หมดสต็อก" },
  { key: "order", label: "สั่งซื้อ" },
]

const mockOrders = [
  { id: "PO-001", supplier: "บ.ไทยพาร์ท จำกัด", items: 5, total: 28500, status: "รอจัดส่ง", date: "2026-03-01" },
  { id: "PO-002", supplier: "บ.เอเชียออโต้ จำกัด", items: 3, total: 15200, status: "จัดส่งแล้ว", date: "2026-02-28" },
  { id: "PO-003", supplier: "บ.เจริญยนต์ จำกัด", items: 8, total: 42000, status: "รอยืนยัน", date: "2026-03-04" },
]

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<TabKey>("all")

  const totalParts = mockParts.length
  const inStockCount = mockParts.filter((p) => p.status === "in_stock").length
  const lowStockCount = mockParts.filter((p) => p.status === "low_stock").length
  const outOfStockCount = mockParts.filter((p) => p.status === "out_of_stock").length

  const summaryCards = [
    { label: "อะไหล่ทั้งหมด", value: totalParts, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "มีสต็อก", value: inStockCount, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "ใกล้หมด", value: lowStockCount, icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { label: "หมดสต็อก", value: outOfStockCount, icon: XCircle, color: "text-error", bg: "bg-error/10" },
  ]

  const filtered = mockParts.filter((p) => {
    if (activeTab === "low" && p.status !== "low_stock") return false
    if (activeTab === "out" && p.status !== "out_of_stock") return false
    if (category !== "all" && p.category !== category) return false
    if (search) {
      const s = search.toLowerCase()
      return p.code.toLowerCase().includes(s) || p.name.toLowerCase().includes(s)
    }
    return true
  })

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
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6">
        {activeTab === "order" ? (
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold text-card-foreground">รายการสั่งซื้อ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่ PO</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ซัพพลายเออร์</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จำนวนรายการ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">มูลค่า</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{order.id}</td>
                      <td className="px-4 py-3 text-sm text-card-foreground">{order.supplier}</td>
                      <td className="px-4 py-3 text-center text-sm text-card-foreground">{order.items}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          order.status === "จัดส่งแล้ว" ? "bg-success/10 text-success" :
                          order.status === "รอจัดส่ง" ? "bg-info/10 text-info" :
                          "bg-warning/10 text-warning"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* Search + Filter */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ค้นหารหัสหรือชื่ออะไหล่..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none rounded-lg border border-border bg-background py-2.5 pl-10 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 rounded-xl border border-border bg-card">
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((part) => (
                      <tr key={part.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 text-sm font-mono font-medium text-primary">{part.code}</td>
                        <td className="px-4 py-3 text-sm text-card-foreground">{part.name}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground">{formatCurrency(part.costPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(part.sellPrice)}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-card-foreground">{part.stock}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusConfig[part.status].color
                          )}>
                            {statusConfig[part.status].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          ไม่พบอะไหล่ที่ค้นหา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
