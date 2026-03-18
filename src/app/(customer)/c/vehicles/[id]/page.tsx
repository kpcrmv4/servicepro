import { ArrowLeft, Car, AlertTriangle, Calendar, Shield, FileText, Share2 } from "lucide-react"
import { formatCurrency, formatDateShort } from "@/lib/utils"
import { getVehicleServiceBook } from "@/lib/actions/customer-portal"
import { calculateVehicleHealthScore } from "@/lib/utils/vehicle-health"
import HealthScoreGauge from "@/components/customer/health-score-gauge"
import ServiceTimeline, { type TimelineEntry } from "@/components/customer/service-timeline"
import CostAnalytics from "@/components/customer/cost-analytics"
import ServiceBookShare from "./service-book-share"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function VehicleServiceBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getVehicleServiceBook(id)

  if (!data) {
    notFound()
  }

  const { vehicle, jobs, inspections, warranties, reminders, invoices, receipts, overdueReminders, inspectionAgeDays, latestInspection } = data

  // --- Health Score ---
  const inspectionItems = latestInspection
    ? ((latestInspection as Record<string, unknown>).inspection_items as Array<{ condition: string }>) || []
    : []

  const healthResult = calculateVehicleHealthScore({
    latestInspection: latestInspection ? { items: inspectionItems } : null,
    inspectionAgeDays,
    overdueReminders,
    vehicleYear: vehicle.year ? Number(vehicle.year) : null,
    activeWarranties: warranties.length,
  })

  // --- Timeline entries ---
  const timelineEntries: TimelineEntry[] = [
    ...jobs.map((job: Record<string, unknown>): TimelineEntry => {
      const jobItems = (job.job_items as Array<Record<string, unknown>>) || []
      const techUser = job.users as Record<string, unknown> | null
      return {
        type: "job",
        id: job.id as string,
        date: job.created_at as string,
        job_number: job.job_number as string,
        status: job.status as string,
        description: (job.description as string) || null,
        grand_total: Number(job.grand_total || 0),
        total_parts_cost: Number(job.total_parts_cost || 0),
        total_labor_cost: Number(job.total_labor_cost || 0),
        assigned_to_name: techUser ? (techUser.full_name as string) : null,
        job_items: jobItems.map((item) => ({
          id: item.id as string,
          type: item.type as string,
          description: item.description as string,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          total: Number(item.total || 0),
        })),
        job_timeline: ((job.job_timeline as Array<Record<string, unknown>>) || []).map((event) => ({
          id: event.id as string,
          status: event.status as string,
          notes: (event.notes as string) || null,
          created_at: event.created_at as string,
        })),
      }
    }),
    ...inspections.map((insp: Record<string, unknown>): TimelineEntry => {
      const items = (insp.inspection_items as Array<Record<string, unknown>>) || []
      return {
        type: "inspection",
        id: insp.id as string,
        date: insp.created_at as string,
        overall_score: insp.overall_score != null ? Number(insp.overall_score) : null,
        share_token: (insp.share_token as string) || null,
        notes: (insp.notes as string) || null,
        good_count: items.filter((i) => i.condition === "good").length,
        fair_count: items.filter((i) => i.condition === "fair").length,
        poor_count: items.filter((i) => i.condition === "poor").length,
      }
    }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // --- Cost analytics data ---
  const costJobs = jobs.map((job: Record<string, unknown>) => ({
    created_at: job.created_at as string,
    grand_total: Number(job.grand_total || 0),
    job_items: ((job.job_items as Array<Record<string, unknown>>) || []).map((item) => ({
      type: item.type as string,
      total: Number(item.total || 0),
    })),
  }))

  // --- Upcoming / overdue reminders ---
  const today = new Date().toISOString().split("T")[0]
  const overdueList = reminders.filter((r: Record<string, unknown>) => (r.trigger_date as string) < today)
  const upcomingList = reminders.filter((r: Record<string, unknown>) => (r.trigger_date as string) >= today).slice(0, 5)

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-muted active:bg-muted/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{vehicle.license_plate as string}</h1>
          <p className="text-xs text-muted-foreground truncate">
            {vehicle.brand as string} {vehicle.model as string} {vehicle.year ? `(${vehicle.year})` : ""}
          </p>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-lg font-bold text-primary">{vehicle.license_plate as string}</p>
            <p className="text-sm truncate">{vehicle.brand as string} {vehicle.model as string} {vehicle.year ? `(${vehicle.year})` : ""}</p>
            {vehicle.color && <p className="text-xs text-muted-foreground">สี: {vehicle.color as string}</p>}
            {vehicle.vin && <p className="text-xs text-muted-foreground font-mono truncate">VIN: {vehicle.vin as string}</p>}
            {vehicle.current_mileage && (
              <p className="text-xs text-muted-foreground">เลขไมล์: {Number(vehicle.current_mileage).toLocaleString()} km</p>
            )}
          </div>
        </div>
      </div>

      {/* Health Score */}
      <HealthScoreGauge
        score={healthResult.score}
        label={healthResult.label}
        color={healthResult.color}
        lastInspectionDate={latestInspection ? (latestInspection as Record<string, unknown>).created_at as string : undefined}
      />

      {/* Overdue Reminders */}
      {overdueList.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-error" /> เลยกำหนดดูแล
          </h2>
          <div className="space-y-2">
            {overdueList.map((r: Record<string, unknown>) => (
              <div key={r.id as string} className="rounded-xl border border-error/30 bg-error/5 p-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-error shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{(r.reminder_type as string) || (r.notes as string) || "กำหนดเช็ครถ"}</p>
                  <p className="text-xs text-error">{formatDateShort(r.trigger_date as string)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Reminders */}
      {upcomingList.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" /> กำหนดการดูแล
          </h2>
          <div className="space-y-2">
            {upcomingList.map((r: Record<string, unknown>) => (
              <div key={r.id as string} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{(r.reminder_type as string) || (r.notes as string) || "กำหนดเช็ครถ"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateShort(r.trigger_date as string)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Service Timeline */}
      <section>
        <h2 className="font-semibold text-foreground mb-2 text-sm">ประวัติการเข้ารับบริการ</h2>
        <ServiceTimeline entries={timelineEntries} />
      </section>

      {/* Warranties */}
      {warranties.length > 0 && (
        <section>
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-success" /> การรับประกัน
          </h2>
          <div className="space-y-2">
            {warranties.map((w: Record<string, unknown>) => {
              const policy = w.warranty_policies as Record<string, unknown> | null
              return (
                <div key={w.id as string} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{policy ? policy.name as string : "การรับประกัน"}</p>
                    <span className="rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-medium shrink-0">ใช้ได้</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {typeof w.start_date === "string" && <span>เริ่ม: {formatDateShort(w.start_date)}</span>}
                    {typeof w.end_date === "string" && <span>หมด: {formatDateShort(w.end_date)}</span>}
                  </div>
                  {policy && typeof policy.coverage_type === "string" && (
                    <p className="text-xs text-muted-foreground mt-1">ครอบคลุม: {
                      policy.coverage_type === "full" ? "ทั้งหมด" :
                      policy.coverage_type === "parts" ? "อะไหล่" :
                      policy.coverage_type === "labor" ? "ค่าแรง" : "จำกัด"
                    }</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Cost Analytics */}
      <section>
        <h2 className="font-semibold text-foreground mb-2 text-sm">สรุปค่าใช้จ่าย</h2>
        <CostAnalytics jobs={costJobs} />
      </section>

      {/* Documents */}
      {(invoices.length > 0 || receipts.length > 0) && (
        <section>
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" /> เอกสาร
          </h2>
          <div className="space-y-2">
            {invoices.map((inv: Record<string, unknown>) => (
              <div key={inv.id as string} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">ใบแจ้งหนี้ {(inv.invoice_number as string) || ""}</p>
                  <p className="text-xs text-muted-foreground">{formatDateShort(inv.created_at as string)}</p>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(Number(inv.total_amount || inv.grand_total || 0))}</span>
              </div>
            ))}
            {receipts.map((rcpt: Record<string, unknown>) => (
              <div key={rcpt.id as string} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">ใบเสร็จ {(rcpt.receipt_number as string) || ""}</p>
                  <p className="text-xs text-muted-foreground">{formatDateShort(rcpt.created_at as string)}</p>
                </div>
                <span className="text-sm font-medium text-foreground shrink-0">{formatCurrency(Number(rcpt.amount || 0))}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share Section */}
      <section className="pb-4">
        <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
          <Share2 className="h-4 w-4 text-primary" /> แชร์สมุดซ่อม
        </h2>
        <ServiceBookShare vehicleId={id} licensePlate={vehicle.license_plate as string} />
      </section>
    </div>
  )
}
