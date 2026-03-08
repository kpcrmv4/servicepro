import { Plus, Search, FileText, User, Car } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { createServerClient } from "@/lib/supabase/server"

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "แบบร่าง", color: "bg-muted text-muted-foreground" },
  sent: { label: "ส่งแล้ว", color: "bg-blue-100 text-blue-700" },
  approved: { label: "อนุมัติ", color: "bg-success/10 text-success" },
  rejected: { label: "ไม่อนุมัติ", color: "bg-error/10 text-error" },
  expired: { label: "หมดอายุ", color: "bg-warning/10 text-warning" },
}

export default async function QuotationsPage() {
  const supabase = await createServerClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return null

  // Get user profile for tenant_id
  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.user.id)
    .single()

  if (!profile?.tenant_id) return null

  const { data: quotations } = await supabase
    .from("quotations")
    .select("*, customers(name, phone), vehicles(license_plate, brand, model)")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })

  const items = quotations || []

  return (
    <div className="space-y-6">
      <PageHeader
        title="ใบเสนอราคา"
        action={
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> สร้างใบเสนอราคา
          </button>
        }
      />

      <div className="px-4 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ใบเสนอราคาทั้งหมด</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เลขที่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ลูกค้า</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">รถ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">วันที่</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">หมดอายุ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((q: Record<string, unknown>) => {
                  const customer = q.customers as Record<string, unknown> | null
                  const vehicle = q.vehicles as Record<string, unknown> | null
                  const status = q.status as string
                  return (
                    <tr key={q.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-primary">{q.quotation_number as string}</td>
                      <td className="px-4 py-3 text-sm">{customer?.name as string || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {vehicle ? `${vehicle.license_plate} ${vehicle.brand} ${vehicle.model}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(Number(q.total_amount) || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusConfig[status]?.color || "bg-muted text-muted-foreground"
                        )}>
                          {statusConfig[status]?.label || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(q.created_at as string)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{q.valid_until ? formatDateShort(q.valid_until as string) : "-"}</td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      ยังไม่มีใบเสนอราคา
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
