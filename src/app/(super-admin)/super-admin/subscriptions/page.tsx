"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  PlayCircle,
  PauseCircle,
  CalendarPlus,
  ArrowUpCircle,
  Loader2,
  TrendingUp,
} from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getAllTenants } from "@/lib/actions/super-admin"
import {
  getTrialStats,
  getTrialRegistrations,
  activateSubscription,
  extendTrial,
  suspendTenant,
  reactivateTenant,
} from "@/lib/actions/trial"

const planConfig: Record<string, { label: string; color: string; price: number }> = {
  starter: { label: "Starter", color: "bg-blue-50 text-blue-700", price: 1490 },
  professional: { label: "Professional", color: "bg-primary/10 text-primary", price: 2990 },
  enterprise: { label: "Enterprise", color: "bg-purple-50 text-purple-700", price: 5990 },
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "ใช้งาน", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  trial: { label: "ทดลอง", color: "bg-blue-50 text-blue-700", icon: Clock },
  expired: { label: "หมดอายุ", color: "bg-red-50 text-red-700", icon: XCircle },
  suspended: { label: "ระงับ", color: "bg-slate-100 text-slate-600", icon: PauseCircle },
  cancelled: { label: "ยกเลิก", color: "bg-red-50 text-red-600", icon: XCircle },
}

