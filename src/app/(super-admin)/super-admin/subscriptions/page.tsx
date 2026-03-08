import { CreditCard, Building2 } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getAllTenants } from "@/lib/actions/super-admin"

const planConfig: Record<string, { label: string; color: string; price: number }> = {
  free: { label: "Free", color: "bg-muted text-muted-foreground", price: 0 },
  starter: { label: "Starter", color: "bg-blue-100 text-blue-700", price: 990 },
  pro: { label: "Pro", color: "bg-primary/10 text-primary", price: 2490 },
  premium: { label: "Premium", color: "bg-purple-100 text-purple-700", price: 4990 },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-success/10 text-success" },
  trial: { label: "Trial", color: "bg-warning/10 text-warning" },
  expired: { label: "Expired", color: "bg-error/10 text-error" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
}

export default async function SubscriptionsPage() {
  const tenants = await getAllTenants()

  const activeSubs = tenants.filter((t: Record<string, unknown>) => t.subscription_status === "active").length
  const trialSubs = tenants.filter((t: Record<string, unknown>) => t.subscription_status === "trial").length

  // Calculate MRR
  const mrr = tenants.reduce((sum: number, t: Record<string, unknown>) => {
    if (t.subscription_status !== "active") return sum
    const plan = t.plan as string || "free"
    return sum + (planConfig[plan]?.price || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">จัดการแผนและการสมัครสมาชิก</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">MRR (Monthly Recurring Revenue)</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(mrr)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          <p className="mt-1 text-2xl font-bold text-primary">{activeSubs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Trial</p>
          <p className="mt-1 text-2xl font-bold text-warning">{trialSubs}</p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold mb-4">การกระจายตามแผน</h3>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(planConfig).map(([key, config]) => {
            const count = tenants.filter((t: Record<string, unknown>) => (t.plan || "free") === key).length
            return (
              <div key={key} className="rounded-lg bg-muted/50 p-4 text-center">
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", config.color)}>
                  {config.label}
                </span>
                <p className="mt-2 text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(config.price)}/เดือน</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tenant Subscriptions Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold">รายละเอียด Subscription</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ร้านค้า</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผน</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เริ่มต้น</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมดอายุ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคา/เดือน</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: Record<string, unknown>) => {
                const plan = (t.plan as string) || "free"
                const status = (t.subscription_status as string) || "inactive"
                return (
                  <tr key={t.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t.name as string}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        planConfig[plan]?.color || "bg-muted text-muted-foreground"
                      )}>
                        {planConfig[plan]?.label || plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusConfig[status]?.color || "bg-muted text-muted-foreground"
                      )}>
                        {statusConfig[status]?.label || status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.subscription_start ? formatDateShort(t.subscription_start as string) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.subscription_end ? formatDateShort(t.subscription_end as string) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {formatCurrency(planConfig[plan]?.price || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                        เปลี่ยนแผน
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
