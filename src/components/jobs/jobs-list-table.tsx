"use client"

import * as React from "react"
import Link from "next/link"
import {
  User,
  Wrench,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { cn, formatDateShort, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  JOB_STATUS,
  JOB_PRIORITY,
  JOB_TYPE_LABELS,
} from "@/lib/constants/status-config"
import type { JobStatus, JobPriority, JobType } from "@/lib/types/database"

const statusSteps: JobStatus[] = [
  "in_progress",
  "quality_check",
  "waiting_pickup",
  "completed",
]

function StatusDots({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusSteps.indexOf(currentStatus as JobStatus)
  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, i) => (
        <div
          key={step}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= currentIndex ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  )
}

type JobRow = Record<string, unknown> & {
  id: string
  job_number: string
  status: JobStatus
  priority: JobPriority
  type: JobType
  grand_total?: number | null
  created_at: string
  customers?: { name?: string } | null
  vehicles?: {
    license_plate?: string
    brand?: string
    model?: string
  } | null
  assigned_user?: { full_name?: string } | null
}

interface JobsListTableProps {
  jobs: JobRow[]
  search?: string
}

export function JobsListTable({ jobs, search }: JobsListTableProps) {
  const columns: ColumnDef<JobRow>[] = React.useMemo(
    () => [
      {
        id: "job_number",
        header: "เลขที่ Job",
        sortable: true,
        sortValue: (r) => r.job_number,
        cell: (row) => (
          <Link
            href={`/dashboard/jobs/${row.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.job_number}
          </Link>
        ),
      },
      {
        id: "customer",
        header: "ลูกค้า",
        sortable: true,
        sortValue: (r) => r.customers?.name ?? "",
        cell: (row) => (
          <span className="inline-flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="max-w-[140px] truncate">
              {row.customers?.name ?? "—"}
            </span>
          </span>
        ),
      },
      {
        id: "vehicle",
        header: "รถ",
        sortable: true,
        sortValue: (r) => r.vehicles?.license_plate ?? "",
        cell: (row) => {
          const v = row.vehicles
          return (
            <div>
              <div className="text-xs text-muted-foreground">
                {v?.license_plate ?? "—"}
              </div>
              <div className="text-sm">
                {[v?.brand, v?.model].filter(Boolean).join(" ")}
              </div>
            </div>
          )
        },
      },
      {
        id: "type",
        header: "ประเภท",
        align: "center",
        sortable: true,
        sortValue: (r) => r.type,
        cell: (row) => (
          <Badge variant="outline" className="text-xs">
            {JOB_TYPE_LABELS[row.type] || row.type}
          </Badge>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        align: "center",
        sortable: true,
        sortValue: (r) => r.priority,
        cell: (row) => {
          const style = JOB_PRIORITY[row.priority]
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
                style?.className,
              )}
            >
              {row.priority === "urgent" && <AlertTriangle className="h-3 w-3" />}
              {style?.label || row.priority}
            </span>
          )
        },
      },
      {
        id: "status",
        header: "สถานะ",
        align: "center",
        sortable: true,
        sortValue: (r) => r.status,
        cell: (row) => {
          const style = JOB_STATUS[row.status]
          return (
            <div className="space-y-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                  style?.className,
                )}
              >
                {style?.label || row.status}
              </span>
              <StatusDots currentStatus={row.status} />
            </div>
          )
        },
      },
      {
        id: "technician",
        header: "ช่าง",
        sortable: true,
        sortValue: (r) => r.assigned_user?.full_name ?? "",
        cell: (row) => (
          <span className="inline-flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{row.assigned_user?.full_name ?? "—"}</span>
          </span>
        ),
      },
      {
        id: "created_at",
        header: "วันที่รับ",
        sortable: true,
        sortValue: (r) => r.created_at,
        cell: (row) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateShort(row.created_at)}
          </span>
        ),
      },
      {
        id: "grand_total",
        header: "ยอดรวม",
        align: "right",
        sortable: true,
        sortValue: (r) => Number(r.grand_total ?? 0),
        cell: (row) => (
          <span className="font-medium">
            {formatCurrency(Number(row.grand_total) || 0)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DataTable<JobRow>
      columns={columns}
      data={jobs}
      getRowId={(row) => row.id}
      enablePagination
      enableColumnVisibility
      pageSize={25}
      savedViewKey="jobs-list"
      emptyTitle={search ? "ไม่พบงานที่ค้นหา" : "ยังไม่มีงานซ่อม"}
      emptyDescription={search ? "ลองเปลี่ยนคำค้นหา" : "สร้างงานใหม่เพื่อเริ่มต้น"}
      renderMobileCard={(row) => {
        const v = row.vehicles
        const style = JOB_STATUS[row.status]
        const priorityStyle = JOB_PRIORITY[row.priority]
        return (
          <Link href={`/dashboard/jobs/${row.id}`} className="block space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">
                {row.job_number}
              </span>
              <span className="ml-auto inline-flex shrink-0">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    style?.className,
                  )}
                >
                  {style?.label || row.status}
                </span>
              </span>
            </div>
            <p className="text-sm font-medium">
              {row.customers?.name ?? "—"}
              {v?.license_plate && (
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {v.license_plate}
                </span>
              )}
            </p>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {row.assigned_user?.full_name ?? "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateShort(row.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                  priorityStyle?.className,
                )}
              >
                {row.priority === "urgent" && <AlertTriangle className="h-3 w-3" />}
                {priorityStyle?.label || row.priority}
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(Number(row.grand_total) || 0)}
              </span>
            </div>
          </Link>
        )
      }}
    />
  )
}
