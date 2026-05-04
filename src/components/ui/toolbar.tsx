import * as React from "react"
import { cn } from "@/lib/utils"

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Sticky to top of scroll container */
  sticky?: boolean
}

function ToolbarRoot({ className, sticky, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:px-4",
        sticky && "sticky top-0 z-10",
        className,
      )}
      {...props}
    />
  )
}

function ToolbarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-1.5", className)} {...props} />
}

function ToolbarSpacer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1", className)} {...props} />
}

function ToolbarSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn("h-6 w-px bg-border", className)}
      {...props}
    />
  )
}

/**
 * Toolbar — horizontal action bar above tables/lists.
 * Slots: search input, filter chips, sort, bulk actions.
 *
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Group>
 *     <SearchInput ... />
 *     <FilterPopover ... />
 *   </Toolbar.Group>
 *   <Toolbar.Spacer />
 *   <Toolbar.Group>
 *     <SortDropdown ... />
 *     <ColumnVisibility ... />
 *   </Toolbar.Group>
 * </Toolbar>
 * ```
 */
export const Toolbar = Object.assign(ToolbarRoot, {
  Group: ToolbarGroup,
  Spacer: ToolbarSpacer,
  Separator: ToolbarSeparator,
})
