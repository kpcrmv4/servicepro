import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "h-3.5 w-3.5",
      md: "h-5 w-5",
      lg: "h-8 w-8",
    },
    tone: {
      primary: "text-primary",
      muted: "text-muted-foreground",
      foreground: "text-foreground",
      current: "text-current",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "current",
  },
})

interface SpinnerProps
  extends Omit<React.SVGAttributes<SVGElement>, "color">,
    VariantProps<typeof spinnerVariants> {
  /** Accessible label for screen readers — defaults to "Loading" */
  label?: string
}

export function Spinner({
  className,
  size,
  tone,
  label = "กำลังโหลด",
  ...props
}: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" aria-label={label} className="inline-flex">
      <Loader2 className={cn(spinnerVariants({ size, tone }), className)} {...props} />
    </span>
  )
}

export { spinnerVariants }
