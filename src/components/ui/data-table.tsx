"use client"

import * as React from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  Check,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsTabletUp } from "@/hooks/use-media-query"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet"

// =============================================================================
// Types
// =============================================================================

export interface ColumnDef<T> {
  /** Unique column id (used for sort/visibility/saved view) */
  id: string
  /** Column header content (string or node) */
  header: React.ReactNode
  /** Cell renderer */
  cell: (row: T, ctx: { rowIndex: number }) => React.ReactNode
  /** Whether this column can be sorted (uses sortValue or accessor) */
  sortable?: boolean
  /** Comparator value when sortable — defaults to cell text */
  sortValue?: (row: T) => string | number | Date | null | undefined
  /** Hide this column by default */
  hiddenByDefault?: boolean
  /** CSS width / min-width string for desktop column */
  width?: string
  /** Text alignment for both header + cell */
  align?: "left" | "center" | "right"
  /** Hide on mobile card view (column appears only in desktop table) */
  hideOnMobile?: boolean
  /** Render a compact label/value line for mobile card view */
  mobileLine?: (row: T, ctx: { rowIndex: number }) => React.ReactNode
}

export interface BulkAction<T> {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  /** Visual tone — destructive shows red */
  tone?: "default" | "destructive"
  onClick: (selectedRows: T[]) => void | Promise<void>
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]

  /** Stable row key for select/diff */
  getRowId: (row: T, index: number) => string
  /** Make entire row clickable (e.g. open detail page) */
  onRowClick?: (row: T) => void

  /** Show loading skeletons over the table */
  loading?: boolean
  /** Title for empty state */
  emptyTitle?: string
  /** Description for empty state */
  emptyDescription?: string
  /** CTA element rendered in empty state */
  emptyAction?: React.ReactNode

  /** Enable bulk row selection (checkbox column) */
  enableBulkSelect?: boolean
  /** Bulk action buttons rendered in floating bar above bottom-nav */
  bulkActions?: BulkAction<T>[]

  /** Enable column visibility toggle in toolbar */
  enableColumnVisibility?: boolean

  /** Enable client-side pagination */
  enablePagination?: boolean
  /** Items per page (defaults to 25) */
  pageSize?: number
  /** Page-size options for selector (defaults to [10, 25, 50, 100]) */
  pageSizeOptions?: number[]

  /** Persist column visibility, sort, page-size to localStorage under this key */
  savedViewKey?: string

  /** Optional toolbar slot (search input, filters, etc.) — rendered above table */
  toolbar?: React.ReactNode

  /** Custom mobile card renderer — overrides automatic mobileLine assembly */
  renderMobileCard?: (row: T, ctx: { rowIndex: number; selected: boolean }) => React.ReactNode

  /** Hide the desktop horizontal-scroll fallback (use only when data fits) */
  className?: string
}

// =============================================================================
// SavedView persistence
// =============================================================================

interface SavedView {
  hiddenColumns?: string[]
  sort?: { columnId: string; direction: "asc" | "desc" } | null
  pageSize?: number
}

function readSavedView(key?: string): SavedView | null {
  if (!key || typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(`datatable-view:${key}`)
    return raw ? (JSON.parse(raw) as SavedView) : null
  } catch {
    return null
  }
}

function writeSavedView(key: string | undefined, view: SavedView) {
  if (!key || typeof window === "undefined") return
  try {
    localStorage.setItem(`datatable-view:${key}`, JSON.stringify(view))
  } catch {
    // quota exceeded — ignore
  }
}

// =============================================================================
// Component
// =============================================================================

