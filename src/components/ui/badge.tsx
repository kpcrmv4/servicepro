import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border text-foreground",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-yellow-500 text-white",
      },
      tone: {
        none: "",
        success: "border-transparent bg-success-light text-green-700 dark:bg-green-950 dark:text-green-300",
        warn: "border-transparent bg-warning-light text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        error: "border-transparent bg-error-light text-red-700 dark:bg-red-950 dark:text-red-300",
        info: "border-transparent bg-info-light text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "none",
    },
  }
)

const dotToneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  none: "bg-current",
  success: "bg-green-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-cyan-500",
  neutral: "bg-muted-foreground",
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Render a leading dot indicator (8px filled circle) */
  dot?: boolean
}

function Badge({ className, variant, tone, dot, children, ...props }: BadgeProps) {
  // tone takes precedence over variant when both are set
  const useTone = tone && tone !== "none"
  return (
    <div
      className={cn(
        badgeVariants({
          variant: useTone ? undefined : variant,
          tone: useTone ? tone : "none",
        }),
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn("inline-block h-1.5 w-1.5 rounded-full", dotToneClass[tone ?? "none"])}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
