import * as React from "react"
import { cn } from "@/lib/utils"

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual size — defaults to xs (inline help text) */
  size?: "xs" | "sm"
}

/**
 * Keyboard hint pill — used for `⌘K`, `Esc`, `↵` indicators.
 * Auto-resolves OS modifier glyph (⌘ on macOS, Ctrl elsewhere) when label is "mod".
 */
export function Kbd({ className, size = "xs", children, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex select-none items-center justify-center rounded border border-border bg-muted font-mono font-medium text-muted-foreground",
        size === "xs"
          ? "h-5 min-w-[1.25rem] px-1 text-[10px]"
          : "h-6 min-w-[1.5rem] px-1.5 text-xs",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

/**
 * Returns the platform-appropriate modifier glyph + label.
 * macOS → ⌘ "Cmd"; everything else → ^ "Ctrl"
 */
export function useKeyboardModifier(): { glyph: string; label: string } {
  const [isMac, setIsMac] = React.useState(false)
  React.useEffect(() => {
    if (typeof navigator === "undefined") return
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])
  return isMac ? { glyph: "⌘", label: "Cmd" } : { glyph: "Ctrl", label: "Ctrl" }
}
