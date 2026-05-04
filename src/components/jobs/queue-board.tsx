"use client"

import * as React from "react"
import Link from "next/link"
import {
  Car,
  User,
  Clock,
  Wrench,
  AlertTriangle,
} from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { KanbanBoard, type KanbanColumn, type KanbanCardData } from "@/components/ui/kanban"
import { QUEUE_COLUMNS, JOB_STATUS } from "@/lib/constants/status-config"
import { updateJobStatus } from "@/lib/actions/jobs"
import { toast } from "@/components/ui/toast"

const HOLD_STATES = new Set(["waiting_parts", "waiting_insurance", "on_hold"])

interface JobCard extends KanbanCardData {
  job_number: string
  customer_name?: string
  vehicle_plate?: string
  description?: string
  priority?: string
  hold_reason?: string | null
  hold_until?: string | null
  created_at: string
  status: string
}

interface QueueBoardProps {
  jobs: Array<Record<string, unknown>>
}

export function QueueBoard({ jobs }: QueueBoardProps) {
  const cards: JobCard[] = React.useMemo(
    () =>
      jobs
        .filter((j) => j.status !== "cancelled")
        .map((j) => {
          const customer = j.customers as Record<string, unknown> | null
          const vehicle = j.vehicles as Record<string, unknown> | null
          return {
            id: j.id as string,
            columnId: j.status as string,
            job_number: j.job_number as string,
            customer_name: (customer?.name as string) || undefined,
            vehicle_plate: (vehicle?.license_plate as string) || undefined,
            description: (j.description as string) || undefined,
            priority: j.priority as string,
            hold_reason: j.hold_reason as string | null,
            hold_until: j.hold_until as string | null,
            created_at: j.created_at as string,
            status: j.status as string,
          }
        }),
    [jobs],
  )

  const columns: KanbanColumn[] = React.useMemo(
    () =>
      QUEUE_COLUMNS.map((c) => ({
        id: c.key,
        title: c.label,
        toneClass: c.bg,
      })),
    [],
  )

  async function handleMove(cardId: string, _from: string, to: string) {
    await toast.promise(updateJobStatus(cardId, to), {
      loading: "กำลังเปลี่ยนสถานะ...",
      success: `ย้ายไป "${JOB_STATUS[to]?.label || to}"`,
      error: (err) => (err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้"),
    })
  }

  return (
    <KanbanBoard<JobCard>
      columns={columns}
      cards={cards}
      onCardMove={handleMove}
      emptyText="—"
      renderCard={(card) => <JobCardBody card={card} />}
      renderOverlay={(card) => <JobCardBody card={card} dragging />}
    />
  )
}

function JobCardBody({ card, dragging }: { card: JobCard; dragging?: boolean }) {
  const isHeld = HOLD_STATES.has(card.status)
  const status = JOB_STATUS[card.status]

  const inner = (
    <div className="space-y-1.5 p-2.5 text-xs">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-bold text-primary">{card.job_number}</span>
        {card.priority === "urgent" && (
          <Badge tone="error" className="text-[10px]">
            ด่วน
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {card.customer_name && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{card.customer_name}</span>
          </div>
        )}
        {card.vehicle_plate && (
          <div className="flex items-center gap-1.5">
            <Car className="h-3 w-3 text-muted-foreground" />
            <span className="truncate font-mono font-medium">{card.vehicle_plate}</span>
          </div>
        )}
        {card.description && (
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{card.description}</span>
          </div>
        )}
      </div>

      {isHeld && (card.hold_reason || card.hold_until) && (
        <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          <div className="min-w-0">
            {card.hold_reason && <div className="line-clamp-2">{card.hold_reason}</div>}
            {card.hold_until && (
              <div className="font-medium">
                ETA: {new Date(card.hold_until).toLocaleDateString("th-TH")}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDateShort(card.created_at)}
        </span>
        {status && (
          <span className={cn("rounded-md px-1.5 py-0.5", status.color)}>
            {status.label}
          </span>
        )}
      </div>
    </div>
  )

  if (dragging) {
    return inner
  }

  return (
    <Link
      href={`/dashboard/jobs/${card.id}`}
      onClick={(e) => {
        // Prevent navigation when the user actually dragged the card.
        // dnd-kit dispatches a synthetic click only on tap-to-click, so
        // this only fires for that case.
      }}
      className="block"
    >
      {inner}
    </Link>
  )
}