export function DataTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  loading,
  emptyTitle = "ยังไม่มีข้อมูล",
  emptyDescription,
  emptyAction,
  enableBulkSelect,
  bulkActions,
  enableColumnVisibility,
  enablePagination = true,
  pageSize: defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  savedViewKey,
  toolbar,
  renderMobileCard,
  className,
}: DataTableProps<T>) {
  const isTabletUp = useIsTabletUp()

  // ----- Saved view bootstrap (run once on mount) -----
  const initialView = React.useRef<SavedView | null>(null)
  if (initialView.current === null) {
    initialView.current = readSavedView(savedViewKey) ?? {}
  }

  // ----- State -----
  const [hiddenColumns, setHiddenColumns] = React.useState<Set<string>>(
    () => new Set(initialView.current?.hiddenColumns ?? columns.filter((c) => c.hiddenByDefault).map((c) => c.id)),
  )
  const [sort, setSort] = React.useState<SavedView["sort"]>(
    () => initialView.current?.sort ?? null,
  )
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(
    () => initialView.current?.pageSize ?? defaultPageSize,
  )
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [columnSheetOpen, setColumnSheetOpen] = React.useState(false)

  // Persist when changes
  React.useEffect(() => {
    writeSavedView(savedViewKey, {
      hiddenColumns: Array.from(hiddenColumns),
      sort,
      pageSize,
    })
  }, [savedViewKey, hiddenColumns, sort, pageSize])

  // Reset selection when data changes
  React.useEffect(() => {
    setSelected(new Set())
  }, [data])

  // Reset to page 1 when data length or pageSize changes
  React.useEffect(() => {
    setPage(1)
  }, [data.length, pageSize])

  const visibleColumns = React.useMemo(
    () => columns.filter((c) => !hiddenColumns.has(c.id)),
    [columns, hiddenColumns],
  )

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sort) return data
    const col = columns.find((c) => c.id === sort.columnId)
    if (!col || !col.sortable) return data
    const fn = col.sortValue
    const arr = [...data]
    arr.sort((a, b) => {
      const av = fn ? fn(a) : null
      const bv = fn ? fn(b) : null
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av < bv) return sort.direction === "asc" ? -1 : 1
      if (av > bv) return sort.direction === "asc" ? 1 : -1
      return 0
    })
    return arr
  }, [data, sort, columns])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const pageData = enablePagination
    ? sortedData.slice((page - 1) * pageSize, page * pageSize)
    : sortedData

  // ----- Selection helpers -----
  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllInPage() {
    setSelected((prev) => {
      const allIds = pageData.map((row, i) => getRowId(row, i))
      const allSelected = allIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        allIds.forEach((id) => next.delete(id))
      } else {
        allIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const allInPageSelected =
    pageData.length > 0 &&
    pageData.every((row, i) => selected.has(getRowId(row, i)))
  const someInPageSelected =
    pageData.some((row, i) => selected.has(getRowId(row, i))) && !allInPageSelected

  const selectedRows = React.useMemo(
    () =>
      data.filter((row, i) => selected.has(getRowId(row, i))),
    [data, selected, getRowId],
  )

  // ----- Sort toggle -----
  function toggleSort(colId: string) {
    setSort((prev) => {
      if (!prev || prev.columnId !== colId) return { columnId: colId, direction: "asc" }
      if (prev.direction === "asc") return { columnId: colId, direction: "desc" }
      return null
    })
  }

  // ----- Render -----
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Toolbar */}
      {(toolbar || enableColumnVisibility) && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <div className="flex flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          {enableColumnVisibility && (
            <button
              type="button"
              onClick={() => setColumnSheetOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
              คอลัมน์
              <span className="rounded-md bg-muted px-1.5 text-[10px] text-foreground">
                {visibleColumns.length}/{columns.length}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Body — desktop table or mobile card list */}
      {loading ? (
        <TableSkeleton rows={pageSize} columns={visibleColumns.length + (enableBulkSelect ? 1 : 0)} />
      ) : sortedData.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </div>
      ) : isTabletUp ? (
        <DesktopTable
          columns={visibleColumns}
          data={pageData}
          getRowId={getRowId}
          onRowClick={onRowClick}
          enableBulkSelect={enableBulkSelect}
          allSelected={allInPageSelected}
          someSelected={someInPageSelected}
          onToggleAll={toggleAllInPage}
          onToggleRow={toggleRow}
          isSelected={(id) => selected.has(id)}
          sort={sort}
          onToggleSort={toggleSort}
        />
      ) : (
        <MobileCardList
          columns={visibleColumns}
          data={pageData}
          getRowId={getRowId}
          onRowClick={onRowClick}
          enableBulkSelect={enableBulkSelect}
          isSelected={(id) => selected.has(id)}
          onToggleRow={toggleRow}
          renderCard={renderMobileCard}
        />
      )}

      {/* Pagination */}
      {enablePagination && sortedData.length > pageSize && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Bulk action bar */}
      {bulkActions && bulkActions.length > 0 && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={bulkActions}
          selectedRows={selectedRows}
        />
      )}

      {/* Column visibility sheet/popover */}
      {enableColumnVisibility && (
        <ColumnVisibilitySheet
          open={columnSheetOpen}
          onOpenChange={setColumnSheetOpen}
          columns={columns}
          hidden={hiddenColumns}
          onChange={setHiddenColumns}
        />
      )}
    </div>
  )
}

