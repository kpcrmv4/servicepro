import * as React from "react"
import { cn } from "@/lib/utils"
import { Breadcrumb } from "@/components/layout/breadcrumb"

interface BreadcrumbItem {
  title: string
  href?: string
}

interface PageHeaderProps {
  /** Main page title */
  title: React.ReactNode
  /** Optional helper text under title */
  description?: React.ReactNode
  /** Primary action(s) — usually a Button or button group */
  action?: React.ReactNode
  /** Breadcrumb trail above title (overrides default `Dashboard / ...` chain) */
  breadcrumb?: BreadcrumbItem[]
  /** Tabs row rendered below title — pass a Tabs component */
  tabs?: React.ReactNode
  /** Stick header to top of scroll container with backdrop blur */
  sticky?: boolean
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
  tabs,
  sticky,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        sticky && "sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md",
        className,
      )}
    >
      <div className="px-3 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mb-2">
            <Breadcrumb items={breadcrumb} />
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      {tabs && (
        <div className="border-t border-border bg-card/50 px-3 sm:px-6">
          {tabs}
        </div>
      )}
    </div>
  )
}
