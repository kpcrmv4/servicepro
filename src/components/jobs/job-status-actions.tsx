"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { updateJobStatus } from "@/lib/actions/jobs"
import {
  ChevronRight,
  Play,
  CheckCircle,
  Truck,
  Flag,
  XCircle,
} from "lucide-react"
import { JobHoldButton } from "@/components/jobs/job-hold-button"

type JobStatus =
  | "pending"
  | "ready_to_repair"
  | "in_progress"
  | "waiting_parts"
  | "waiting_insurance"
  | "on_hold"
  | "quality_check"
  | "waiting_pickup"
  | "completed"
  | "cancelled"

const statusFlow: Record<string, { next: JobStatus; label: string; icon: React.ElementType; color: string }[]> = {
  ready_to_repair: [
    { next: "in_progress", label: "เริ่มซ่อม", icon: Play, color: "bg-info text-white hover:bg-info/90" },
    { next: "cancelled", label: "ยกเลิก", icon: XCircle, color: "bg-error/10 text-error hover:bg-error/20" },
  ],
  in_progress: [
    { next: "quality_check", label: "ส่งตรวจ QC", icon: CheckCircle, color: "bg-purple-600 text-white hover:bg-purple-700" },
    { next: "cancelled", label: "ยกเลิก", icon: XCircle, color: "bg-error/10 text-error hover:bg-error/20" },
  ],
  quality_check: [
    { next: "waiting_pickup", label: "ผ่าน QC - รอลูกค้ารับ", icon: Truck, color: "bg-info text-white hover:bg-info/90" },
    { next: "in_progress", label: "ไม่ผ่าน - ส่งกลับซ่อม", icon: Play, color: "bg-warning/10 text-warning hover:bg-warning/20" },
  ],
  waiting_pickup: [
    { next: "completed", label: "ลูกค้ารับรถแล้ว - เสร็จสิ้น", icon: Flag, color: "bg-success text-white hover:bg-success/90" },
  ],
  completed: [],
  cancelled: [],
}

const statusSteps: { key: JobStatus; label: string }[] = [
  { key: "ready_to_repair", label: "พร้อมซ่อม" },
  { key: "in_progress", label: "กำลังซ่อม" },
  { key: "quality_check", label: "ตรวจ QC" },
  { key: "waiting_pickup", label: "รอลูกค้ารับ" },
  { key: "completed", label: "เสร็จสิ้น" },
]

export function JobStatusActions({
  jobId,
  currentStatus,
  holdReason,
  holdUntil,
}: {
  jobId: string
  currentStatus: string
  holdReason?: string | null
  holdUntil?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const actions = statusFlow[currentStatus] || []
  const currentIndex = statusSteps.findIndex((s) => s.key === currentStatus)

  function handleStatusChange(nextStatus: JobStatus) {
    setError("")
    startTransition(async () => {
      const result = await updateJobStatus(jobId, nextStatus)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  if (currentStatus === "completed" || currentStatus === "cancelled") {
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">เปลี่ยนสถานะ</h2>

      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-4">
        {statusSteps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
              i <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {i + 1}
            </div>
            {i < statusSteps.length - 1 && (
              <div className={cn(
                "h-0.5 flex-1 mx-1",
                i < currentIndex ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mb-4">
        {statusSteps.map((step) => (
          <span key={step.key} className="text-[10px] text-muted-foreground text-center flex-1">
            {step.label}
          </span>
        ))}
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-error/20 bg-error/10 p-2 text-xs text-error">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.next}
              onClick={() => handleStatusChange(action.next)}
              disabled={isPending}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                action.color
              )}
            >
              <Icon className="h-4 w-4" />
              {action.label}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
          )
        })}

        {/* Hold / resume — handles waiting_parts, waiting_insurance, on_hold */}
        <JobHoldButton
          jobId={jobId}
          currentStatus={currentStatus}
          holdReason={holdReason}
          holdUntil={holdUntil}
        />
      </div>
    </div>
  )
}
