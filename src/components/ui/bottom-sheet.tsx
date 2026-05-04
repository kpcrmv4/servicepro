"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  type PanInfo,
} from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Context
// =============================================================================

interface BottomSheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const BottomSheetContext = React.createContext<BottomSheetContextValue>({
  open: false,
  setOpen: () => {},
})

interface BottomSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function BottomSheet({
  open: controlledOpen,
  onOpenChange,
  children,
}: BottomSheetProps) {
  const [uncontrolled, setUncontrolled] = React.useState(false)
  const open = controlledOpen ?? uncontrolled
  const setOpen = onOpenChange ?? setUncontrolled

  return (
    <BottomSheetContext.Provider value={{ open, setOpen }}>
      {children}
    </BottomSheetContext.Provider>
  )
}

// =============================================================================
// Trigger
// =============================================================================

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const BottomSheetTrigger = React.forwardRef<
  HTMLButtonElement,
  TriggerProps
>(function BottomSheetTrigger({ children, ...props }, ref) {
  const { setOpen } = React.useContext(BottomSheetContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
})

// =============================================================================
// Content
// =============================================================================

interface ContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Snap heights as percent of viewport (0-100). Defaults to [60, 90]. */
  snapPoints?: number[]
  /** Hide the drag handle */
  hideHandle?: boolean
  /** Hide the close (X) button in the corner */
  hideClose?: boolean
}

const Portal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

export function BottomSheetContent({
  children,
  className,
  snapPoints = [60, 90],
  hideHandle,
  hideClose,
  ...props
}: ContentProps) {
  const { open, setOpen } = React.useContext(BottomSheetContext)
  const dragControls = useDragControls()
  const y = useMotionValue(0)

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Esc to close
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  const initialHeight = Math.min(...snapPoints)
  const maxHeight = Math.max(...snapPoints)

  function handleDragEnd(_: unknown, info: PanInfo) {
    // Dismiss when dragged down past 25% of viewport or with strong velocity
    const dismissThreshold = window.innerHeight * 0.25
    if (info.offset.y > dismissThreshold || info.velocity.y > 600) {
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-border bg-card text-foreground shadow-[var(--shadow-raised)]",
              className,
            )}
            style={{ y, height: `${maxHeight}vh`, maxHeight: `${maxHeight}vh` }}
            initial={{ y: "100%" }}
            animate={{ y: `${100 - initialHeight}%` }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
            {...(props as React.ComponentProps<typeof motion.div>)}
          >
            {/* Drag handle (only this area triggers drag) */}
            {!hideHandle && (
              <button
                type="button"
                onPointerDown={(e) => dragControls.start(e)}
                className="flex w-full cursor-grab touch-none justify-center pb-2 pt-3 active:cursor-grabbing"
                aria-label="ลากเพื่อปิด"
              >
                <span className="block h-1.5 w-12 rounded-full bg-muted-foreground/40" />
              </button>
            )}

            {/* Close X */}
            {!hideClose && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="ปิด"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable content area */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),1rem)]"
            >
              {children}
            </div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// Header / Title / Description
// =============================================================================

export function BottomSheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 pb-3 pt-1 pr-10", className)}
      {...props}
    />
  )
}

export function BottomSheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-base font-semibold text-foreground", className)}
      {...props}
    />
  )
}

export function BottomSheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export function BottomSheetClose({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(BottomSheetContext)
  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  )
}
