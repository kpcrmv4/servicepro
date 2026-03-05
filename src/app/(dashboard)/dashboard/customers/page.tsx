"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Crown,
  Star,
  Phone,
  Car,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"

type MembershipTier = "Bronze" | "Silver" | "Gold"
type CustomerType = "บุคคล" | "นิติบุคคล"

interface Customer {
  id: string
  name: string
  phone: string
  type: CustomerType
  vehicleCount: number
  visitCount: number
  totalSpent: number
  tier: MembershipTier
  lastVisit: string
}

const tierConfig: Record<MembershipTier, { color: string; bg: string }> = {
  Bronze: { color: "text-amber-700", bg: "bg-amber-100" },
  Silver: { color: "text-gray-600", bg: "bg-gray-200" },
  Gold: { color: "text-yellow-600", bg: "bg-yellow-100" },
}

const mockCustomers: Customer[] = [
  { id: "C001", name: "คุณสมชาย วงศ์สวัสดิ์", phone: "081-234-5678", type: "บุคคล", vehicleCount: 2, visitCount: 15, totalSpent: 125800, tier: "Gold", lastVisit: "2026-03-05" },
  { id: "C002", name: "คุณสุภาพร จันทร์เจริญ", phone: "089-876-5432", type: "บุคคล", vehicleCount: 1, visitCount: 8, totalSpent: 42500, tier: "Silver", lastVisit: "2026-03-03" },
  { id: "C003", name: "บ.ABC ทรานสปอร์ต จำกัด", phone: "02-345-6789", type: "นิติบุคคล", vehicleCount: 12, visitCount: 45, totalSpent: 685000, tier: "Gold", lastVisit: "2026-03-04" },
  { id: "C004", name: "คุณวิชัย ศรีสุข", phone: "086-543-2109", type: "บุคคล", vehicleCount: 1, visitCount: 3, totalSpent: 18500, tier: "Bronze", lastVisit: "2026-02-15" },
  { id: "C005", name: "คุณอรุณ มีชัย", phone: "091-234-5678", type: "บุคคล", vehicleCount: 1, visitCount: 6, totalSpent: 35200, tier: "Silver", lastVisit: "2026-03-02" },
  { id: "C006", name: "คุณนิตยา แสงจันทร์", phone: "083-456-7890", type: "บุคคล", vehicleCount: 2, visitCount: 12, totalSpent: 98700, tier: "Gold", lastVisit: "2026-02-25" },
  { id: "C007", name: "บ.XYZ โลจิสติกส์ จำกัด", phone: "02-987-6543", type: "นิติบุคคล", vehicleCount: 8, visitCount: 28, totalSpent: 425000, tier: "Gold", lastVisit: "2026-03-05" },
  { id: "C008", name: "คุณประเสริฐ ทองคำ", phone: "084-567-8901", type: "บุคคล", vehicleCount: 1, visitCount: 4, totalSpent: 22800, tier: "Bronze", lastVisit: "2026-02-28" },
  { id: "C009", name: "คุณนภา รุ่งเรือง", phone: "092-345-6789", type: "บุคคล", vehicleCount: 1, visitCount: 7, totalSpent: 38900, tier: "Silver", lastVisit: "2026-03-01" },
  { id: "C010", name: "คุณสุรชัย พงศ์ไพร", phone: "085-678-9012", type: "บุคคล", vehicleCount: 3, visitCount: 18, totalSpent: 156000, tier: "Gold", lastVisit: "2026-03-03" },
  { id: "C011", name: "บ.เจริญยนต์ จำกัด", phone: "02-456-7890", type: "นิติบุคคล", vehicleCount: 5, visitCount: 15, totalSpent: 245000, tier: "Gold", lastVisit: "2026-02-20" },
  { id: "C012", name: "คุณพิมพ์ใจ สุขสันต์", phone: "087-890-1234", type: "บุคคล", vehicleCount: 1, visitCount: 2, totalSpent: 8500, tier: "Bronze", lastVisit: "2026-01-15" },
  { id: "C013", name: "คุณธนากร เจริญผล", phone: "088-901-2345", type: "บุคคล", vehicleCount: 2, visitCount: 10, totalSpent: 78500, tier: "Silver", lastVisit: "2026-03-04" },
  { id: "C014", name: "คุณมาลี ดวงดาว", phone: "090-123-4567", type: "บุคคล", vehicleCount: 1, visitCount: 5, totalSpent: 28900, tier: "Bronze", lastVisit: "2026-02-10" },
]

export default function CustomersPage() {
  const [search, setSearch] = useState("")

  const totalCustomers = mockCustomers.length
  const newThisMonth = 3
  const activeMembers = mockCustomers.filter((c) => c.tier !== "Bronze").length
  const avgReview = 4.6

  const summaryCards = [
    { label: "ลูกค้าทั้งหมด", value: totalCustomers.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "ลูกค้าใหม่เดือนนี้", value: newThisMonth.toString(), icon: UserPlus, color: "text-success", bg: "bg-success/10" },
    { label: "สมาชิก Active", value: activeMembers.toString(), icon: Crown, color: "text-warning", bg: "bg-warning/10" },
    { label: "คะแนนรีวิวเฉลี่ย", value: avgReview.toFixed(1), icon: Star, color: "text-info", bg: "bg-info/10" },
  ]

  const filtered = mockCustomers.filter((c) => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.phone.includes(s)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="ลูกค้า"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มลูกค้า
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

      {/* Search */}
      <div className="px-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือเบอร์โทร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เบอร์โทร</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ประเภท</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จำนวนรถ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ใช้บริการ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ยอดสะสม</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ระดับสมาชิก</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ใช้บริการล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {customer.name.charAt(customer.type === "นิติบุคคล" ? 2 : 5)}
                        </div>
                        <span className="text-sm font-medium text-card-foreground">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        customer.type === "นิติบุคคล" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"
                      )}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-card-foreground">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        {customer.vehicleCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-card-foreground">{customer.visitCount} ครั้ง</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(customer.totalSpent)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        tierConfig[customer.tier].bg,
                        tierConfig[customer.tier].color
                      )}>
                        <Crown className="h-3 w-3" />
                        {customer.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(customer.lastVisit)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      ไม่พบลูกค้าที่ค้นหา
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
