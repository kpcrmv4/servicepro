import { Plus, Search, Building2, Users, MapPin, Phone } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { getAllTenants } from "@/lib/actions/super-admin"

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const tenants = await getAllTenants(params.search)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ร้านค้า (Tenants)</h1>
          <p className="text-sm text-muted-foreground">จัดการร้านค้าทั้งหมดในระบบ</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> เพิ่มร้านค้า
        </button>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" name="search" placeholder="ค้นหาชื่อร้าน..."
          defaultValue={params.search || ""}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ร้านค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เบอร์โทร</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผน</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">สร้างเมื่อ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: Record<string, unknown>) => (
                <tr key={t.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name as string}</p>
                        {t.address ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{String(t.address).slice(0, 40)}...
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{t.slug as string}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {t.phone ? (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone as string}</span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.plan === "pro" ? "bg-primary/10 text-primary" :
                      t.plan === "premium" ? "bg-purple-100 text-purple-700" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {t.plan as string || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.subscription_status === "active" ? "bg-success/10 text-success" :
                      t.subscription_status === "trial" ? "bg-warning/10 text-warning" :
                      "bg-error/10 text-error"
                    )}>
                      {t.subscription_status as string || "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(t.created_at as string)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-foreground hover:bg-muted/80">
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    ไม่พบร้านค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
