import { ArrowLeft, Car, User, Wrench, Clock, Package, CheckCircle } from "lucide-react"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import { getJobByTrackingToken } from "@/lib/actions/customer-portal"
import { listAdditionalWorkByJobToken } from "@/lib/actions/additional-work"
import { CustomerAdditionalWorkList } from "@/components/jobs/customer-additional-work-list"
import Link from "next/link"
import { notFound } from "next/navigation"

const statusSteps = [
  { key: "pending", label: "รอรับรถ" },
  { key: "checked_in", label: "รับรถแล้ว" },
  { key: "diagnosing", label: "ตรวจสอบ" },
  { key: "in_progress", label: "กำลังซ่อม" },
  { key: "completed", label: "เสร็จแล้ว" },
  { key: "delivered", label: "ส่งมอบ" },
]

function getStepIndex(status: string): number {
  const idx = statusSteps.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : 0
}

export default async function TrackJobPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [job, additionalWork] = await Promise.all([
    getJobByTrackingToken(token),
    listAdditionalWorkByJobToken(token),
  ])

  if (!job) {
    notFound()
  }

  const customer = job.customers as Record<string, unknown> | null
  const vehicle = job.vehicles as Record<string, unknown> | null
  const technician = (job as Record<string, unknown>).users as Record<string, unknown> | null
  const jobParts = (job.job_items as Record<string, unknown>[]) || []
  const currentStep = getStepIndex(job.status as string)

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/c" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold">{job.job_number as string}</h1>
          <p className="text-xs text-muted-foreground">ติดตามสถานะงานซ่อม</p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{vehicle?.license_plate as string}</p>
            <p className="text-xs text-muted-foreground">{vehicle?.brand as string} {vehicle?.model as string}</p>
          </div>
        </div>
        {customer && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{customer.name as string}</span>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-4">สถานะงาน</h2>
        <div className="space-y-0">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStep
            const isCurrent = idx === currentStep
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted bg-background text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={cn("w-0.5 h-8", isCompleted ? "bg-primary" : "bg-muted")} />
                  )}
                </div>
                <div className="pb-8">
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                    {isCurrent && <span className="ml-2 text-xs text-primary">(ปัจจุบัน)</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Job Details */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" /> รายละเอียด
        </h2>
        <p className="text-sm text-muted-foreground">{job.description as string || "ไม่มีรายละเอียด"}</p>

        {technician && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">ช่าง:</span>
            <span className="font-medium">{technician.full_name as string}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>เปิดงาน: {formatDateShort(job.created_at as string)}</span>
        </div>
        {job.estimated_completion && (
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>กำหนดเสร็จ: {formatDateShort(job.estimated_completion as string)}</span>
          </div>
        )}
      </div>

      {/* Additional Work Requests — customer can approve/reject */}
      {additionalWork && additionalWork.length > 0 && (
        <CustomerAdditionalWorkList
          token={token}
          items={additionalWork as Array<{
            id: string;
            description: string;
            estimated_cost: number;
            photo_url: string | null;
            status: string;
          }>}
        />
      )}

      {/* Parts */}
      {jobParts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" /> อะไหล่ที่ใช้
          </h2>
          <div className="space-y-2">
            {jobParts.map((jp, i) => {
              const part = jp.parts as Record<string, unknown> | null
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span>{part?.name as string || "-"} x{Number(jp.quantity)}</span>
                  <span className="font-medium">{formatCurrency(Number(jp.unit_price) * Number(jp.quantity))}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Cost */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ค่าอะไหล่</span>
            <span>{formatCurrency(Number(job.total_parts_cost) || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ค่าแรง</span>
            <span>{formatCurrency(Number(job.total_labor_cost) || 0)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>รวมทั้งหมด</span>
            <span className="text-primary">{formatCurrency(Number(job.grand_total) || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
