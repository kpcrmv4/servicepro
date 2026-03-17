"use client"

import { useState, useTransition } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { approveQuotationPublic, rejectQuotationPublic } from "@/lib/actions/quotation-public"

export function QuotationApprovalButtons({
  quotationId,
  jobId,
}: {
  quotationId: string
  jobId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState("")

  function handleApprove() {
    if (!confirmed) {
      setConfirmed("approve")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await approveQuotationPublic(quotationId, jobId)
      if (result.error) {
        setError(result.error)
        setConfirmed(null)
      } else {
        router.refresh()
      }
    })
  }

  function handleReject() {
    if (!confirmed) {
      setConfirmed("reject")
      return
    }
    setError("")
    startTransition(async () => {
      const result = await rejectQuotationPublic(quotationId, jobId)
      if (result.error) {
        setError(result.error)
        setConfirmed(null)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3 pb-6">
      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error text-center">
          {error}
        </div>
      )}

      {confirmed && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-center text-sm">
          <p className="font-medium">
            {confirmed === "approve" ? "ยืนยันอนุมัติใบเสนอราคานี้?" : "ยืนยันไม่อนุมัติใบเสนอราคานี้?"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">กดอีกครั้งเพื่อยืนยัน</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleReject}
          disabled={isPending || (confirmed === "approve")}
          className="flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm font-medium text-error transition-colors hover:bg-error/20 disabled:opacity-50"
        >
          {isPending && confirmed === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          ไม่อนุมัติ
        </button>
        <button
          onClick={handleApprove}
          disabled={isPending || (confirmed === "reject")}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending && confirmed === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          อนุมัติ
        </button>
      </div>

      {confirmed && (
        <button
          onClick={() => setConfirmed(null)}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </button>
      )}
    </div>
  )
}
