"use client"

import * as React from "react"
import { WifiOff, CloudOff, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Connectivity + sync queue indicator.
 *
 * Shows a pill above the bottom-nav whenever:
 *   - the browser is offline, OR
 *   - there are queued mutations waiting to sync.
 *
 * The queue count is read from `localStorage["sync-queue-count"]` —
 * Phase 6 will replace this stub with a real IndexedDB-backed queue.
 */
export function SyncStatus() {
  const [online, setOnline] = React.useState(true)
  const [queued, setQueued] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === "undefined") return
    setOnline(navigator.onLine)

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onStorage = () => {
      const raw = localStorage.getItem("sync-queue-count")
      setQueued(raw ? Math.max(0, parseInt(raw, 10) || 0) : 0)
    }

    onStorage()
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    window.addEventListener("storage", onStorage)
    const interval = setInterval(onStorage, 5000)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("storage", onStorage)
      clearInterval(interval)
    }
  }, [])

  const visible = !online || queued > 0
  const variant: "offline" | "syncing" = !online ? "offline" : "syncing"

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            // Sit above the floating bottom nav on mobile, bottom-right on desktop
            "pointer-events-auto fixed left-1/2 z-30 -translate-x-1/2",
            "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-4 sm:left-auto sm:right-4 sm:translate-x-0",
          )}
          role="status"
          aria-live="polite"
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-raised)] backdrop-blur-md",
              variant === "offline"
                ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            {variant === "offline" ? (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                ออฟไลน์
                {queued > 0 && (
                  <>
                    <span className="opacity-50">·</span>
                    <CloudOff className="h-3.5 w-3.5" />
                    <span>{queued} รายการรอซิงก์</span>
                  </>
                )}
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>กำลังซิงก์ {queued} รายการ</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
