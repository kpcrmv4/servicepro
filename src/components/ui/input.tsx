import * as React from "react"
import { cn } from "@/lib/utils"

type InputBaseProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix">

export interface InputProps extends InputBaseProps {
  /** Icon or element rendered inside the input on the left side */
  prefix?: React.ReactNode
  /** Icon or element rendered inside the input on the right side */
  suffix?: React.ReactNode
  /** Render as error state (red border + ring) */
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, prefix, suffix, error, ...props }, ref) => {
    const baseClasses = cn(
      // Height: 44 mobile (no-zoom + tap target) → 40 desktop
      "flex h-11 w-full sm:h-10 rounded-xl border bg-background text-sm text-foreground ring-offset-background",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error
        ? "border-destructive focus-visible:ring-destructive"
        : "border-border",
    )

    if (!prefix && !suffix) {
      return (
        <input
          type={type}
          className={cn(baseClasses, "px-3.5 py-2", className)}
          ref={ref}
          aria-invalid={error || undefined}
          {...props}
        />
      )
    }

    return (
      <div
        className={cn(
          baseClasses,
          "items-center",
          // wrapper has the border now; reset internal input
          "px-2",
          className,
        )}
        data-input-wrapper
      >
        {prefix ? (
          <span className="flex shrink-0 items-center justify-center px-1.5 text-muted-foreground [&_svg]:size-4">
            {prefix}
          </span>
        ) : null}
        <input
          type={type}
          ref={ref}
          aria-invalid={error || undefined}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          )}
          {...props}
        />
        {suffix ? (
          <span className="flex shrink-0 items-center justify-center px-1.5 text-muted-foreground [&_svg]:size-4">
            {suffix}
          </span>
        ) : null}
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
