import { Search, Users, Crown, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getCustomers } from "@/lib/actions/customers"
import { AddCustomerButton } from "@/components/customers/customer-actions"
import { CustomersTable } from "@/components/customers/customers-table"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const customers = await getCustomers(params.search)

  const totalCustomers = customers.length
  const companies = customers.filter(
    (c: Record<string, unknown>) => c.type === "company",
  ).length
  const withMembership = customers.filter(
    (c: Record<string, unknown>) => c.membership_tier,
  ).length

  const summaryCards = [
    {
      label: "ลูกค้าทั้งหมด",
      value: totalCustomers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "นิติบุคคล",
      value: companies,
      icon: Building2,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: "สมาชิก",
      value: withMembership,
      icon: Crown,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ]

  const breadcrumb = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "ลูกค้า" },
  ]

  return (
    <>
      <PageHeader
        title="ลูกค้า"
        description={`ทั้งหมด ${totalCustomers.toLocaleString()} ราย`}
        breadcrumb={breadcrumb}
        action={<AddCustomerButton />}
      />

      <div className="space-y-4 px-3 pb-6 sm:space-y-6 sm:px-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-card-foreground">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      card.bg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", card.color)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search (form GET) */}
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="ค้นหาชื่อ เบอร์โทร อีเมล หรือทะเบียนรถ..."
            defaultValue={params.search || ""}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        {/* Table */}
        <CustomersTable customers={customers} search={params.search} />
      </div>
    </>
  )
}
