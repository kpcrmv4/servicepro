import { Building2, Users, CreditCard, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSuperAdminStats, getAllTenants } from "@/lib/actions/super-admin"
import { redirect } from "next/navigation"

export default async function SuperAdminDashboard() {
  const stats = await getSuperAdminStats()
  if (!stats) redirect("/login")

  const tenants = await getAllTenants()

  const cards = [
    { label: "ร้านค้าทั้งหมด", value: stats.tenantsCount, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "ผู้ใช้ทั้งหมด", value: stats.usersCount, icon: Users, color: "text-success", bg: "bg-success/10" },
    { label: "Active Tenants", value: stats.activeTenants, icon: CreditCard, color: "text-warning", bg: "bg-warning/10" },
    { label: "Trial Tenants", value: stats.trialTenants, icon: Activity, color: "text-blue-500", bg: "bg-blue-50" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมระบบ ServicePro ทั้งหมด</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-3xl font-bold">{card.value}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", card.bg)}>
                  <Icon className={cn("h-6 w-6", card.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Tenants */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">ร้านค้าล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่อร้าน</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผน</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {tenants.slice(0, 10).map((t: Record<string, unknown>) => (
                <tr key={t.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm font-medium">{t.name as string}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{t.slug as string}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t.plan as string || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.subscription_status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {t.subscription_status as string || "inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