export default function SubscriptionsPage() {
  const [tenants, setTenants] = useState<Record<string, unknown>[]>([])
  const [trialRegs, setTrialRegs] = useState<Record<string, unknown>[]>([])
  const [trialStats, setTrialStats] = useState({ total: 0, active: 0, converted: 0, expired: 0, conversionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"subscriptions" | "trials">("subscriptions")

  // Modal state
  const [modal, setModal] = useState<{
    type: "activate" | "extend" | "suspend" | "reactivate" | null
    tenantId: string
    tenantName: string
  }>({ type: null, tenantId: "", tenantName: "" })
  const [modalPlan, setModalPlan] = useState("professional")
  const [modalDays, setModalDays] = useState(7)
  const [modalReason, setModalReason] = useState("")

  const loadData = useCallback(async () => {
    try {
      const [tenantsData, trialsData, statsData] = await Promise.all([
        getAllTenants(),
        getTrialRegistrations().catch(() => []),
        getTrialStats().catch(() => ({ total: 0, active: 0, converted: 0, expired: 0, conversionRate: 0 })),
      ])
      setTenants(tenantsData)
      setTrialRegs(trialsData)
      setTrialStats(statsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAction = async () => {
    if (!modal.type || !modal.tenantId) return
    setActionLoading(modal.tenantId)

    try {
      switch (modal.type) {
        case "activate":
          await activateSubscription(modal.tenantId, modalPlan)
          break
        case "extend":
          await extendTrial(modal.tenantId, modalDays)
          break
        case "suspend":
          await suspendTenant(modal.tenantId, modalReason)
          break
        case "reactivate":
          await reactivateTenant(modal.tenantId, modalPlan)
          break
      }
      await loadData()
      setModal({ type: null, tenantId: "", tenantName: "" })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTenants = tenants.filter((t) => {
    const status = t.subscription_status as string
    if (filter !== "all" && status !== filter) return false
    if (search) {
      const name = (t.name as string || "").toLowerCase()
      return name.includes(search.toLowerCase())
    }
    return true
  })

  const mrr = tenants.reduce((sum, t) => {
    if (t.subscription_status !== "active") return sum
    const plan = (t.subscription_plan as string) || "starter"
    return sum + (planConfig[plan]?.price || 0)
  }, 0)

  const activeSubs = tenants.filter((t) => t.subscription_status === "active").length
  const trialSubs = tenants.filter((t) => t.subscription_status === "trial").length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Subscriptions & Trials</h1>
        <p className="text-sm text-muted-foreground">จัดการ Subscription, Trial, และ Conversion</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">MRR</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-emerald-600">{formatCurrency(mrr)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Subscriptions</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-primary">{activeSubs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">กำลังทดลอง</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-blue-600">{trialSubs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold text-amber-600">{trialStats.conversionRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab("subscriptions")}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "subscriptions" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="inline h-4 w-4 mr-1.5" />
          Subscriptions ({tenants.length})
        </button>
        <button
          onClick={() => setTab("trials")}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "trials" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Clock className="inline h-4 w-4 mr-1.5" />
          Trial Registrations ({trialRegs.length})
        </button>
      </div>

      {tab === "subscriptions" && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="ค้นหาร้านค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {[
                { value: "all", label: "ทั้งหมด" },
                { value: "active", label: "ใช้งาน" },
                { value: "trial", label: "ทดลอง" },
                { value: "expired", label: "หมดอายุ" },
                { value: "suspended", label: "ระงับ" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ร้านค้า</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผน</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Trial หมดอายุ</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">ราคา/เดือน</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((t) => {
                    const plan = (t.subscription_plan as string) || "starter"
                    const status = (t.subscription_status as string) || "trial"
                    const statusCfg = statusConfig[status]
                    const StatusIcon = statusCfg?.icon || Clock
                    const trialEnd = t.trial_ends_at ? new Date(t.trial_ends_at as string) : null
                    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

                    return (
                      <tr key={t.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{t.name as string}</p>
                              <p className="text-xs text-muted-foreground font-mono">{t.slug as string}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", planConfig[plan]?.color || "bg-muted text-muted-foreground")}>
                            {planConfig[plan]?.label || plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", statusCfg?.color || "bg-muted text-muted-foreground")}>
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {status === "trial" && trialEnd ? (
                            <div>
                              <p className="text-xs">{formatDateShort(trialEnd.toISOString())}</p>
                              <p className={cn("text-xs font-medium", daysLeft !== null && daysLeft <= 2 ? "text-red-600" : "text-amber-600")}>
                                {daysLeft === 0 ? "หมดวันนี้" : `อีก ${daysLeft} วัน`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {status === "active" ? formatCurrency(planConfig[plan]?.price || 0) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {status === "trial" && (
                              <>
                                <button
                                  onClick={() => setModal({ type: "activate", tenantId: t.id as string, tenantName: t.name as string })}
                                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title="เปิดใช้งานจริง"
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setModal({ type: "extend", tenantId: t.id as string, tenantName: t.name as string })}
                                  className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="ขยาย Trial"
                                >
                                  <CalendarPlus className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {status === "active" && (
                              <button
                                onClick={() => setModal({ type: "suspend", tenantId: t.id as string, tenantName: t.name as string })}
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition-colors"
                                title="ระงับ"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </button>
                            )}
                            {(status === "suspended" || status === "expired") && (
                              <button
                                onClick={() => setModal({ type: "reactivate", tenantId: t.id as string, tenantName: t.name as string })}
                                className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                                title="เปิดใช้งานใหม่"
                              >
                                <ArrowUpCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredTenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        ไม่พบข้อมูล
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "trials" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <h3 className="font-bold">ประวัติการสมัครทดลอง</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่ออู่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อีเมล</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จังหวัด</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ขนาด</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผนที่เลือก</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                {trialRegs.map((reg) => {
                  const regStatus = reg.status as string
                  return (
                    <tr key={reg.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">{reg.shop_name as string}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{reg.email as string}</td>
                      <td className="px-4 py-3 text-center text-sm">{reg.shop_province as string}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {reg.shop_size as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", planConfig[reg.selected_plan as string]?.color || "bg-muted text-muted-foreground")}>
                          {planConfig[reg.selected_plan as string]?.label || (reg.selected_plan as string)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          regStatus === "active" ? "bg-blue-50 text-blue-700" :
                          regStatus === "converted" ? "bg-emerald-50 text-emerald-700" :
                          "bg-red-50 text-red-700"
                        )}>
                          {regStatus === "active" ? "ทดลอง" : regStatus === "converted" ? "เปลี่ยนแล้ว" : "หมดอายุ"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {reg.created_at ? formatDateShort(reg.created_at as string) : "-"}
                      </td>
                    </tr>
                  )
                })}
                {trialRegs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      ยังไม่มีการสมัครทดลอง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">
              {modal.type === "activate" && "เปิดใช้งาน Subscription"}
              {modal.type === "extend" && "ขยายระยะเวลา Trial"}
              {modal.type === "suspend" && "ระงับ Subscription"}
              {modal.type === "reactivate" && "เปิดใช้งานใหม่"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              ร้าน: <strong>{modal.tenantName}</strong>
            </p>

            {(modal.type === "activate" || modal.type === "reactivate") && (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium">เลือกแพ็กเกจ</label>
                {Object.entries(planConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setModalPlan(key)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      modalPlan === key ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{config.label}</span>
                      <span className="text-sm font-bold">{formatCurrency(config.price)}/เดือน</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {modal.type === "extend" && (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium">จำนวนวันที่ต้องการขยาย</label>
                <div className="flex gap-2">
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setModalDays(d)}
                      className={cn(
                        "flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all",
                        modalDays === d ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30"
                      )}
                    >
                      {d} วัน
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modal.type === "suspend" && (
              <div className="space-y-3 mb-4">
                <label className="block text-sm font-medium">เหตุผลในการระงับ (ไม่บังคับ)</label>
                <textarea
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="ระบุเหตุผล..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    การระงับจะทำให้ร้านค้าไม่สามารถเข้าใช้งานระบบได้ แต่ข้อมูลจะยังคงอยู่
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModal({ type: null, tenantId: "", tenantName: "" })}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAction}
                disabled={!!actionLoading}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
                  modal.type === "suspend" ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/90"
                )}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  <>
                    {modal.type === "activate" && "เปิดใช้งาน"}
                    {modal.type === "extend" && `ขยาย ${modalDays} วัน`}
                    {modal.type === "suspend" && "ระงับ"}
                    {modal.type === "reactivate" && "เปิดใช้งานใหม่"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
