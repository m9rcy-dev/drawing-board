import type { WhiteboardElement, Point } from "@/types";
import { SELECTION_PADDING, MIN_ELEMENT_SIZE } from "@/utils/constants";
import type { FreehandElement } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResizeHandle = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se";

// ─── Handle Layout ───────────────────────────────────────────────────────────
// [fractionX, fractionY, handle] — fractions are relative to the selection box

export const ALL_HANDLES: [number, number, ResizeHandle][] = [
  [0, 0, "nw"],   [0.5, 0, "n"],   [1, 0, "ne"],
  [0, 0.5, "w"],                   [1, 0.5, "e"],
  [0, 1, "sw"],   [0.5, 1, "s"],   [1, 1, "se"],
];

export const RESIZE_CURSORS: Record<ResizeHandle, string> = {
  nw: "nwse-resize", n: "ns-resize",  ne: "nesw-resize",
  w:  "ew-resize",                     e:  "ew-resize",
  sw: "nesw-resize", s: "ns-resize",  se: "nwse-resize",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HANDLE_HIT_RADIUS = 10;

export const getResizeBox = (el: WhiteboardElement) => {
  const p = SELECTION_PADDING;
  return { x: el.x - p, y: el.y - p, w: el.width + p * 2, h: el.height + p * 2 };
};

// ─── Hit Detection ────────────────────────────────────────────────────────────

export const findResizeHandle = (el: WhiteboardElement, point: Point): ResizeHandle | null => {
  // Lines and arrows have their own handles
  if (el.type === "line" || el.type === "arrow") return null;
  const { x, y, w, h } = getResizeBox(el);
  for (const [fx, fy, handle] of ALL_HANDLES) {
    if (Math.hypot(point.x - (x + w * fx), point.y - (y + h * fy)) <= HANDLE_HIT_RADIUS) {
      return handle;
    }
  }
  return null;
};

// ─── Resize Math ──────────────────────────────────────────────────────────────
// Computes new bounds from a start element and total drag delta.
// Using total-from-start (not incremental) avoids stale-closure drift.

export const applyResize = (
  el: WhiteboardElement,
  handle: ResizeHandle,
  totalDx: number, totalDy: number
): { x: number; y: number; width: number; height: number } => {
  let { x, y, width, height } = el;

  if (handle.includes("e")) width  = Math.max(MIN_ELEMENT_SIZE, el.width + totalDx);
  if (handle.includes("s")) height = Math.max(MIN_ELEMENT_SIZE, el.height + totalDy);
  if (handle.includes("w")) {
    const newW = Math.max(MIN_ELEMENT_SIZE, el.width - totalDx);
    x = el.x + (el.width - newW);
    width = newW;
  }
  if (handle.includes("n")) {
    const newH = Math.max(MIN_ELEMENT_SIZE, el.height - totalDy);
    y = el.y + (el.height - newH);
    height = newH;
  }

  return { x, y, width, height };
};

// ─── Freehand Scale ───────────────────────────────────────────────────────────

export const applyFreehandResize = (
  el: FreehandElement,
  newBounds: { x: number; y: number; width: number; height: number }
): Partial<FreehandElement> => {
  const scaleX = el.width  > 0 ? newBounds.width  / el.width  : 1;
  const scaleY = el.height > 0 ? newBounds.height / el.height : 1;
  return {
    ...newBounds,
    points: el.points.map((p) => ({
      x: newBounds.x + (p.x - el.x) * scaleX,
      y: newBounds.y + (p.y - el.y) * scaleY,
    })),
  };
};
