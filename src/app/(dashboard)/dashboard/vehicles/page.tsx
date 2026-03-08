import { Plus, Search, Car, Phone } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { getVehicles } from "@/lib/actions/vehicles"

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const vehicles = await getVehicles(params.search)

  return (
    <div className="space-y-6">
      <PageHeader
        title="รถยนต์"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มรถ
          </button>
        }
      />

      <div className="px-4 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">รถทั้งหมด</p>
            <p className="text-2xl font-bold">{vehicles.length}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <form className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" name="search" placeholder="ค้นหาทะเบียน, ยี่ห้อ, รุ่น..."
            defaultValue={params.search || ""}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </form>
      </div>

      <div className="px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ทะเบียน</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ยี่ห้อ / รุ่น</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ปี</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สี</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เจ้าของ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">เลขไมล์</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: Record<string, unknown>) => {
                  const customer = v.customers as Record<string, unknown> | null
                  return (
                    <tr key={v.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-mono font-medium text-primary">
                          {v.license_plate as string}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{v.brand as string} {v.model as string}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{(v.year as number) || "-"}</td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">{(v.color as string) || "-"}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{(customer?.name as string) || "-"}</p>
                        {customer?.phone ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{String(customer.phone)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {v.current_mileage ? `${Number(v.current_mileage).toLocaleString()} km` : "-"}
                      </td>
                    </tr>
                  )
                })}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      {params.search ? "ไม่พบรถที่ค้นหา" : "ยังไม่มีข้อมูลรถ"}
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
