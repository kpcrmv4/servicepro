"use client"

import * as React from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsTabletUp } from "@/hooks/use-media-query"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet"

// =============================================================================
// Types
// =============================================================================

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface BasePickerProps {
  /** Title shown in mobile bottom sheet */
  title?: string
  /** Hidden form input mirror name (single mode) — emits ISO date string */
  name?: string
  /** Form input prefix for range mode — emits {prefix}From and {prefix}To */
  rangeNamePrefix?: string
  placeholder?: string
  disabled?: boolean
  error?: boolean
  className?: string
  /** Restrict picker minimum date */
  min?: Date
  /** Restrict picker maximum date */
  max?: Date
  /** Show "วันนี้" / "เมื่อวาน" / "พรุ่งนี้" shortcut chips */
  showShortcuts?: boolean
}

interface SinglePickerProps extends BasePickerProps {
  mode?: "single"
  value?: Date | null
  onChange?: (date: Date | null) => void
  defaultValue?: Date | null
}

interface RangePickerProps extends BasePickerProps {
  mode: "range"
  value?: DateRange
  onChange?: (range: DateRange) => void
  defaultValue?: DateRange
}

type DatePickerProps = SinglePickerProps | RangePickerProps

// =============================================================================
// Helpers — Buddhist year display (พ.ศ. = ค.ศ. + 543)
// =============================================================================

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]
const TH_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

function toBuddhistYear(d: Date): number {
  return d.getFullYear() + 543
}

