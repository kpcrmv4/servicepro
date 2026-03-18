"use client"

import { useState } from "react"
import { cn, formatCurrency, formatDateShort, formatDateTime } from "@/lib/utils"
import {
  ChevronDown,
  ChevronUp,
  Wrench,
  ClipboardCheck,
  User,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

interface JobTimelineEvent {
  id: string
  status: string
  notes: string | null
  created_at: string
}

interface JobItem {
  id: string
  type: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface JobEntry {
  type: "job"
  id: string
  date: string
  job_number: string
  status: string
  description: string | null
  grand_total: number
  total_parts_cost: number
  total_labor_cost: number
  assigned_to_name: string | null
  job_items: JobItem[]
  job_timeline: JobTimelineEvent[]
}

interface InspectionEntry {
  type: "inspection"
  id: string
  date: string
  overall_score: number | null
  share_token: string | null
  notes: string | null
  good_count: number
  fair_count: number
  poor_count: number
}

export type TimelineEntry = JobEntry | InspectionEntry

interface ServiceTimelineProps {
  entries: TimelineEntry[]
}

const statusLabels: Record<string, string> = {
  pending: "รอรับรถ",
  checked_in: "รับรถแล้ว",
  diagnosing: "ตรวจสอบ",
  in_progress: "กำลังซ่อม",
  waiting_parts: "รออะไหล่",
  completed: "เสร็จแล้ว",
  delivered: "ส่งมอบแล้ว",
  cancelled: "ยกเลิก",
}

function getScoreBadgeColor(score: number | null): string {
  if (score === null) return "bg-muted text-muted-foreground"
  if (score >= 8) return "bg-success/10 text-success"
  if (score >= 6) return "bg-info/10 text-info"
  if (score >= 4) return "bg-warning/10 text-warning"
  return "bg-error/10 text-error"
}

function getStatusBadgeColor(status: string): string {
  if (status === "completed" || status === "delivered")
    return "bg-success/10 text-success"
  if (status === "cancelled") return "bg-error/10 text-error"
  return "bg-primary/10 text-primary"
}

function JobCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: JobEntry
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left active:bg-muted/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-bold text-primary truncate">
                {entry.job_number}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                  getStatusBadgeColor(entry.status)
                )}
              >
                {statusLabels[entry.status] || entry.status}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-1">
              {entry.description || "งานซ่อม"}
            </p>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{formatDateShort(entry.date)}</span>
              {entry.grand_total > 0 && (
                <span className="font-medium">
                  {formatCurrency(entry.grand_total)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          {/* Technician */}
          {entry.assigned_to_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>ช่าง: {entry.assigned_to_name}</span>
            </div>
          )}

          {/* Parts list */}
          {entry.job_items.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">
                รายการ
              </h4>
              <div className="space-y-1">
                {entry.job_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground truncate mr-2">
                      {item.type === "part" ? "อะไหล่" : "ค่าแรง"} -{" "}
                      {item.description}
                    </span>
                    <span className="text-foreground shrink-0 font-medium">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline events */}
          {entry.job_timeline.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">
                ไทม์ไลน์
              </h4>
              <div className="space-y-1.5">
                {entry.job_timeline.map((event) => (
                  <div key={event.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                    <div>
                      <span className="text-foreground font-medium">
                        {statusLabels[event.status] || event.status}
                      </span>
                      {event.notes && (
                        <span className="text-muted-foreground">
                          {" "}
                          - {event.notes}
                        </span>
                      )}
                      <span className="text-muted-foreground block">
                        {formatDateTime(event.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InspectionCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: InspectionEntry
  expanded: boolean
  onToggle: () => void
}) {
  const totalItems = entry.good_count + entry.fair_count + entry.poor_count

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left active:bg-muted/50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 mt-0.5">
            <ClipboardCheck className="h-4 w-4 text-info" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-bold text-info">ตรวจสภาพรถ</span>
              {entry.overall_score !== null && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                    getScoreBadgeColor(entry.overall_score)
                  )}
                >
                  {entry.overall_score}/10
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {entry.good_count} ดี / {entry.fair_count} พอใช้ /{" "}
              {entry.poor_count} ต้องซ่อม
              {totalItems > 0 && ` (${totalItems} รายการ)`}
            </p>
            <div className="mt-1.5 text-xs text-muted-foreground">
              <span>{formatDateShort(entry.date)}</span>
            </div>
          </div>
          <div className="shrink-0 mt-1">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/30">
          {entry.notes && (
            <p className="text-xs text-muted-foreground">{entry.notes}</p>
          )}

          {/* Condition bar */}
          {totalItems > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">
                สรุปสภาพ
              </h4>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {entry.good_count > 0 && (
                  <div
                    className="bg-success transition-all"
                    style={{
                      width: `${(entry.good_count / totalItems) * 100}%`,
                    }}
                  />
                )}
                {entry.fair_count > 0 && (
                  <div
                    className="bg-warning transition-all"
                    style={{
                      width: `${(entry.fair_count / totalItems) * 100}%`,
                    }}
                  />
                )}
                {entry.poor_count > 0 && (
                  <div
                    className="bg-error transition-all"
                    style={{
                      width: `${(entry.poor_count / totalItems) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span className="text-success">ดี {entry.good_count}</span>
                <span className="text-warning">พอใช้ {entry.fair_count}</span>
                <span className="text-error">ต้องซ่อม {entry.poor_count}</span>
              </div>
            </div>
          )}

          {/* Link to full report */}
          {entry.share_token && (
            <Link
              href={`/inspect/${entry.share_token}`}
              className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              ดูรายงานฉบับเต็ม
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function ServiceTimeline({ entries }: ServiceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const visibleEntries = showAll ? entries : entries.slice(0, 10)

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการเข้ารับบริการ</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleEntries.map((entry) => {
        const id = entry.id
        const isExpanded = expandedId === id

        if (entry.type === "job") {
          return (
            <JobCard
              key={id}
              entry={entry}
              expanded={isExpanded}
              onToggle={() => toggleExpand(id)}
            />
          )
        }

        return (
          <InspectionCard
            key={id}
            entry={entry}
            expanded={isExpanded}
            onToggle={() => toggleExpand(id)}
          />
        )
      })}

      {!showAll && entries.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full rounded-xl border border-border bg-card p-3 text-sm font-medium text-primary hover:bg-muted/50 active:bg-muted transition-colors"
        >
          แสดงเพิ่มเติม ({entries.length - 10} รายการ)
        </button>
      )}
    </div>
  )
}
