"use client"

import * as React from "react"

/**
 * Subscribe to a CSS media query.
 *
 * SSR-safe — returns `false` until mounted, so callers should treat the
 * initial render as "no match" (mobile-first by default).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return

    const mql = window.matchMedia(query)
    const update = () => setMatches(mql.matches)

    update()
    mql.addEventListener("change", update)
    return () => mql.removeEventListener("change", update)
  }, [query])

  return matches
}

/** Convenience: matches when viewport ≥ 640px (Tailwind `sm`) */
export function useIsTabletUp(): boolean {
  return useMediaQuery("(min-width: 640px)")
}

/** Convenience: matches when viewport ≥ 1024px (Tailwind `lg`) */
export function useIsDesktopUp(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
