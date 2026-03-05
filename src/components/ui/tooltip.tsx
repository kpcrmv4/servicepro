"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
}

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  delayDuration: number
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  delayDuration: 300,
})

const TooltipProviderContext = React.createContext<{ delayDuration: number }>({
  delayDuration: 300,
})

function TooltipProvider({ children, delayDuration = 300 }: TooltipProviderProps) {
  return (
    <TooltipProviderContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipProviderContext.Provider>
  )
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const { delayDuration } = React.useContext(TooltipProviderContext)

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
      <div className="relative inline-flex">{children}</div>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  children,
  className,
  asChild,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const { setOpen, delayDuration } = React.useContext(TooltipContext)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration)
  }, [setOpen, delayDuration])

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(false)
  }, [setOpen])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className={cn(className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  )
}

function TooltipContent({
  children,
  className,
  side = "top",
  sideOffset = 4,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "bottom" | "left" | "right"
  sideOffset?: number
}) {
  const { open } = React.useContext(TooltipContext)

  if (!open) return null

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      role="tooltip"
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        positionClasses[side],
        className
      )}
      style={{ marginTop: side === "bottom" ? sideOffset : undefined, marginBottom: side === "top" ? sideOffset : undefined }}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
