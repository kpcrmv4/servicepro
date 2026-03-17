"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { updateJobStatus } from "@/lib/actions/jobs"
import {
  ChevronRight,
  Search,
  FileText,
  Play,
  XCircle,
} from "lucide-react"

type ReceptionStatus = "pending" | "diagnosing" | "quoted" | "in_progress" | "cancelled"

const statusFlow: Record<string, { next: ReceptionStatus; label: string; icon: React.ElementType; color: string }[]> = {
  pending: [
    { next: "diagnosing", label: "เริ่มตรวจสอบ / DVI", icon: Search, color: "bg-purple-600 text-white hover:bg-purple-700" },
    { next: "in_progress", label: "เริ่มซ่อมเลย (ข้ามขั้นตอน)", icon: Play, color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { next: "cancelled", label: "ยกเลิก", icon: XCircle, color: "bg-error/10 text-error hover:bg-error/20" },
  ],
  diagnosing: [
    { next: "quoted", label: "เสนอราคาลูกค้า", icon: FileText, color: "bg-info text-white hover:bg-info/90" },
    { next: "in_progress", label: "เริ่มซ่อมเลย (ข้ามขั้นตอน)", icon: Play, color: "bg-primary/10 text-primary hover:bg-primary/20" },
    { next: "cancelled", label: "ยกเลิก", icon: XCircle, color: "bg-error/10 text-error hover:bg-error/20" },
  ],
  quoted: [
    { next: "in_progress", label: "ลูกค้าอนุมัติ - เริ่มซ่อม", icon: Play, color: "bg-primary text-primary-foreground hover:bg-primary/90" },
    { next: "cancelled", label: "ลูกค้าไม่อนุมัติ - ยกเลิก", icon: XCircle, color: "bg-error/10 text-error hover:bg-error/20" },
  ],
}

const statusSteps: { key: string; label: string }[] = [
  { key: "pending", label: "รับรถ" },
  { key: "diagnosing", label: "ตรวจสอบ" },
  { key: "quoted", label: "เสนอราคา" },
  { key: "in_progress", label: "เริ่มซ่อม" },
]

const statusNotes: Record<string, string> = {
  diagnosing: "เริ่มตรวจสอบสภาพรถ / DVI",
  quoted: "เสนอราคาลูกค้า",
  in_progress: "ลูกค้าอนุมัติ - เริ่มดำเนินการซ่อม",
  cancelled: "ยกเลิกงาน",
}

export function ReceptionStatusActions({ jobId, currentStatus }: { jobId: string; currentStatus: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const actions = statusFlow[currentStatus] || []
  const currentIndex = statusSteps.findIndex((s) => s.key === currentStatus)

  function handleStatusChange(nextStatus: ReceptionStatus) {
    setError("")
    startTransition(async () => {
      const result = await updateJobStatus(jobId, nextStatus, statusNotes[nextStatus])
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  if (actions.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold mb-4">ขั้นตอนรับรถ</h2>

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
      </div>
    </div>
  )
}
