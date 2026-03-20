import type { WhiteboardElement, Point, FreehandElement, LineElement, ArrowElement, DiamondElement } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_HIT_THRESHOLD = 10;
const RECT_HIT_PADDING = 4;

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

const isPointInRect = (
  p: Point,
  x: number, y: number, w: number, h: number, pad = 0
): boolean =>
  p.x >= x - pad && p.x <= x + w + pad &&
  p.y >= y - pad && p.y <= y + h + pad;

const distToSegment = (
  p: Point, x1: number, y1: number, x2: number, y2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - x1, p.y - y1);
  const t = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / len2));
  return Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
};

// ─── Per-type Hit Tests ───────────────────────────────────────────────────────

const hitTestLine = (el: LineElement | ArrowElement, p: Point): boolean =>
  distToSegment(p, el.x, el.y, el.x2, el.y2) <= LINE_HIT_THRESHOLD;

const hitTestFreehand = (el: FreehandElement, p: Point): boolean => {
  const pts = el.points;
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(p, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= LINE_HIT_THRESHOLD) {
      return true;
    }
  }
  return false;
};

const hitTestDiamond = (el: DiamondElement, p: Point): boolean => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = el.width / 2 + RECT_HIT_PADDING;
  const hh = el.height / 2 + RECT_HIT_PADDING;
  if (hw === 0 || hh === 0) return false;
  return Math.abs(p.x - cx) / hw + Math.abs(p.y - cy) / hh <= 1;
};

// ─── Main Entry ───────────────────────────────────────────────────────────────

export const hitTest = (el: WhiteboardElement, p: Point): boolean => {
  switch (el.type) {
    case "rectangle":
    case "ellipse":
    case "text":
      return isPointInRect(p, el.x, el.y, el.width, el.height, RECT_HIT_PADDING);
    case "diamond":
      return hitTestDiamond(el, p);
    case "line":
    case "arrow":
      return hitTestLine(el, p);
    case "freehand":
      return hitTestFreehand(el, p);
  }
};

// ─── Find top-most hit element ────────────────────────────────────────────────

export const findHitElement = (
  elements: WhiteboardElement[],
  point: Point
): WhiteboardElement | null => {
  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTest(elements[i], point)) return elements[i];
  }
  return null;
};
