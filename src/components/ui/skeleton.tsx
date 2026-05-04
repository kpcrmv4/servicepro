import * as React from "react"
import { cn } from "@/lib/utils"

type SkeletonShape = "block" | "text" | "circle"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual shape — block (rectangle), text (1em rounded line), circle (1:1 round) */
  shape?: SkeletonShape
}

const shapeClass: Record<SkeletonShape, string> = {
  block: "rounded-md",
  text: "h-4 w-full rounded",
  circle: "aspect-square rounded-full",
}

/**
 * Loading placeholder. Pulse animation ใช้ `animate-pulse` ของ Tailwind.
 */
function Skeleton({
  className,
  shape = "block",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse bg-muted", shapeClass[shape], className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
