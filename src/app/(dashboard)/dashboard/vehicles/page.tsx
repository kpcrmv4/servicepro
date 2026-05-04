import { Plus, Search, Car } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { getVehicles } from "@/lib/actions/vehicles"
import { VehiclesTable } from "@/components/vehicles/vehicles-table"

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const vehicles = await getVehicles(params.search)

  const breadcrumb = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "รถยนต์" },
  ]

  return (
    <>
      <PageHeader
        title="รถยนต์"
        description={`ทั้งหมด ${vehicles.length.toLocaleString()} คัน`}
        breadcrumb={breadcrumb}
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-primary)] hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            เพิ่มรถ
          </button>
        }
      />

      <div className="space-y-4 px-3 pb-6 sm:space-y-6 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">รถทั้งหมด</p>
            <p className="text-2xl font-bold">{vehicles.length.toLocaleString()}</p>
          </div>
        </div>

        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="ค้นหาทะเบียน ยี่ห้อ รุ่น..."
            defaultValue={params.search || ""}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <VehiclesTable vehicles={vehicles} search={params.search} />
      </div>
    </>
  )
}
