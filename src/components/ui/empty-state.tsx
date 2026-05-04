import * as React from "react"
import { Inbox, AlertCircle, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateVariant = "no-data" | "error" | "search-no-result"

const variantConfig: Record<
  EmptyStateVariant,
  { icon: React.ComponentType<{ className?: string }>; toneClass: string }
> = {
  "no-data": { icon: Inbox, toneClass: "bg-muted text-muted-foreground" },
  error: { icon: AlertCircle, toneClass: "bg-error-light text-red-600" },
  "search-no-result": { icon: SearchX, toneClass: "bg-muted text-muted-foreground" },
}

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: EmptyStateVariant
  /** Custom icon — overrides variant default */
  icon?: React.ReactNode
  title: string
  description?: string
  /** Primary CTA — usually a Button */
  action?: React.ReactNode
  /** Secondary action below primary (e.g., link to docs) */
  secondaryAction?: React.ReactNode
  /** Visual size — defaults to `md` */
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: { wrapper: "py-8", icon: "h-12 w-12", title: "text-base", description: "text-xs" },
  md: { wrapper: "py-12", icon: "h-16 w-16", title: "text-lg", description: "text-sm" },
  lg: { wrapper: "py-20", icon: "h-20 w-20", title: "text-xl", description: "text-base" },
}

export function EmptyState({
  variant = "no-data",
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  const config = variantConfig[variant]
  const Icon = config.icon
  const s = sizeClasses[size]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        s.wrapper,
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-2xl",
          config.toneClass,
          s.icon,
        )}
      >
        {icon ?? <Icon className="h-1/2 w-1/2" />}
      </div>
      <h3 className={cn("mt-4 font-semibold text-foreground", s.title)}>{title}</h3>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-md text-muted-foreground",
            s.description,
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
      {secondaryAction && <div className="mt-2">{secondaryAction}</div>}
    </div>
  )
}
