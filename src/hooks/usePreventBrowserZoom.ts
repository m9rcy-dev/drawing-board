"use client";

import { useEffect } from "react";

/**
 * Prevents browser-level zoom from affecting the page UI.
 *
 * Two zoom vectors are blocked:
 *   1. Ctrl+scroll / Cmd+scroll (desktop): intercepted via a non-passive document
 *      wheel listener. The listener must be { passive: false } because browsers
 *      ignore preventDefault() on passive listeners.
 *   2. Pinch-to-zoom (mobile/trackpad): blocked at the meta-viewport level via
 *      the `viewport` export in layout.tsx (maximum-scale=1, user-scalable=no).
 *
 * Canvas zoom is handled separately in useCanvas.ts via the onWheel handler
 * attached directly to the <canvas> element.
 */
export const usePreventBrowserZoom = (): void => {
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    // { passive: false } is required — without it, preventDefault() is a no-op
    // because Chrome/Safari mark wheel events passive by default since ~2017.
    document.addEventListener("wheel", handler, { passive: false });
    return () => document.removeEventListener("wheel", handler);
  }, []);
};
