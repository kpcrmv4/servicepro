"use client"

import * as React from "react"

type ScrollDirection = "up" | "down" | null

interface Options {
  /** Threshold (px) before direction flips. Defaults to 8. */
  threshold?: number
  /** Disable detection — useful for desktop or when sticky doesn't apply */
  disabled?: boolean
}

/**
 * Detect vertical scroll direction with hysteresis.
 *
 * Returns `"up"` while scrolling up, `"down"` while scrolling down,
 * and `null` at the very top of the page (so callers can show the bar
 * at rest before any scroll has occurred).
 */
export function useScrollDirection({ threshold = 8, disabled = false }: Options = {}) {
  const [direction, setDirection] = React.useState<ScrollDirection>(null)

  React.useEffect(() => {
    if (disabled || typeof window === "undefined") return

    let lastY = window.scrollY
    let ticking = false

    function update() {
      const y = window.scrollY
      if (y < threshold) {
        setDirection(null)
        lastY = y
        ticking = false
        return
      }
      const delta = y - lastY
      if (Math.abs(delta) >= threshold) {
        setDirection(delta > 0 ? "down" : "up")
        lastY = y
      }
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold, disabled])

  return direction
}