// =============================================================================
// Desktop table
// =============================================================================

interface DesktopTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  getRowId: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  enableBulkSelect?: boolean
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
  onToggleRow: (id: string) => void
  isSelected: (id: string) => boolean
  sort: SavedView["sort"]
  onToggleSort: (columnId: string) => void
}

function DesktopTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  enableBulkSelect,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleRow,
  isSelected,
  sort,
  onToggleSort,
}: DesktopTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-resting)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-xs">
            {enableBulkSelect && (
              <th className="w-10 px-3 py-2.5">
                <CheckboxCell
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAll}
                  ariaLabel="เลือกทั้งหน้า"
                />
              </th>
            )}
            {columns.map((c) => {
              const isSorted = sort?.columnId === c.id
              return (
                <th
                  key={c.id}
                  scope="col"
                  className={cn(
                    "px-3 py-2.5 font-medium text-muted-foreground",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    !c.align && "text-left",
                  )}
                  style={c.width ? { width: c.width, minWidth: c.width } : undefined}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => onToggleSort(c.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded transition-colors hover:text-foreground",
                        isSorted && "text-foreground",
                      )}
                    >
                      {c.header}
                      {isSorted ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const id = getRowId(row, i)
            const sel = isSelected(id)
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  sel && "bg-primary/5",
                  !sel && "hover:bg-muted/40",
                  onRowClick && "cursor-pointer",
                )}
              >
                {enableBulkSelect && (
                  <td className="w-10 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <CheckboxCell
                      checked={sel}
                      onChange={() => onToggleRow(id)}
                      ariaLabel={`เลือกแถว ${i + 1}`}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      "px-3 py-2.5 align-middle text-foreground",
                      c.align === "right" && "text-right",
                      c.align === "center" && "text-center",
                    )}
                  >
                    {c.cell(row, { rowIndex: i })}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// =============================================================================
// Mobile card list
// =============================================================================

interface MobileCardListProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  getRowId: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  enableBulkSelect?: boolean
  isSelected: (id: string) => boolean
  onToggleRow: (id: string) => void
  renderCard?: (row: T, ctx: { rowIndex: number; selected: boolean }) => React.ReactNode
}

function MobileCardList<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  enableBulkSelect,
  isSelected,
  onToggleRow,
  renderCard,
}: MobileCardListProps<T>) {
  // Treat first visible non-hidden column as the "primary" line
  const visibleCols = columns.filter((c) => !c.hideOnMobile)
  const [primary, ...rest] = visibleCols

  return (
    <ul className="space-y-2">
      {data.map((row, i) => {
        const id = getRowId(row, i)
        const selected = isSelected(id)

        if (renderCard) {
          return (
            <li
              key={id}
              className={cn(
                "rounded-2xl border bg-card p-3 transition-colors",
                selected ? "border-primary bg-primary/5" : "border-border",
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <div className="flex items-start gap-3">
                {enableBulkSelect && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <CheckboxCell
                      checked={selected}
                      onChange={() => onToggleRow(id)}
                      ariaLabel={`เลือกแถว ${i + 1}`}
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">{renderCard(row, { rowIndex: i, selected })}</div>
                {onRowClick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </div>
            </li>
          )
        }

        return (
          <li
            key={id}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "rounded-2xl border bg-card p-3 transition-colors",
              selected ? "border-primary bg-primary/5" : "border-border",
              onRowClick && "cursor-pointer hover:bg-muted/30",
            )}
          >
            <div className="flex items-start gap-3">
              {enableBulkSelect && (
                <div onClick={(e) => e.stopPropagation()}>
                  <CheckboxCell
                    checked={selected}
                    onChange={() => onToggleRow(id)}
                    ariaLabel={`เลือกแถว ${i + 1}`}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                {primary && (
                  <div className="text-sm font-semibold text-foreground">
                    {primary.cell(row, { rowIndex: i })}
                  </div>
                )}
                {rest.length > 0 && (
                  <div className="space-y-0.5">
                    {rest.map((c) => {
                      const value = c.mobileLine
                        ? c.mobileLine(row, { rowIndex: i })
                        : c.cell(row, { rowIndex: i })
                      if (value == null || value === "") return null
                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-muted-foreground">{c.header}</span>
                          <span className="text-foreground text-right truncate">{value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {onRowClick && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// =============================================================================
// Bulk action bar
// =============================================================================

interface BulkActionBarProps<T> {
  count: number
  onClear: () => void
  actions: BulkAction<T>[]
  selectedRows: T[]
}

function BulkActionBar<T>({
  count,
  onClear,
  actions,
  selectedRows,
}: BulkActionBarProps<T>) {
  if (count === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-30 flex justify-center px-3 sm:bottom-4 sm:px-6">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-[var(--shadow-raised)] backdrop-blur-md">
        <span className="text-xs font-medium text-muted-foreground">
          เลือกแล้ว <span className="font-bold text-foreground">{count}</span> รายการ
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => void a.onClick(selectedRows)}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium transition-colors",
                a.tone === "destructive"
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="ยกเลิกการเลือก"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Column visibility sheet
// =============================================================================

interface ColumnVisibilitySheetProps<T> {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef<T>[]
  hidden: Set<string>
  onChange: (next: Set<string>) => void
}

function ColumnVisibilitySheet<T>({
  open,
  onOpenChange,
  columns,
  hidden,
  onChange,
}: ColumnVisibilitySheetProps<T>) {
  function toggle(id: string) {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent snapPoints={[60, 90]}>
        <BottomSheetHeader>
          <BottomSheetTitle>คอลัมน์ที่แสดง</BottomSheetTitle>
        </BottomSheetHeader>
        <ul className="divide-y divide-border">
          {columns.map((c) => {
            const isHidden = hidden.has(c.id)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm"
                >
                  <span className="flex items-center gap-2">
                    {isHidden ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-foreground" />
                    )}
                    {c.header}
                  </span>
                  {!isHidden && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheetContent>
    </BottomSheet>
  )
}

// =============================================================================
// Skeleton & checkbox cell
// =============================================================================

function TableSkeleton({ rows, columns }: { rows: number; columns: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="space-y-2">
        {Array.from({ length: Math.min(rows, 8) }).map((_, i) => (
          <div key={i} className="flex gap-3">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CheckboxCellProps {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  ariaLabel: string
}

function CheckboxCell({
  checked,
  indeterminate,
  onChange,
  ariaLabel,
}: CheckboxCellProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked
  }, [indeterminate, checked])

  return (
    <label className="inline-flex cursor-pointer items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
      />
    </label>
  )
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { MobileCardList }
