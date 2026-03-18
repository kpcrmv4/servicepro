"use client"

import { formatCurrency } from "@/lib/utils"

interface JobForAnalytics {
  created_at: string
  grand_total: number
  job_items: Array<{ type: string; total: number }>
}

interface CostAnalyticsProps {
  jobs: JobForAnalytics[]
}

export default function CostAnalytics({ jobs }: CostAnalyticsProps) {
  // --- Summary calculations ---
  const totalCost = jobs.reduce((sum, j) => sum + Number(j.grand_total || 0), 0)
  const totalVisits = jobs.length

  // --- Parts vs Labor split ---
  let totalParts = 0
  let totalLabor = 0
  for (const job of jobs) {
    for (const item of job.job_items || []) {
      const amount = Number(item.total || 0)
      if (item.type === "part") {
        totalParts += amount
      } else {
        totalLabor += amount
      }
    }
  }
  const partsLaborTotal = totalParts + totalLabor

  // --- Per-year breakdown ---
  const yearMap = new Map<number, number>()
  for (const job of jobs) {
    const year = new Date(job.created_at).getFullYear()
    yearMap.set(year, (yearMap.get(year) || 0) + Number(job.grand_total || 0))
  }
  const yearEntries = Array.from(yearMap.entries()).sort((a, b) => b[0] - a[0])
  const maxYearAmount = Math.max(...yearEntries.map(([, v]) => v), 1)

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลค่าใช้จ่าย</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">ค่าใช้จ่ายรวม</p>
          <p className="text-lg font-bold text-foreground">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">
            จำนวนครั้งเข้ารับบริการ
          </p>
          <p className="text-lg font-bold text-foreground">
            {totalVisits}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ครั้ง
            </span>
          </p>
        </div>
      </div>

      {/* Parts vs Labor */}
      {partsLaborTotal > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground mb-3">
            สัดส่วนค่าอะไหล่ / ค่าแรง
          </h4>
          <div className="flex h-4 rounded-full overflow-hidden bg-muted">
            {totalParts > 0 && (
              <div
                className="bg-primary transition-all"
                style={{
                  width: `${(totalParts / partsLaborTotal) * 100}%`,
                }}
              />
            )}
            {totalLabor > 0 && (
              <div
                className="bg-info transition-all"
                style={{
                  width: `${(totalLabor / partsLaborTotal) * 100}%`,
                }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
              <span className="text-muted-foreground">
                อะไหล่ {formatCurrency(totalParts)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-info" />
              <span className="text-muted-foreground">
                ค่าแรง {formatCurrency(totalLabor)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Per-year breakdown */}
      {yearEntries.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-xs font-semibold text-foreground mb-3">
            ค่าใช้จ่ายรายปี
          </h4>
          <div className="space-y-2.5">
            {yearEntries.map(([year, amount]) => (
              <div key={year}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">
                    {year + 543}
                  </span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(amount / maxYearAmount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
