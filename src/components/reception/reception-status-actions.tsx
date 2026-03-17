"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { updateJobStatus } from "@/lib/actions/jobs"
import { approveQuotation, rejectQuotation } from "@/lib/actions/quotations"
import {
  ChevronRight,
  Search,
  FileText,
  Play,
  XCircle,
  CheckCircle,
} from "lucide-react"

type ReceptionStatus = "pending" | "diagnosing" | "quoted" | "in_progress" | "cancelled"

const statusSteps: { key: string; label: string }[] = [
  { key: "pending", label: "รับรถ" },
  { key: "diagnosing", label: "ตรวจสอบ" },
  { key: "quoted", label: "เสนอราคา" },
  { key: "in_progress", label: "เริ่มซ่อม" },
]

const statusNotes: Record<string, string> = {
  diagnosing: "เริ่มตรวจสอบสภาพรถ / DVI",
  in_progress: "เริ่มดำเนินการซ่อม (ข้ามขั้นตอนเสนอราคา)",
  cancelled: "ยกเลิกงาน",
}

export function ReceptionStatusActions({
  jobId,
  currentStatus,
  quotationId,
}: {
  jobId: string
  currentStatus: string
  quotationId?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

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

  function handleApproveQuotation() {
    if (!quotationId) return
    setError("")
    startTransition(async () => {
      const result = await approveQuotation(quotationId, jobId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleRejectQuotation() {
    if (!quotationId) return
    setError("")
    startTransition(async () => {
      const result = await rejectQuotation(quotationId, jobId)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

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

      {/* Action buttons based on current status */}
      <div className="space-y-2">
        {currentStatus === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange("diagnosing")}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-purple-600 text-white hover:bg-purple-700"
            >
              <Search className="h-4 w-4" />
              เริ่มตรวจสอบ / DVI
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
            <button
              onClick={() => handleStatusChange("in_progress")}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Play className="h-4 w-4" />
              เริ่มซ่อมเลย (ข้ามขั้นตอน)
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-error/10 text-error hover:bg-error/20"
            >
              <XCircle className="h-4 w-4" />
              ยกเลิก
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
          </>
        )}

        {currentStatus === "diagnosing" && (
          <>
            <button
              onClick={() => router.push(`/dashboard/jobs/${jobId}/quotation`)}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-info text-white hover:bg-info/90"
            >
              <FileText className="h-4 w-4" />
              สร้างใบเสนอราคา
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
            <button
              onClick={() => handleStatusChange("in_progress")}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Play className="h-4 w-4" />
              เริ่มซ่อมเลย (ข้ามขั้นตอน)
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-error/10 text-error hover:bg-error/20"
            >
              <XCircle className="h-4 w-4" />
              ยกเลิก
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
          </>
        )}

        {currentStatus === "quoted" && (
          <>
            {quotationId && (
              <button
                onClick={() => router.push(`/dashboard/jobs/${jobId}/quotation`)}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-muted text-foreground hover:bg-muted/80"
              >
                <FileText className="h-4 w-4" />
                ดู/แก้ไขใบเสนอราคา
                <ChevronRight className="h-4 w-4 ml-auto" />
              </button>
            )}
            <button
              onClick={handleApproveQuotation}
              disabled={isPending || !quotationId}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4" />
              ลูกค้าอนุมัติ - เริ่มซ่อม
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
            <button
              onClick={handleRejectQuotation}
              disabled={isPending || !quotationId}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 bg-error/10 text-error hover:bg-error/20"
            >
              <XCircle className="h-4 w-4" />
              ลูกค้าไม่อนุมัติ - ยกเลิก
              <ChevronRight className="h-4 w-4 ml-auto" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
