"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsTabletUp } from "@/hooks/use-media-query"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet"

// =============================================================================
// Context
// =============================================================================

interface SelectItemDescriptor {
  value: string
  label: React.ReactNode
}

interface SelectContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  /** Title shown in mobile bottom-sheet header */
  title?: string
  /** Form name for hidden input mirror (FormData support) */
  name?: string
  /** Active descendant index for keyboard nav */
  activeIndex: number
  setActiveIndex: (i: number) => void
  /** Registered items so trigger can render selected label */
  registerItem: (item: SelectItemDescriptor) => () => void
  items: SelectItemDescriptor[]
  /** Force render mode — overrides auto-detection */
  forceMode?: "popover" | "sheet"
}

const SelectContext = React.createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
  value: "",
  onValueChange: () => {},
  activeIndex: -1,
  setActiveIndex: () => {},
  registerItem: () => () => {},
  items: [],
})

// =============================================================================
// Root
// =============================================================================

interface SelectRootProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
  /** Label for accessible mobile bottom-sheet header */
  title?: string
  /** Hidden `<input name>` mirror for native FormData */
  name?: string
  /** Force a specific render mode (rarely needed; auto-detects by viewport) */
  mode?: "popover" | "sheet"
}

function Select({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
  title,
  name,
  mode,
}: SelectRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const [items, setItems] = React.useState<SelectItemDescriptor[]>([])

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (onValueChange) onValueChange(newValue)
      else setUncontrolledValue(newValue)
      setOpen(false)
    },
    [onValueChange],
  )

  const registerItem = React.useCallback((item: SelectItemDescriptor) => {
    setItems((prev) => {
      if (prev.some((p) => p.value === item.value)) return prev
      return [...prev, item]
    })
    return () => {
      setItems((prev) => prev.filter((p) => p.value !== item.value))
    }
  }, [])

  React.useEffect(() => {
    if (!open) {
      setActiveIndex(-1)
      return
    }
    // When opening, place active on current value
    const idx = items.findIndex((it) => it.value === value)
    setActiveIndex(idx >= 0 ? idx : 0)
  }, [open, value, items])

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value,
        onValueChange: handleValueChange,
        title,
        name,
        activeIndex,
        setActiveIndex,
        registerItem,
        items,
        forceMode: mode,
      }}
    >
      <div className="relative inline-block w-full">
        {children}
        {name && <input type="hidden" name={name} value={value} readOnly />}
      </div>
    </SelectContext.Provider>
  )
}

// =============================================================================
// Trigger
// =============================================================================

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { error?: boolean }
>(function SelectTrigger({ className, children, error, ...props }, ref) {
  const { open, setOpen, items, value, activeIndex, setActiveIndex, onValueChange } =
    React.useContext(SelectContext)

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(Math.min(items.length - 1, activeIndex + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(Math.max(0, activeIndex - 1))
    } else if (e.key === "Home") {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === "End") {
      e.preventDefault()
      setActiveIndex(items.length - 1)
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      const item = items[activeIndex]
      if (item) onValueChange(item.value)
    }
  }

  const listboxId = React.useId()

  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      data-listbox-id={listboxId}
      data-state={open ? "open" : "closed"}
      data-value={value || undefined}
      aria-invalid={error || undefined}
      onClick={() => setOpen(!open)}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-11 w-full sm:h-10 items-center justify-between gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm text-foreground ring-offset-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-destructive focus:ring-destructive"
          : "border-border",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
    </button>
  )
})

// =============================================================================
// Value display
// =============================================================================

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, items } = React.useContext(SelectContext)
  const selected = items.find((it) => it.value === value)
  if (!value) {
    return <span className="text-muted-foreground">{placeholder}</span>
  }
  return <span className="truncate">{selected?.label ?? value}</span>
}

// =============================================================================
// Content (auto-switches popover ↔ bottom sheet)
// =============================================================================

function SelectContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, title, forceMode } = React.useContext(SelectContext)
  const isTabletUp = useIsTabletUp()
  const useSheet = forceMode === "sheet" || (forceMode !== "popover" && !isTabletUp)

  if (useSheet) {
    return (
      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent snapPoints={[55, 90]}>
          {title && (
            <BottomSheetHeader>
              <BottomSheetTitle>{title}</BottomSheetTitle>
            </BottomSheetHeader>
          )}
          <div className={cn("py-1", className)} {...props}>
            {children}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  return <PopoverContent className={className} {...props}>{children}</PopoverContent>
}

function PopoverContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = React.useContext(SelectContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.parentElement?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onClickOutside)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={ref}
      role="listbox"
      className={cn(
        "absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-raised)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// =============================================================================
// Item
// =============================================================================

function SelectItem({
  children,
  value: itemValue,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const {
    value,
    onValueChange,
    activeIndex,
    setActiveIndex,
    items,
    registerItem,
  } = React.useContext(SelectContext)

  React.useEffect(() => {
    return registerItem({ value: itemValue, label: children })
  }, [itemValue, children, registerItem])

  const index = items.findIndex((it) => it.value === itemValue)
  const isSelected = value === itemValue
  const isActive = index === activeIndex

  return (
    <div
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm outline-none sm:py-1.5",
        isActive && "bg-muted",
        isSelected && "font-medium",
        className,
      )}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => onValueChange(itemValue)}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
          <Check className="h-4 w-4" />
        </span>
      )}
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
