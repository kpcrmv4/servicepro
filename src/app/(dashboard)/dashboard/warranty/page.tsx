import {
  Plus,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import {
  getWarrantyPolicies,
  getWarrantyRecords,
  getWarrantyClaims,
} from "@/lib/actions/warranty"
import { PolicySection } from "@/components/warranty/policy-section"
import Link from "next/link"

// =============================================================================
// Tab Definitions
// =============================================================================

const TABS = [
  { key: "policies", label: "นโยบาย" },
  { key: "records", label: "การรับประกัน" },
  { key: "claims", label: "เคลมรับประกัน" },
] as const

// =============================================================================
// Status Configs
// =============================================================================

const claimStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-warning/10 text-warning" },
  approved: { label: "อนุมัติ", color: "bg-success/10 text-success" },
  in_progress: { label: "กำลังดำเนินการ", color: "bg-info/10 text-info" },
  completed: { label: "เสร็จสิ้น", color: "bg-success/10 text-success" },
  rejected: { label: "ปฏิเสธ", color: "bg-error/10 text-error" },
}

const warrantyStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "ใช้งาน", color: "bg-success/10 text-success" },
  expired: { label: "หมดอายุ", color: "bg-muted text-muted-foreground" },
  claimed: { label: "เคลมแล้ว", color: "bg-info/10 text-info" },
  voided: { label: "ยกเลิก", color: "bg-error/10 text-error" },
}

// =============================================================================
// Page Component
// =============================================================================

export default async function WarrantyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "policies"
  const search = params.search || ""
  const statusFilter = params.status || "all"

  // Fetch data based on active tab
  const policies = activeTab === "policies" ? await getWarrantyPolicies() : []
  const records = activeTab === "records" ? await getWarrantyRecords({ status: statusFilter, search }) : []
  const claims = activeTab === "claims" ? await getWarrantyClaims({ status: statusFilter }) : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="การรับประกัน"
        description="จัดการนโยบาย การรับประกัน และเคลมรับประกัน"
        action={
          activeTab === "claims" ? (
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" /> สร้างเคลม
            </button>
          ) : undefined
        }
      />

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6 pb-px">
        {TABS.map(tab => (
          <Link
            key={tab.key}
            href={`/dashboard/warranty?tab=${tab.key}`}
            className={cn(
              "shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-primary bg-primary/5 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Tab: นโยบาย (Policies) */}
      {/* ============================================================ */}
      {activeTab === "policies" && (
        <PolicySection policies={policies} />
      )}

      {/* ============================================================ */}
      {/* Tab: การรับประกัน (Records) */}
      {/* ============================================================ */}
      {activeTab === "records" && (
        <>
          {/* Search Bar */}
          <div className="px-4 sm:px-6">
            <form className="flex gap-2">
              <input type="hidden" name="tab" value="records" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="ค้นหาเลข Job..."
                className="w-full max-w-sm rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="expired">หมดอายุ</option>
                <option value="claimed">เคลมแล้ว</option>
                <option value="voided">ยกเลิก</option>
              </select>
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                ค้นหา
              </button>
            </form>
          </div>

          {/* Records Table */}
          <div className="px-4 sm:px-6">
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Job</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า / รถ</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">นโยบาย</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">เริ่มต้น</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">สิ้นสุด</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record: Record<string, unknown>) => {
                    const job = record.jobs as Record<string, unknown> | null
                    const customer = job?.customers as Record<string, unknown> | null
                    const vehicle = job?.vehicles as Record<string, unknown> | null
                    const policy = record.warranty_policies as Record<string, unknown> | null
                    const statusCfg = warrantyStatusConfig[record.status as string]

                    return (
                      <tr
                        key={record.id as string}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-primary">
                            {(job?.job_number as string) || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-card-foreground">
                            {(customer?.name as string) || "-"}
                          </p>
                          {vehicle && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {vehicle.license_plate as string} {vehicle.brand as string} {vehicle.model as string}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(policy?.name as string) || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateShort(record.start_date as string)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateShort(record.end_date as string)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusCfg?.color || "bg-muted text-muted-foreground"
                            )}
                          >
                            {statusCfg?.label || (record.status as string)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2">ยังไม่มีรายการรับประกัน</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* Tab: เคลมรับประกัน (Claims) */}
      {/* ============================================================ */}
      {activeTab === "claims" && (
        <>
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto px-4 sm:px-6">
            {[
              { value: "all", label: "ทั้งหมด" },
              { value: "pending", label: "รอดำเนินการ" },
              { value: "approved", label: "อนุมัติ" },
              { value: "completed", label: "เสร็จสิ้น" },
              { value: "rejected", label: "ปฏิเสธ" },
            ].map(opt => (
              <Link
                key={opt.value}
                href={`/dashboard/warranty?tab=claims&status=${opt.value}`}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </Link>
            ))}
          </div>

          {/* Claims Table */}
          <div className="px-4 sm:px-6">
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">รายละเอียด</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ลูกค้า / รถ</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">นโยบาย</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ผู้สร้าง</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">สถานะ</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">วันที่</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim: Record<string, unknown>) => {
                    const warrantyRecord = claim.warranty_records as Record<string, unknown> | null
                    const wrJob = warrantyRecord?.jobs as Record<string, unknown> | null
                    const customer = wrJob?.customers as Record<string, unknown> | null
                    const vehicle = wrJob?.vehicles as Record<string, unknown> | null
                    const policy = warrantyRecord?.warranty_policies as Record<string, unknown> | null
                    const createdBy = claim.created_by_user as Record<string, unknown> | null
                    const statusCfg = claimStatusConfig[claim.status as string]

                    return (
                      <tr
                        key={claim.id as string}
                        className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-card-foreground line-clamp-2">
                            {claim.description as string}
                          </p>
                          {typeof claim.resolution === 'string' && claim.resolution && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              การแก้ไข: {claim.resolution as string}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-card-foreground">
                            {(customer?.name as string) || "-"}
                          </p>
                          {vehicle && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {vehicle.license_plate as string} {vehicle.brand as string} {vehicle.model as string}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(policy?.name as string) || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {(createdBy?.full_name as string) || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                              statusCfg?.color || "bg-muted text-muted-foreground"
                            )}
                          >
                            {statusCfg?.label || (claim.status as string)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateShort(claim.created_at as string)}
                        </td>
                      </tr>
                    )
                  })}
                  {claims.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2">ยังไม่มีรายการเคลม</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
