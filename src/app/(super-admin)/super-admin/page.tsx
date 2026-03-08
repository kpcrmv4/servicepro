import {
  Building2,
  Users,
  CreditCard,
  Activity,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { getSuperAdminStats, getAllTenants } from "@/lib/actions/super-admin"
import { getTrialStats, getExpiringTrials } from "@/lib/actions/trial"
import { redirect } from "next/navigation"

export default async function SuperAdminDashboard() {
  const stats = await getSuperAdminStats()
  if (!stats) redirect("/login")

  const tenants = await getAllTenants()

  let trialStats = { total: 0, active: 0, converted: 0, expired: 0, conversionRate: 0 }
  let expiringTrials: Record<string, unknown>[] = []
  try {
    trialStats = await getTrialStats()
    expiringTrials = await getExpiringTrials(3)
  } catch {
    // Trial tables might not exist yet
  }

  const mainCards = [
    { label: "ร้านค้าทั้งหมด", value: stats.tenantsCount, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "ผู้ใช้ทั้งหมด", value: stats.usersCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Subscriptions", value: stats.activeTenants, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "กำลังทดลองใช้", value: stats.trialTenants, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
  ]

  const trialCards = [
    { label: "ทดลองทั้งหมด", value: trialStats.total, color: "text-slate-700" },
    { label: "กำลังทดลอง", value: trialStats.active, color: "text-blue-600" },
    { label: "เปลี่ยนเป็นลูกค้า", value: trialStats.converted, color: "text-emerald-600" },
    { label: "Conversion Rate", value: `${trialStats.conversionRate}%`, color: "text-primary" },
  ]

  const statusColor: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    trial: "bg-blue-50 text-blue-700",
    expired: "bg-red-50 text-red-700",
    suspended: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-50 text-red-600",
  }

  const statusLabel: Record<string, string> = {
    active: "ใช้งาน",
    trial: "ทดลอง",
    expired: "หมดอายุ",
    suspended: "ระงับ",
    cancelled: "ยกเลิก",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Super Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">ภาพรวมระบบ KPServicePro ทั้งหมด</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-extrabold">{card.value}</p>
                </div>
                <div className={cn("flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl", card.bg)}>
                  <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", card.color)} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trial Funnel Stats */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Trial Conversion Funnel</h2>
          </div>
          <Link
            href="/super-admin/subscriptions"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {trialCards.map((card) => (
            <div key={card.label} className="rounded-lg bg-muted/50 p-3 text-center">
              <p className={cn("text-2xl font-extrabold", card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Trials Alert */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-sm">Trial ใกล้หมดอายุ (3 วัน)</h2>
            </div>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {expiringTrials.length} ร้าน
            </span>
          </div>
          <div className="divide-y divide-border">
            {expiringTrials.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                ไม่มี Trial ที่ใกล้หมดอายุ
              </div>
            ) : (
              expiringTrials.slice(0, 5).map((t) => {
                const endsAt = new Date(t.trial_ends_at as string)
                const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                return (
                  <div key={t.id as string} className="flex items-center justify-between px-4 py-3 sm:px-6">
                    <div>
                      <p className="text-sm font-medium">{t.name as string}</p>
                      <p className="text-xs text-muted-foreground">
                        แผน: {t.subscription_plan as string || "professional"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        daysLeft <= 1 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      )}>
                        <Clock className="inline h-3 w-3 mr-0.5" />
                        {daysLeft === 0 ? "หมดวันนี้" : `อีก ${daysLeft} วัน`}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Tenants */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
            <h2 className="font-bold text-sm">ร้านค้าล่าสุด</h2>
            <Link
              href="/super-admin/tenants"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {tenants.slice(0, 5).map((t: Record<string, unknown>) => {
              const status = (t.subscription_status as string) || "trial"
              return (
                <div key={t.id as string} className="flex items-center justify-between px-4 py-3 sm:px-6">
                  <div>
                    <p className="text-sm font-medium">{t.name as string}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.slug as string}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor[status] || "bg-muted text-muted-foreground")}>
                    {statusLabel[status] || status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
