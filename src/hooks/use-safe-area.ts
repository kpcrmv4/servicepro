"use client"

import * as React from "react"

interface SafeArea {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Read iOS/Android safe-area-inset-* values as pixels.
 *
 * Useful for floating UI (bottom nav, FAB) that must clear the iPhone
 * home-indicator gesture bar but doesn't want to hard-code 16px which
 * looks too tight on devices without an indicator.
 */
export function useSafeArea(): SafeArea {
  const [insets, setInsets] = React.useState<SafeArea>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return

    function read(): SafeArea {
      const probe = document.createElement("div")
      probe.style.cssText = `
        position: fixed; visibility: hidden; pointer-events: none;
        top: env(safe-area-inset-top);
        right: env(safe-area-inset-right);
        bottom: env(safe-area-inset-bottom);
        left: env(safe-area-inset-left);
      `
      document.body.appendChild(probe)
      const cs = window.getComputedStyle(probe)
      const out: SafeArea = {
        top: parseInt(cs.top, 10) || 0,
        right: parseInt(cs.right, 10) || 0,
        bottom: parseInt(cs.bottom, 10) || 0,
        left: parseInt(cs.left, 10) || 0,
      }
      probe.remove()
      return out
    }

    setInsets(read())

    function onResize() {
      setInsets(read())
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("orientationchange", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("orientationchange", onResize)
    }
  }, [])

  return insets
}
