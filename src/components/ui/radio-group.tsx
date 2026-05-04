"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// Context
// =============================================================================

interface RadioGroupContextValue {
  name?: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: "",
  onValueChange: () => {},
})

// =============================================================================
// Root
// =============================================================================

interface RadioGroupProps {
  /** Visual style — "list" stacks radio rows; "segmented" renders pill chips */
  variant?: "list" | "segmented"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Form input name */
  name?: string
  /** Disable all options */
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function RadioGroup({
  variant = "list",
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  name,
  disabled,
  className,
  children,
}: RadioGroupProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolled

  function handleChange(next: string) {
    if (onValueChange) onValueChange(next)
    else setUncontrolled(next)
  }

  return (
    <RadioGroupContext.Provider
      value={{ name, value, onValueChange: handleChange, disabled }}
    >
      <div
        role="radiogroup"
        aria-disabled={disabled || undefined}
        className={cn(
          variant === "segmented"
            ? "inline-flex w-full rounded-xl border border-border bg-muted p-1"
            : "flex flex-col gap-2",
          className,
        )}
        data-variant={variant}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

// =============================================================================
// Item — list variant (radio + label row)
// =============================================================================

interface RadioGroupItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "type"> {
  value: string
  description?: string
}

export function RadioGroupItem({
  value: itemValue,
  className,
  children,
  description,
  ...props
}: RadioGroupItemProps) {
  const ctx = React.useContext(RadioGroupContext)
  const isSelected = ctx.value === itemValue
  const isDisabled = ctx.disabled || props.disabled

  function handleClick() {
    if (!isDisabled) ctx.onValueChange(itemValue)
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 transition-colors",
        isSelected && "border-primary bg-primary/5",
        !isSelected && !isDisabled && "hover:bg-muted",
        isDisabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isSelected ? "border-primary" : "border-border",
        )}
        {...props}
      >
        {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </button>
      {ctx.name && (
        <input
          type="radio"
          name={ctx.name}
          value={itemValue}
          checked={isSelected}
          onChange={handleClick}
          className="sr-only"
          tabIndex={-1}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-tight">{children}</div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </label>
  )
}

// =============================================================================
// Item — segmented variant (chip)
// =============================================================================

interface SegmentedItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string
}

export function SegmentedItem({
  value: itemValue,
  className,
  children,
  ...props
}: SegmentedItemProps) {
  const ctx = React.useContext(RadioGroupContext)
  const isSelected = ctx.value === itemValue
  const isDisabled = ctx.disabled || props.disabled

  function handleClick() {
    if (!isDisabled) ctx.onValueChange(itemValue)
  }

  return (
    <>
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
          isSelected
            ? "bg-card text-foreground shadow-[var(--shadow-resting)]"
            : "text-muted-foreground hover:text-foreground",
          isDisabled && "cursor-not-allowed opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
      {ctx.name && (
        <input
          type="radio"
          name={ctx.name}
          value={itemValue}
          checked={isSelected}
          onChange={handleClick}
          className="sr-only"
          tabIndex={-1}
        />
      )}
    </>
  )
}
