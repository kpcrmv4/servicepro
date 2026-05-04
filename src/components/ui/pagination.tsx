"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  /** Current page (1-indexed) */
  page: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items (for the count label) */
  totalItems?: number
  /** Items per page (for label "X / page") */
  pageSize?: number
  /** Available page-size options */
  pageSizeOptions?: number[]
  /** Fired when page changes */
  onPageChange: (page: number) => void
  /** Fired when page-size changes */
  onPageSizeChange?: (size: number) => void
  className?: string
  /** Hide first/last page jump buttons */
  hideJumpButtons?: boolean
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/** Build the page-button list with ellipsis (1 … 4 5 [6] 7 8 … 20) */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const window = 1
  const out: (number | "…")[] = [1]
  const start = Math.max(2, current - window)
  const end = Math.min(total - 1, current + window)
  if (start > 2) out.push("…")
  for (let i = start; i <= end; i++) out.push(i)
  if (end < total - 1) out.push("…")
  out.push(total)
  return out
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  className,
  hideJumpButtons,
}: PaginationProps) {
  const canPrev = page > 1
  const canNext = page < totalPages
  const pageList = buildPageList(page, Math.max(totalPages, 1))

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn(
        "flex flex-col items-center gap-3 px-2 py-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      {/* Left: total count + page-size */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {totalItems !== undefined && (
          <span>
            <span className="font-medium text-foreground">{totalItems.toLocaleString()}</span> รายการ
          </span>
        )}
        {onPageSizeChange && pageSize && (
          <label className="flex items-center gap-1.5">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="จำนวนต่อหน้า"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>/ หน้า</span>
          </label>
        )}
      </div>

      {/* Right: page nav */}
      <div className="flex items-center gap-1">
        {!hideJumpButtons && (
          <PageButton
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="หน้าแรก"
          >
            <ChevronsLeft className="h-4 w-4" />
          </PageButton>
        )}
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="h-4 w-4" />
        </PageButton>

        {pageList.map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1.5 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <PageButton
              key={p}
              active={p === page}
              onClick={() => onPageChange(p)}
              aria-label={`หน้า ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </PageButton>
        {!hideJumpButtons && (
          <PageButton
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label="หน้าสุดท้าย"
          >
            <ChevronsRight className="h-4 w-4" />
          </PageButton>
        )}
      </div>
    </nav>
  )
}

interface PageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

function PageButton({ active, className, ...props }: PageButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  )
}
