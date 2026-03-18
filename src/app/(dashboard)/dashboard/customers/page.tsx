import {
  Search,
  Users,
  Crown,
  Phone,
  Car,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getCustomers } from "@/lib/actions/customers"
import { AddCustomerButton } from "@/components/customers/customer-actions"
import Link from "next/link"

type MembershipTier = "bronze" | "silver" | "gold" | "platinum"

const tierConfig: Record<string, { label: string; color: string; bg: string }> = {
  bronze: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-100" },
  silver: { label: "Silver", color: "text-gray-600", bg: "bg-gray-200" },
  gold: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-100" },
  platinum: { label: "Platinum", color: "text-purple-600", bg: "bg-purple-100" },
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const customers = await getCustomers(params.search)

  const totalCustomers = customers.length
  const companies = customers.filter((c: Record<string, unknown>) => c.type === "company").length
  const withMembership = customers.filter((c: Record<string, unknown>) => c.membership_tier).length

  const summaryCards = [
    { label: "ลูกค้าทั้งหมด", value: totalCustomers.toString(), icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "นิติบุคคล", value: companies.toString(), icon: Car, color: "text-info", bg: "bg-info/10" },
    { label: "สมาชิก", value: withMembership.toString(), icon: Crown, color: "text-warning", bg: "bg-warning/10" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="ลูกค้า"
        action={<AddCustomerButton />}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-2 sm:gap-4 sm:px-6 lg:grid-cols-3">
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
      <div className="px-4 sm:px-6">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล, หรือทะเบียนรถ..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เบอร์โทร</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ประเภท</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จำนวนรถ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ใช้บริการ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ยอดสะสม</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ระดับสมาชิก</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">คะแนน</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: Record<string, unknown>) => {
                  const vehicles = (customer.vehicles as Array<Record<string, unknown>>) || []
                  const tier = customer.membership_tier as MembershipTier | null
                  const tierInfo = tier ? tierConfig[tier] : null

                  return (
                    <tr key={customer.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/customers/${customer.id}`} className="flex items-center gap-3 hover:underline">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(customer.name as string).charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-card-foreground">{customer.name as string}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone as string || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          customer.type === "company" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"
                        )}>
                          {customer.type === "company" ? "นิติบุคคล" : "บุคคล"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-card-foreground">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          {vehicles.length}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-card-foreground">{customer.total_visits as number || 0} ครั้ง</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-card-foreground">{formatCurrency(Number(customer.total_spending) || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        {tierInfo ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            tierInfo.bg,
                            tierInfo.color
                          )}>
                            <Crown className="h-3 w-3" />
                            {tierInfo.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-card-foreground">
                        {customer.loyalty_points as number || 0}
                      </td>
                    </tr>
                  )
                })}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {params.search ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีข้อมูลลูกค้า"}
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
