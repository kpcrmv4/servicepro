import { ArrowLeft, Car, User, Calendar, Wrench, DollarSign, Clock, Package, FileText } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getJob } from "@/lib/actions/jobs"
import { getQuotationByJobId } from "@/lib/actions/quotations"
import { checkCustomerLineLinked } from "@/lib/actions/line-link"
import Link from "next/link"
import { notFound } from "next/navigation"
import { JobStatusActions } from "@/components/jobs/job-status-actions"
import { ReceptionStatusActions } from "@/components/reception/reception-status-actions"
import { LineLinkCard } from "@/components/reception/line-link-card"

const receptionPhaseStatuses = ["pending", "diagnosing", "quoted"]

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "bg-warning/10 text-warning" },
  diagnosing: { label: "กำลังตรวจสอบ", color: "bg-purple-100 text-purple-700" },
  quoted: { label: "รอลูกค้าอนุมัติ", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "กำลังซ่อม", color: "bg-primary/10 text-primary" },
  quality_check: { label: "ตรวจ QC", color: "bg-purple-100 text-purple-700" },
  waiting_pickup: { label: "รอลูกค้ารับ", color: "bg-info/10 text-info" },
  completed: { label: "เสร็จแล้ว", color: "bg-success/10 text-success" },
  cancelled: { label: "ยกเลิก", color: "bg-error/10 text-error" },
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [job, quotation] = await Promise.all([
    getJob(id),
    getQuotationByJobId(id),
  ])

  const customerId = job?.customer_id as string | undefined
  const isLineLinked = customerId ? await checkCustomerLineLinked(customerId) : false

  if (!job) {
    notFound()
  }

  const customer = job.customers as Record<string, unknown> | null
  const vehicle = job.vehicles as Record<string, unknown> | null
  const technician = job.assigned_user as Record<string, unknown> | null
  const jobParts = (job.job_items as Record<string, unknown>[]) || []
  const status = job.status as string
  const quotationId = (job.quotation_id as string) || (quotation?.id as string) || null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-2 sm:px-6">
        <Link
          href={receptionPhaseStatuses.includes(status) ? "/dashboard/reception" : "/dashboard/jobs"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{job.job_number as string}</h1>
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              statusConfig[status]?.color || "bg-muted text-muted-foreground"
            )}>
              {statusConfig[status]?.label || status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            สร้างเมื่อ {formatDateShort(job.created_at as string)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-4 sm:gap-6 sm:px-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> รายละเอียดงาน
            </h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {job.description as string || "ไม่มีรายละเอียด"}
            </p>
          </div>

          {/* Parts Used */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> อะไหล่ที่ใช้
            </h2>
            {jobParts.length > 0 ? (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground">รายการ</th>
                    <th className="pb-2 text-center text-xs font-medium text-muted-foreground">จำนวน</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">ราคา/หน่วย</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {jobParts.map((jp: Record<string, unknown>, i: number) => {
                    const qty = Number(jp.quantity) || 0
                    const price = Number(jp.unit_price) || 0
                    return (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 text-sm">{(jp.description as string) || "-"}</td>
                        <td className="py-2 text-center text-sm">{qty}</td>
                        <td className="py-2 text-right text-sm text-muted-foreground">{formatCurrency(price)}</td>
                        <td className="py-2 text-right text-sm font-medium">{formatCurrency(qty * price)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มีอะไหล่</p>
            )}
          </div>

          {/* Cost Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> สรุปค่าใช้จ่าย
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าอะไหล่</span>
                <span>{formatCurrency(Number(job.total_parts_cost) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าแรง</span>
                <span>{formatCurrency(Number(job.total_labor_cost) || 0)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                <span>รวมทั้งหมด</span>
                <span className="text-primary">{formatCurrency(Number(job.grand_total) || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions - use reception or repair component based on phase */}
          {receptionPhaseStatuses.includes(status) ? (
            <ReceptionStatusActions jobId={job.id as string} currentStatus={status} quotationId={quotationId} />
          ) : (
            <JobStatusActions jobId={job.id as string} currentStatus={status} />
          )}

          {/* Quotation Info */}
          {quotation && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> ใบเสนอราคา
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เลขที่</span>
                  <Link
                    href={`/dashboard/jobs/${job.id}/quotation`}
                    className="font-medium text-primary hover:underline"
                  >
                    {quotation.quotation_number as string}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">สถานะ</span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    {
                      draft: "bg-muted text-muted-foreground",
                      sent: "bg-blue-100 text-blue-700",
                      approved: "bg-success/10 text-success",
                      rejected: "bg-error/10 text-error",
                      expired: "bg-warning/10 text-warning",
                    }[quotation.status as string] || "bg-muted text-muted-foreground"
                  )}>
                    {{
                      draft: "แบบร่าง",
                      sent: "ส่งแล้ว",
                      approved: "อนุมัติ",
                      rejected: "ไม่อนุมัติ",
                      expired: "หมดอายุ",
                    }[quotation.status as string] || quotation.status}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">ยอดรวม</span>
                  <span className="text-primary">{formatCurrency(Number(quotation.total) || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> ข้อมูลลูกค้า
            </h2>
            {customer ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{customer.name as string}</p>
                {customer.phone ? <p className="text-muted-foreground">{String(customer.phone)}</p> : null}
                {customer.email ? <p className="text-muted-foreground">{String(customer.email)}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
            )}
          </div>

          {/* LINE Link - show during reception phase */}
          {receptionPhaseStatuses.includes(status) && customer && (
            <LineLinkCard
              customerId={job.customer_id as string}
              customerName={customer.name as string}
              isLinked={isLineLinked}
            />
          )}

          {/* Vehicle Info */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" /> ข้อมูลรถ
            </h2>
            {vehicle ? (
              <div className="space-y-2 text-sm">
                <p className="font-bold text-primary">{vehicle.license_plate as string}</p>
                <p>{vehicle.brand as string} {vehicle.model as string}</p>
                {vehicle.year ? <p className="text-muted-foreground">ปี {String(vehicle.year)}</p> : null}
                {vehicle.color ? <p className="text-muted-foreground">สี: {String(vehicle.color)}</p> : null}
                {vehicle.vin ? <p className="text-muted-foreground font-mono text-xs">VIN: {String(vehicle.vin)}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> ไทม์ไลน์
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">สร้าง:</span>
                <span>{formatDateShort(job.created_at as string)}</span>
              </div>
              {job.estimated_completion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">เริ่มซ่อม:</span>
                  <span>{formatDateShort(job.estimated_completion as string)}</span>
                </div>
              )}
              {job.estimated_completion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">กำหนดเสร็จ:</span>
                  <span>{formatDateShort(job.estimated_completion as string)}</span>
                </div>
              )}
              {job.actual_completion && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-success" />
                  <span className="text-muted-foreground">เสร็จจริง:</span>
                  <span className="text-success font-medium">{formatDateShort(job.actual_completion as string)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Technician */}
          {technician && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">ช่างผู้รับผิดชอบ</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(technician.full_name as string)?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{technician.full_name as string}</p>
                  <p className="text-xs text-muted-foreground">{technician.email as string}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
