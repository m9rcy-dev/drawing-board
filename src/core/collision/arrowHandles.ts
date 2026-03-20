import type { ArrowElement, Point } from "@/types";
import { ARROW_ENDPOINT_HANDLE_RADIUS, ARROW_BEND_HANDLE_RADIUS } from "@/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArrowHandleType = "start" | "end" | "bend";

export interface ArrowHandle {
  type: ArrowHandleType;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getArrowMidPoint = (el: ArrowElement): Point => ({
  x: el.midPoint?.x ?? (el.x + el.x2) / 2,
  y: el.midPoint?.y ?? (el.y + el.y2) / 2,
});

// ─── Hit Detection ────────────────────────────────────────────────────────────

export const findArrowHandle = (
  el: ArrowElement,
  point: Point
): ArrowHandle | null => {
  const hitRadius = ARROW_ENDPOINT_HANDLE_RADIUS + 4;

  if (Math.hypot(point.x - el.x, point.y - el.y) <= hitRadius) {
    return { type: "start" };
  }
  if (Math.hypot(point.x - el.x2, point.y - el.y2) <= hitRadius) {
    return { type: "end" };
  }

  const mid = getArrowMidPoint(el);
  if (Math.hypot(point.x - mid.x, point.y - mid.y) <= ARROW_BEND_HANDLE_RADIUS + 4) {
    return { type: "bend" };
  }

  return null;
};
