"use client"

import * as React from "react"
import {
  ArrowRight,
  Package,
  TrendingUp,
  TrendingDown,
  Wrench,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { listMovements, type MovementWithJoins } from "@/lib/actions/storage"

// =============================================================================
// MovementTimeline — log of stock movements with reason filter.
// =============================================================================

const REASON_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; tone: "success" | "error" | "warn" | "info" | "neutral" }
> = {
  restock: { label: "เติมสต็อก", icon: TrendingUp, tone: "success" },
  sale: { label: "ขายออก", icon: TrendingDown, tone: "info" },
  reorganize: { label: "จัดเรียงใหม่", icon: Wrench, tone: "neutral" },
  "audit-correction": { label: "ปรับแก้ตรวจนับ", icon: AlertTriangle, tone: "warn" },
  transfer: { label: "ย้ายตำแหน่ง", icon: ArrowRight, tone: "info" },
  "transfer-room": { label: "ย้ายห้อง", icon: ArrowRight, tone: "info" },
  damage: { label: "เสียหาย", icon: AlertTriangle, tone: "error" },
  adjust: { label: "ปรับจำนวน", icon: Clock, tone: "neutral" },
}

interface Props {
  /** Filter by part — for showing in part-dialog */
  partId?: string
  /** Initial reason filter */
  initialReason?: string
  /** Max rows to load */
  limit?: number
  className?: string
}

export function MovementTimeline({ partId, initialReason, limit = 100, className }: Props) {
  const [items, setItems] = React.useState<MovementWithJoins[] | null>(null)
  const [reason, setReason] = React.useState<string | "">(initialReason ?? "")

  React.useEffect(() => {
    let cancelled = false
    listMovements({ partId, reason: reason || undefined, limit }).then((data) => {
      if (!cancelled) setItems(data)
    })
    return () => {
      cancelled = true
    }
  }, [partId, reason, limit])

  const reasonOptions = Object.keys(REASON_CONFIG)

  if (!items) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Reason filter chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip
          active={reason === ""}
          onClick={() => setReason("")}
          label="ทั้งหมด"
        />
        {reasonOptions.map((r) => (
          <FilterChip
            key={r}
            active={reason === r}
            onClick={() => setReason(r)}
            label={REASON_CONFIG[r].label}
          />
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          ยังไม่มีบันทึกการเคลื่อนไหว
        </div>
      ) : (
        <ol className="relative space-y-2 border-l-2 border-border pl-5">
          {items.map((m) => (
            <MovementRow key={m.id} m={m} />
          ))}
        </ol>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}

function MovementRow({ m }: { m: MovementWithJoins }) {
  const cfg = REASON_CONFIG[m.reason] ?? REASON_CONFIG.adjust
  const Icon = cfg.icon
  const date = new Date(m.performed_at).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[27px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background",
          cfg.tone === "success" && "bg-success-light text-green-600",
          cfg.tone === "error" && "bg-error-light text-red-600",
          cfg.tone === "warn" && "bg-warning-light text-amber-600",
          cfg.tone === "info" && "bg-info-light text-cyan-600",
          cfg.tone === "neutral" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-3 w-3" />
      </span>

      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone={cfg.tone} className="text-[10px]">
            {cfg.label}
          </Badge>
          <span className="ml-auto text-muted-foreground">{date}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-sm">
          <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium">{m.part?.name ?? "—"}</span>
          {m.part?.part_number && (
            <span className="text-[11px] text-muted-foreground">
              {m.part.part_number}
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 font-bold">
            <span className={m.from_node ? "text-red-600" : "text-green-600"}>
              {m.from_node ? "−" : "+"}
              {m.quantity}
            </span>
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
          {m.from_node && <PathPill labels={m.from_node.path_labels} dim />}
          {m.from_node && m.to_node && <ArrowRight className="h-3 w-3" />}
          {m.to_node && <PathPill labels={m.to_node.path_labels} />}
          {m.performed_by_user?.full_name && (
            <span className="ml-auto">โดย {m.performed_by_user.full_name}</span>
          )}
        </div>

        {m.notes && (
          <p className="mt-1 text-[11px] italic text-muted-foreground">
            &quot;{m.notes}&quot;
          </p>
        )}
      </div>
    </li>
  )
}

function PathPill({ labels, dim }: { labels: string[]; dim?: boolean }) {
  if (!labels?.length) return null
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px]",
        dim && "opacity-60",
      )}
    >
      {labels.join(" › ")}
    </span>
  )
}
