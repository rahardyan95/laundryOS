import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot(): boolean {
  return false
}

export function useIsMobile(): boolean {
  // Snapshot server false: HTML SSR/prerender dan render pertama klien
  // identik — anti hydration mismatch di viewport seluler.
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
