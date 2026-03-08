import { Plus, Search, Shield, AlertTriangle, Car } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { createServerClient } from "@/lib/supabase/server"

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "ใช้งาน", color: "bg-success/10 text-success" },
  expired: { label: "หมดอายุ", color: "bg-error/10 text-error" },
  pending: { label: "รอดำเนินการ", color: "bg-warning/10 text-warning" },
}

export default async function InsurancePage() {
  const supabase = await createServerClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single()

  if (!profile?.tenant_id) return null

  const { data: claims } = await supabase
    .from("insurance_claims")
    .select("*, jobs(job_number), vehicles(license_plate, brand, model)")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })

  const items = claims || []

  const claimStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "รอดำเนินการ", color: "bg-warning/10 text-warning" },
    submitted: { label: "ยื่นแล้ว", color: "bg-blue-100 text-blue-700" },
    approved: { label: "อนุมัติ", color: "bg-success/10 text-success" },
    rejected: { label: "ปฏิเสธ", color: "bg-error/10 text-error" },
    paid: { label: "จ่ายแล้ว", color: "bg-primary/10 text-primary" },
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประกันภัย"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> เพิ่มเคลมประกัน
          </button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 px-6 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">เคลมทั้งหมด</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
              <p className="text-2xl font-bold">{items.filter((c: Record<string, unknown>) => c.status === "pending").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขเคลม</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">บริษัทประกัน</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขกรมธรรม์</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รถ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Job</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                </tr>
              </thead>
              <tbody>
                {items.map((claim: Record<string, unknown>) => {
                  const vehicle = claim.vehicles as Record<string, unknown> | null
                  const job = claim.jobs as Record<string, unknown> | null
                  const status = claim.status as string
                  return (
                    <tr key={claim.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{claim.claim_number as string}</td>
                      <td className="px-4 py-3 text-sm">{claim.insurance_company as string || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{claim.policy_number as string || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {vehicle ? `${vehicle.license_plate} ${vehicle.brand}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{job?.job_number as string || "-"}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(Number(claim.claim_amount) || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          claimStatusConfig[status]?.color || "bg-muted text-muted-foreground"
                        )}>
                          {claimStatusConfig[status]?.label || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(claim.created_at as string)}</td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      ยังไม่มีข้อมูลเคลมประกัน
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
