import { PauseCircle } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { getJobs } from "@/lib/actions/jobs"
import { QueueBoard } from "@/components/jobs/queue-board"

const HOLD_STATES = new Set(["waiting_parts", "waiting_insurance", "on_hold"])

export default async function QueuePage() {
  const jobs = await getJobs()

  const activeJobs = jobs.filter(
    (j: Record<string, unknown>) => j.status !== "cancelled",
  )
  const onHold = activeJobs.filter((j) =>
    HOLD_STATES.has(j.status as string),
  ).length

  const breadcrumb = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "งานซ่อม", href: "/dashboard/jobs" },
    { title: "คิว" },
  ]

  return (
    <>
      <PageHeader
        title="คิวงานซ่อม"
        description="ลากการ์ดเพื่อเปลี่ยนสถานะ — รวมงานที่หยุดรออะไหล่/รอประกัน"
        breadcrumb={breadcrumb}
      />

      <div className="space-y-4 px-3 pb-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            งานที่เปิดอยู่:{" "}
            <span className="font-bold text-foreground">{activeJobs.length}</span> งาน
          </span>
          {onHold > 0 && (
            <Badge tone="warn" dot>
              <PauseCircle className="h-3 w-3" />
              พักงาน {onHold} รายการ
            </Badge>
          )}
        </div>

        <QueueBoard jobs={activeJobs} />
      </div>
    </>
  )
}
