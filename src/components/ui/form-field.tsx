"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// FormField — label + control + hint/error in a unified layout
// =============================================================================

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visible label rendered above the control */
  label?: React.ReactNode
  /** Inline help text shown under control when there is no error */
  hint?: React.ReactNode
  /** Error message — when present, overrides hint and applies error styling */
  error?: React.ReactNode
  /** Mark field as required (shows red asterisk) */
  required?: boolean
  /** id of the underlying input — auto-wires label htmlFor and aria-describedby */
  htmlFor?: string
  /** Reverse layout — label sits to the right (for switch/checkbox rows) */
  reverse?: boolean
  /** Optional secondary content next to the label (e.g. char counter) */
  labelAside?: React.ReactNode
}

/**
 * Unified form field wrapper. Children should be the control (Input/Select/etc.).
 *
 * ```tsx
 * <FormField label="ชื่อลูกค้า" htmlFor="name" required error={errors.name}>
 *   <Input id="name" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  hint,
  error,
  required,
  htmlFor,
  reverse,
  labelAside,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId()
  const errorId = `${htmlFor ?? generatedId}-error`
  const hintId = `${htmlFor ?? generatedId}-hint`

  const labelEl = label ? (
    <div className="flex items-center justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {labelAside && (
        <span className="text-[11px] text-muted-foreground">{labelAside}</span>
      )}
    </div>
  ) : null

  const helperEl =
    error || hint ? (
      <p
        id={error ? errorId : hintId}
        className={cn(
          "text-xs leading-snug",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ?? hint}
      </p>
    ) : null

  return (
    <div
      className={cn(
        reverse
          ? "flex items-center justify-between gap-3"
          : "flex flex-col gap-1.5",
        className,
      )}
      {...props}
    >
      {reverse ? (
        <>
          <div className="min-w-0 flex-1">
            {labelEl}
            {helperEl}
          </div>
          <div className="shrink-0">{children}</div>
        </>
      ) : (
        <>
          {labelEl}
          {children}
          {helperEl}
        </>
      )}
    </div>
  )
}

// =============================================================================
// FormSection — grouping of fields with optional collapse
// =============================================================================

interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: React.ReactNode
  /** Render as collapsible accordion — defaults to false */
  collapsible?: boolean
  /** Initial open state for collapsible sections */
  defaultOpen?: boolean
  /** Optional element rendered to the right of the title (CTA, badge) */
  action?: React.ReactNode
  /** Visual weight — "card" wraps in a Card, "plain" just spacing */
  variant?: "card" | "plain"
}

export function FormSection({
  title,
  description,
  collapsible,
  defaultOpen = true,
  action,
  variant = "card",
  className,
  children,
  ...props
}: FormSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const isOpen = collapsible ? open : true

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {action ? (
        <div className="shrink-0">{action}</div>
      ) : collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs font-medium text-primary hover:underline"
          aria-expanded={isOpen}
        >
          {isOpen ? "ซ่อน" : "แสดง"}
        </button>
      ) : null}
    </div>
  )

  return (
    <div
      className={cn(
        variant === "card"
          ? "rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-resting)] sm:p-5"
          : "py-3",
        className,
      )}
      {...props}
    >
      {header}
      {isOpen && (
        <div className="mt-4 space-y-4">{children}</div>
      )}
    </div>
  )
}
