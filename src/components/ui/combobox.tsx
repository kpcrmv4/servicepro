"use client"

import * as React from "react"
import { ChevronDown, Check, Search, Loader2, X } from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
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

export interface ComboboxOption {
  value: string
  label: string
  /** Optional sub-text rendered under label */
  hint?: string
  /** Optional leading element (avatar, icon, color dot) */
  icon?: React.ReactNode
  disabled?: boolean
  /** Optional searchable keywords beyond label/hint */
  keywords?: string[]
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string

  /** Placeholder shown in the trigger when no value is selected */
  placeholder?: string
  /** Title shown above search input on mobile bottom sheet */
  title?: string
  /** Empty-state text when search yields no results */
  emptyText?: string

  /** External loading flag (e.g. async fetch in progress) */
  loading?: boolean
  /** When provided, the consumer handles search (server-side / async) */
  onSearchChange?: (query: string) => void

  /** Hidden form input mirror */
  name?: string
  /** Disable the trigger */
  disabled?: boolean
  /** Render in error state */
  error?: boolean

  className?: string
  /** Allow clearing selection with an X button (only visible when value set) */
  clearable?: boolean
}

const ROW_HEIGHT = 44

// =============================================================================
// Component
// =============================================================================

export function Combobox({
  options,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  placeholder = "เลือก...",
  title,
  emptyText = "ไม่พบรายการ",
  loading,
  onSearchChange,
  name,
  disabled,
  error,
  className,
  clearable,
}: ComboboxProps) {
  const isTabletUp = useIsTabletUp()
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)

  const value = controlledValue ?? uncontrolled
  const selected = options.find((o) => o.value === value)

  const handleChange = (next: string) => {
    if (onValueChange) onValueChange(next)
    else setUncontrolled(next)
    setOpen(false)
    setQuery("")
  }

  const handleSearch = (q: string) => {
    setQuery(q)
    setActiveIndex(0)
    onSearchChange?.(q)
  }

  // Local filter when consumer doesn't provide async search
  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return options
    if (!query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter((o) => {
      if (o.label.toLowerCase().includes(q)) return true
      if (o.hint?.toLowerCase().includes(q)) return true
      if (o.keywords?.some((k) => k.toLowerCase().includes(q))) return true
      return false
    })
  }, [options, query, onSearchChange])

  const triggerLabel = selected?.label ?? placeholder

  return (
    <div className="relative inline-block w-full">
      {name && <input type="hidden" name={name} value={value} readOnly />}

      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-11 w-full sm:h-10 items-center gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-destructive focus:ring-destructive" : "border-border",
          className,
        )}
      >
        {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
        <span
          className={cn(
            "flex-1 truncate text-left",
            !selected && "text-muted-foreground",
          )}
        >
          {triggerLabel}
        </span>
        {clearable && value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="ล้างค่า"
            onClick={(e) => {
              e.stopPropagation()
              handleChange("")
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                handleChange("")
              }
            }}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Mobile = bottom sheet, desktop = popover */}
      {!isTabletUp ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetContent snapPoints={[70, 95]}>
            {title && (
              <BottomSheetHeader>
                <BottomSheetTitle>{title}</BottomSheetTitle>
              </BottomSheetHeader>
            )}
            <ComboboxBody
              options={filteredOptions}
              query={query}
              onSearch={handleSearch}
              loading={loading}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              selectedValue={value}
              onPick={handleChange}
              emptyText={emptyText}
            />
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        open && (
          <ComboboxPopover onClose={() => setOpen(false)}>
            <ComboboxBody
              options={filteredOptions}
              query={query}
              onSearch={handleSearch}
              loading={loading}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              selectedValue={value}
              onPick={handleChange}
              emptyText={emptyText}
            />
          </ComboboxPopover>
        )
      )}
    </div>
  )
}

// =============================================================================
// Popover wrapper (desktop)
// =============================================================================

function ComboboxPopover({
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
// Body — search input + virtualized list
// =============================================================================

interface BodyProps {
  options: ComboboxOption[]
  query: string
  onSearch: (q: string) => void
  loading?: boolean
  activeIndex: number
  setActiveIndex: (i: number) => void
  selectedValue: string
  onPick: (value: string) => void
  emptyText: string
}

function ComboboxBody({
  options,
  query,
  onSearch,
  loading,
  activeIndex,
  setActiveIndex,
  selectedValue,
  onPick,
  emptyText,
}: BodyProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const parentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const virt = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  })

  // Keep active item visible as user arrows
  React.useEffect(() => {
    if (activeIndex < 0 || activeIndex >= options.length) return
    virt.scrollToIndex(activeIndex, { align: "auto" })
  }, [activeIndex, options.length, virt])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(Math.min(options.length - 1, activeIndex + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(Math.max(0, activeIndex - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt && !opt.disabled) onPick(opt.value)
    } else if (e.key === "Home") {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActiveIndex(options.length - 1)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ค้นหา..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="off"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      <div ref={parentRef} className="max-h-[60vh] overflow-y-auto sm:max-h-72">
        {options.length === 0 && !loading ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div
            role="listbox"
            style={{ height: virt.getTotalSize(), position: "relative", width: "100%" }}
          >
            {virt.getVirtualItems().map((row) => {
              const opt = options[row.index]
              const isSelected = opt.value === selectedValue
              const isActive = row.index === activeIndex
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  data-active={isActive || undefined}
                  onMouseEnter={() => setActiveIndex(row.index)}
                  onClick={() => !opt.disabled && onPick(opt.value)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: row.size,
                    transform: `translateY(${row.start}px)`,
                  }}
                  className={cn(
                    "flex cursor-pointer select-none items-center gap-2 px-3 text-sm",
                    isActive && "bg-muted",
                    opt.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{opt.label}</div>
                    {opt.hint && (
                      <div className="truncate text-[11px] text-muted-foreground">
                        {opt.hint}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
