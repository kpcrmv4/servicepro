import {
  ArrowLeft,
  Car,
  User,
  Wrench,
  Clock,
  Package,
  CheckCircle,
  PauseCircle,
} from "lucide-react"
import Image from "next/image"
import { cn, formatCurrency, formatDateShort } from "@/lib/utils"
import {
  getJobByTrackingToken,
  getJobTimelineByToken,
} from "@/lib/actions/customer-portal"
import { listAdditionalWorkByJobToken } from "@/lib/actions/additional-work"
import { getBrandByJobNumber } from "@/lib/actions/branding"
import { CustomerAdditionalWorkList } from "@/components/jobs/customer-additional-work-list"
import { BrandProvider } from "@/components/branding/brand-provider"
import { JOB_STATUS } from "@/lib/constants/status-config"
import Link from "next/link"
import { notFound } from "next/navigation"

// 7 ขั้นตอนหลักที่ลูกค้าควรเห็น (รวม "พร้อมซ่อม" และ "พักรอ" เป็น branch)
const customerSteps = [
  { key: "received", label: "รับรถเข้า", match: ["pending", "diagnosing", "quoted"] },
  { key: "ready_to_repair", label: "พร้อมซ่อม", match: ["ready_to_repair"] },
  { key: "in_progress", label: "กำลังซ่อม", match: ["in_progress"] },
  { key: "quality_check", label: "ตรวจ QC", match: ["quality_check"] },
  { key: "waiting_pickup", label: "รอลูกค้ารับ", match: ["waiting_pickup"] },
  { key: "completed", label: "เสร็จแล้ว", match: ["completed"] },
] as const

const HOLD_STATES = ["waiting_parts", "waiting_insurance", "on_hold"]

function getCustomerStepIndex(status: string): number {
  if (HOLD_STATES.includes(status)) return 2 // sit on "in_progress" but display hold banner
  for (let i = 0; i < customerSteps.length; i++) {
    if ((customerSteps[i].match as readonly string[]).includes(status)) return i
  }
  return 0
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

export default async function TrackJobPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const [job, additionalWork, timeline, brand] = await Promise.all([
    getJobByTrackingToken(token),
    listAdditionalWorkByJobToken(token),
    getJobTimelineByToken(token),
    getBrandByJobNumber(token),
  ])

  if (!job) notFound()

  const customer = job.customers as Record<string, unknown> | null
  const vehicle = job.vehicles as Record<string, unknown> | null
  const technician = (job as Record<string, unknown>).users as Record<string, unknown> | null
  const jobParts = (job.job_items as Record<string, unknown>[]) || []
  const status = job.status as string
  const isHeld = HOLD_STATES.includes(status)
  const holdReason = job.hold_reason as string | null
  const holdUntil = job.hold_until as string | null
  const currentStep = getCustomerStepIndex(status)

  return (
    <BrandProvider brand={brand} className="space-y-5 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/c"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
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
            <p className="text-xs text-muted-foreground">
              {vehicle?.brand as string} {vehicle?.model as string}
            </p>
          </div>
        </div>
        {customer && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{customer.name as string}</span>
          </div>
        )}
      </div>

      {/* Hold banner — shown when job is paused */}
      {isHeld && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-start gap-2">
            <PauseCircle className="mt-0.5 h-5 w-5 text-amber-700" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {JOB_STATUS[status]?.label || "งานพักอยู่"}
              </h3>
              {holdReason && (
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{holdReason}</p>
              )}
              {holdUntil && (
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  คาดว่าจะกลับมาทำต่อ: {new Date(holdUntil).toLocaleDateString("th-TH")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps — high-level for customer */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold">ความคืบหน้า</h2>
        <div className="space-y-0">
          {customerSteps.map((step, idx) => {
            const isCompleted = idx < currentStep || (idx === currentStep && status === "completed")
            const isCurrent = idx === currentStep
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                      isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isCurrent
                          ? isHeld
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-primary bg-primary text-primary-foreground"
                          : "border-muted bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : isCurrent && isHeld ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>
                  {idx < customerSteps.length - 1 && (
                    <div
                      className={cn(
                        "h-8 w-0.5",
                        isCompleted ? "bg-emerald-500" : "bg-muted",
                      )}
                    />
                  )}
                </div>
                <div className="pb-8">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent
                        ? isHeld
                          ? "text-amber-700"
                          : "text-primary"
                        : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                    {isCurrent && (
                      <span
                        className={cn(
                          "ml-2 text-xs",
                          isHeld ? "text-amber-700" : "text-primary",
                        )}
                      >
                        ({isHeld ? "พักรอ" : "ปัจจุบัน"})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed timeline — every status change + photos */}
      {timeline.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-primary" /> ไทม์ไลน์งาน
          </h2>
          <ol className="space-y-3">
            {timeline.map((t, i) => {
              const stStyle = JOB_STATUS[t.status as string]
              const author =
                (t.created_by_user as { full_name?: string } | null)?.full_name || null
              return (
                <li key={t.id as string} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold",
                        stStyle?.color || "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {stStyle && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            stStyle.color,
                          )}
                        >
                          {stStyle.label}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(t.created_at as string)}
                      </span>
                    </div>
                    {t.notes && (
                      <p className="mt-1 text-sm text-foreground">{t.notes as string}</p>
                    )}
                    {author && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        โดย {author}
                      </p>
                    )}
                    {t.photo_url && (
                      <div className="mt-2">
                        <Image
                          src={t.photo_url as string}
                          alt="job photo"
                          width={400}
                          height={300}
                          unoptimized
                          className="max-h-48 w-auto rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Job Details */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Wrench className="h-4 w-4 text-primary" /> รายละเอียด
        </h2>
        <p className="text-sm text-muted-foreground">
          {(job.description as string) || "ไม่มีรายละเอียด"}
        </p>

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
        {Boolean(job.estimated_completion) && (
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
            id: string
            description: string
            estimated_cost: number
            photo_url: string | null
            status: string
          }>}
        />
      )}

      {/* Parts */}
      {jobParts.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" /> อะไหล่ที่ใช้
          </h2>
          <div className="space-y-2">
            {jobParts.map((jp, i) => {
              const part = jp.parts as Record<string, unknown> | null
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {(part?.name as string) ||
                      (jp.description as string) ||
                      "-"}{" "}
                    x{Number(jp.quantity)}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(jp.unit_price) * Number(jp.quantity))}
                  </span>
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
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <span>รวมทั้งหมด</span>
            <span className="text-primary">
              {formatCurrency(Number(job.grand_total) || 0)}
            </span>
          </div>
        </div>
      </div>
    </BrandProvider>
  )
}
