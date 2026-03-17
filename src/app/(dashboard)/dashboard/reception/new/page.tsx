import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CheckinWizard } from "@/components/reception/checkin-wizard"

export default function ReceptionNewPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 px-4 pt-2 sm:px-6">
        <Link
          href="/dashboard/reception"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">รับรถเข้าอู่</h1>
      </div>

      <div className="max-w-2xl sm:px-6">
        <CheckinWizard />
      </div>
    </div>
  )
}
