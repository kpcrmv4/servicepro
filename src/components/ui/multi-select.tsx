"use client"

import * as React from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsTabletUp } from "@/hooks/use-media-query"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet"

export interface MultiSelectOption {
  value: string
  label: string
  hint?: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onChange?: (values: string[]) => void
  defaultValue?: string[]

  placeholder?: string
  /** Title shown in mobile bottom sheet */
  title?: string
  /** Hidden form input mirror — emits one input per selected value */
  name?: string
  /** Maximum chips to render before condensing to "+N more" */
  maxChips?: number
  /** Empty-state when search yields no results */
  emptyText?: string

  disabled?: boolean
  error?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value: controlledValue,
  onChange,
  defaultValue = [],
  placeholder = "เลือก...",
  title,
  name,
  maxChips = 3,
  emptyText = "ไม่พบรายการ",
  disabled,
  error,
  className,
}: MultiSelectProps) {
  const isTabletUp = useIsTabletUp()
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const value = controlledValue ?? uncontrolled

  function commit(next: string[]) {
    if (onChange) onChange(next)
    else setUncontrolled(next)
  }

  function toggle(optionValue: string) {
    const exists = value.includes(optionValue)
    commit(exists ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  function removeChip(optionValue: string) {
    commit(value.filter((v) => v !== optionValue))
  }

  function clearAll() {
    commit([])
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.hint?.toLowerCase().includes(q),
    )
  }, [options, query])

  const selectedOptions = options.filter((o) => value.includes(o.value))
  const visibleChips = selectedOptions.slice(0, maxChips)
  const overflow = selectedOptions.length - visibleChips.length

  return (
    <div className="relative inline-block w-full">
      {/* Hidden inputs for native FormData */}
      {name && value.map((v) => <input key={v} type="hidden" name={name} value={v} readOnly />)}

      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex min-h-11 sm:min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl border bg-background px-2.5 py-1.5 text-sm text-foreground ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive focus:ring-destructive" : "border-border",
          className,
        )}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <>
            {visibleChips.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
              >
                {opt.label}
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`ลบ ${opt.label}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeChip(opt.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      removeChip(opt.value)
                    }
                  }}
                  className="rounded-full hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="rounded-lg bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{overflow}
              </span>
            )}
          </>
        )}
        <span className="ml-auto flex items-center gap-1">
          {selectedOptions.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              aria-label="ล้างทั้งหมด"
              onClick={(e) => {
                e.stopPropagation()
                clearAll()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  e.stopPropagation()
                  clearAll()
                }
              }}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </span>
      </button>

      {!isTabletUp ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetContent snapPoints={[70, 95]}>
            {title && (
              <BottomSheetHeader>
                <BottomSheetTitle>{title}</BottomSheetTitle>
              </BottomSheetHeader>
            )}
            <Body
              options={filtered}
              query={query}
              onSearch={setQuery}
              selectedValues={value}
              onToggle={toggle}
              onClearAll={clearAll}
              emptyText={emptyText}
            />
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        open && (
          <Popover onClose={() => setOpen(false)}>
            <Body
              options={filtered}
              query={query}
              onSearch={setQuery}
              selectedValues={value}
              onToggle={toggle}
              onClearAll={clearAll}
              emptyText={emptyText}
            />
          </Popover>
        )
      )}
    </div>
  )
}

// =============================================================================

function Popover({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
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
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-[var(--shadow-raised)]"
    >
      {children}
    </div>
  )
}

// =============================================================================

interface BodyProps {
  options: MultiSelectOption[]
  query: string
  onSearch: (q: string) => void
  selectedValues: string[]
  onToggle: (value: string) => void
  onClearAll: () => void
  emptyText: string
}

function Body({
  options,
  query,
  onSearch,
  selectedValues,
  onToggle,
  onClearAll,
  emptyText,
}: BodyProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="ค้นหา..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        {selectedValues.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-primary hover:underline"
          >
            ล้างทั้งหมด
          </button>
        )}
      </div>

      <div className="max-h-[60vh] overflow-y-auto sm:max-h-72">
        {options.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value)
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onClick={() => !opt.disabled && onToggle(opt.value)}
                className={cn(
                  "flex cursor-pointer select-none items-center gap-3 px-3 py-2.5 text-sm sm:py-2",
                  isSelected && "bg-muted",
                  opt.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                <div className="min-w-0 flex-1">
                  <div className="truncate">{opt.label}</div>
                  {opt.hint && (
                    <div className="truncate text-[11px] text-muted-foreground">
                      {opt.hint}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