function formatBuddhistDate(d: Date | null): string {
  if (!d) return ""
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()].slice(0, 3)} ${toBuddhistYear(d)}`
}

function buildMonthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
  const days: Date[] = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }
  return days
}

// =============================================================================
// Main component
// =============================================================================

export function DatePicker(props: DatePickerProps) {
  const isRange = props.mode === "range"
  return isRange ? (
    <RangeDatePicker {...(props as RangePickerProps)} />
  ) : (
    <SingleDatePicker {...(props as SinglePickerProps)} />
  )
}

// =============================================================================
// Single
// =============================================================================

function SingleDatePicker({
  value: controlledValue,
  onChange,
  defaultValue = null,
  title = "เลือกวันที่",
  name,
  placeholder = "เลือกวันที่",
  disabled,
  error,
  className,
  min,
  max,
  showShortcuts = true,
}: SinglePickerProps) {
  const [uncontrolled, setUncontrolled] = React.useState<Date | null>(defaultValue)
  const value = controlledValue !== undefined ? controlledValue : uncontrolled
  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState<Date>(() => value ?? new Date())

  const isTabletUp = useIsTabletUp()

  function commit(next: Date | null) {
    if (onChange) onChange(next)
    else setUncontrolled(next)
    setOpen(false)
  }

  return (
    <div className="relative inline-block w-full">
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ? format(value, "yyyy-MM-dd") : ""}
          readOnly
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-11 w-full sm:h-10 items-center gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive focus:ring-destructive" : "border-border",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "flex-1 truncate text-left",
            !value && "text-muted-foreground",
          )}
        >
          {value ? formatBuddhistDate(value) : placeholder}
        </span>
        {value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="ล้างวันที่"
            onClick={(e) => {
              e.stopPropagation()
              commit(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                commit(null)
              }
            }}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <PickerSurface
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        isTabletUp={isTabletUp}
      >
        {showShortcuts && (
          <Shortcuts
            onPick={(d) => {
              setViewMonth(d)
              commit(d)
            }}
          />
        )}
        <CalendarMonth
          month={viewMonth}
          onMonthChange={setViewMonth}
          isSelected={(d) => (value ? isSameDay(d, value) : false)}
          isDisabled={(d) => isOutOfRange(d, min, max)}
          onPick={commit}
        />
      </PickerSurface>
    </div>
  )
}

// =============================================================================
// Range
// =============================================================================

function RangeDatePicker({
  value: controlledValue,
  onChange,
  defaultValue,
  title = "เลือกช่วงวันที่",
  rangeNamePrefix,
  placeholder = "เลือกช่วงวันที่",
  disabled,
  error,
  className,
  min,
  max,
  showShortcuts = true,
}: RangePickerProps) {
  const [uncontrolled, setUncontrolled] = React.useState<DateRange>(
    defaultValue ?? { from: null, to: null },
  )
  const value = controlledValue ?? uncontrolled

  const [open, setOpen] = React.useState(false)
  const [viewMonth, setViewMonth] = React.useState<Date>(
    () => value.from ?? new Date(),
  )
  const [hovered, setHovered] = React.useState<Date | null>(null)
  const isTabletUp = useIsTabletUp()

  function commit(next: DateRange) {
    if (onChange) onChange(next)
    else setUncontrolled(next)
  }

  function handlePick(d: Date) {
    if (!value.from || (value.from && value.to)) {
      commit({ from: d, to: null })
    } else if (isBefore(d, value.from)) {
      commit({ from: d, to: value.from })
      setOpen(false)
    } else {
      commit({ from: value.from, to: d })
      setOpen(false)
    }
  }

  const previewTo = !value.to && hovered && value.from && !isBefore(hovered, value.from)
    ? hovered
    : value.to

  function isInRange(d: Date) {
    if (!value.from) return false
    const end = previewTo
    if (!end) return false
    return !isBefore(d, value.from) && !isAfter(d, end)
  }

  function isSelectedEdge(d: Date) {
    if (value.from && isSameDay(d, value.from)) return true
    if (value.to && isSameDay(d, value.to)) return true
    return false
  }

  return (
    <div className="relative inline-block w-full">
      {rangeNamePrefix && (
        <>
          <input
            type="hidden"
            name={`${rangeNamePrefix}From`}
            value={value.from ? format(value.from, "yyyy-MM-dd") : ""}
            readOnly
          />
          <input
            type="hidden"
            name={`${rangeNamePrefix}To`}
            value={value.to ? format(value.to, "yyyy-MM-dd") : ""}
            readOnly
          />
        </>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-11 w-full sm:h-10 items-center gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive focus:ring-destructive" : "border-border",
          className,
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "flex-1 truncate text-left",
            !value.from && "text-muted-foreground",
          )}
        >
          {value.from
            ? value.to
              ? `${formatBuddhistDate(value.from)} – ${formatBuddhistDate(value.to)}`
              : `${formatBuddhistDate(value.from)} – …`
            : placeholder}
        </span>
        {(value.from || value.to) && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="ล้างช่วงวันที่"
            onClick={(e) => {
              e.stopPropagation()
              commit({ from: null, to: null })
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                commit({ from: null, to: null })
              }
            }}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      <PickerSurface
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        isTabletUp={isTabletUp}
      >
        {showShortcuts && (
          <Shortcuts
            range
            onPickRange={(r) => {
              if (r.from) setViewMonth(r.from)
              commit(r)
              setOpen(false)
            }}
          />
        )}
        <CalendarMonth
          month={viewMonth}
          onMonthChange={setViewMonth}
          isSelected={isSelectedEdge}
          isInRange={isInRange}
          isDisabled={(d) => isOutOfRange(d, min, max)}
          onPick={handlePick}
          onHover={setHovered}
        />
      </PickerSurface>
    </div>
  )
}

// =============================================================================
// Picker surface wrapper (popover ↔ bottom sheet)
// =============================================================================

function PickerSurface({
  open,
  onClose,
  title,
  isTabletUp,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  isTabletUp: boolean
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open || !isTabletUp) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) {
        onClose()
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose, isTabletUp])

  if (!open) return null

  if (!isTabletUp) {
    return (
      <BottomSheet open={open} onOpenChange={(o) => !o && onClose()}>
        <BottomSheetContent snapPoints={[80, 95]}>
          <BottomSheetHeader>
            <BottomSheetTitle>{title}</BottomSheetTitle>
          </BottomSheetHeader>
          <div>{children}</div>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 w-[320px] overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-raised)]"
    >
      {children}
    </div>
  )
}

// =============================================================================
// Calendar month
// =============================================================================

interface CalendarMonthProps {
  month: Date
  onMonthChange: (d: Date) => void
  isSelected: (d: Date) => boolean
  isInRange?: (d: Date) => boolean
  isDisabled?: (d: Date) => boolean
  onPick: (d: Date) => void
  onHover?: (d: Date | null) => void
}

function CalendarMonth({
  month,
  onMonthChange,
  isSelected,
  isInRange,
  isDisabled,
  onPick,
  onHover,
}: CalendarMonthProps) {
  const days = buildMonthGrid(month)

  return (
    <div onMouseLeave={() => onHover?.(null)}>
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="เดือนก่อน"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold">
          {TH_MONTHS[month.getMonth()]} {toBuddhistYear(month)}
        </div>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="เดือนถัดไป"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-1 text-center text-[10px] font-medium uppercase text-muted-foreground">
        {TH_DAYS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 px-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month)
          const selected = isSelected(d)
          const inRange = isInRange?.(d) ?? false
          const disabled = isDisabled?.(d) ?? false
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              onMouseEnter={() => onHover?.(d)}
              className={cn(
                "relative flex h-9 items-center justify-center text-sm transition-colors",
                "disabled:cursor-not-allowed disabled:text-muted-foreground/40",
                !inMonth && "text-muted-foreground/40",
                inRange && !selected && "bg-primary/10 text-primary",
                selected && "rounded-lg bg-primary font-semibold text-primary-foreground",
                !selected && !inRange && !disabled && "rounded-lg hover:bg-muted",
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function isOutOfRange(d: Date, min?: Date, max?: Date): boolean {
  if (min && isBefore(d, min) && !isSameDay(d, min)) return true
  if (max && isAfter(d, max) && !isSameDay(d, max)) return true
  return false
}

// =============================================================================
// Shortcuts row
// =============================================================================

function Shortcuts({
  onPick,
  onPickRange,
  range,
}: {
  onPick?: (d: Date) => void
  onPickRange?: (r: DateRange) => void
  range?: boolean
}) {
  if (range) {
    const today = new Date()
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const items: { label: string; range: DateRange }[] = [
      {
        label: "วันนี้",
        range: { from: startToday, to: startToday },
      },
      {
        label: "7 วัน",
        range: { from: new Date(startToday.getTime() - 6 * 24 * 60 * 60 * 1000), to: startToday },
      },
      {
        label: "30 วัน",
        range: { from: new Date(startToday.getTime() - 29 * 24 * 60 * 60 * 1000), to: startToday },
      },
      {
        label: "เดือนนี้",
        range: { from: startOfMonth(startToday), to: endOfMonth(startToday) },
      },
    ]
    return (
      <div className="mb-2 flex flex-wrap gap-1">
        {items.map((it) => (
          <button
            key={it.label}
            type="button"
            onClick={() => onPickRange?.(it.range)}
            className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {it.label}
          </button>
        ))}
      </div>
    )
  }

  const today = new Date()
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  return (
    <div className="mb-2 flex flex-wrap gap-1">
      {[
        { label: "วันนี้", date: today },
        { label: "เมื่อวาน", date: yesterday },
        { label: "พรุ่งนี้", date: tomorrow },
      ].map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => onPick?.(it.date)}
          className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

// =============================================================================
// Helpers
// =============================================================================

/** Parse a yyyy-MM-dd string into a local Date. Returns null on bad input. */
export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null
  try {
    return parseISO(value)
  } catch {
    return null
  }
}
