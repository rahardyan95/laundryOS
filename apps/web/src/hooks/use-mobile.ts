import * as React from "react";
import { MobileViewport } from "@/lib/mobile-viewport";

export function useIsMobile(): boolean {
  // Snapshot server false: HTML SSR/prerender dan render pertama klien
  // identik — anti hydration mismatch di viewport seluler.
  return React.useSyncExternalStore(
    MobileViewport.subscribe,
    MobileViewport.snapshot,
    MobileViewport.serverSnapshot
  );
}
