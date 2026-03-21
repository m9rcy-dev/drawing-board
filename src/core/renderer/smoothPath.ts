import type { Point } from "@/types";

/**
 * Catmull-Rom spline smoothing for freehand paths.
 *
 * Converts a polyline of raw pointer samples into a smooth curve by computing
 * cubic bezier control points from each group of 4 consecutive Catmull-Rom
 * points. The result renders with `ctx.bezierCurveTo` — no extra points are
 * generated, so performance is O(n) in the number of input samples.
 *
 * @param tension  0 = loose (more curvature), 1 = tight (closer to polyline).
 *                 0.5 is the classic Catmull-Rom default.
 */

const TENSION = 0.5;

/** Convert a Catmull-Rom span to cubic Bezier control points. */
const catmullToBezier = (
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  tension: number
): [Point, Point] => {
  const t = tension;
  const cp1: Point = {
    x: p1.x + (p2.x - p0.x) / (6 * t),
    y: p1.y + (p2.y - p0.y) / (6 * t),
  };
  const cp2: Point = {
    x: p2.x - (p3.x - p1.x) / (6 * t),
    y: p2.y - (p3.y - p1.y) / (6 * t),
  };
  return [cp1, cp2];
};

/**
 * Stroke a smooth Catmull-Rom spline through `points` on the given context.
 * The path is begun but not closed — caller must call `ctx.stroke()` after.
 *
 * Requires at least 2 points; falls back to a straight lineTo for 2 points.
 */
export const strokeSmoothPath = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension = TENSION
): void => {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  // Duplicate first and last points so the curve passes through the endpoints.
  const pts = [points[0], ...points, points[points.length - 1]];

  for (let i = 1; i < pts.length - 2; i++) {
    const [cp1, cp2] = catmullToBezier(pts[i - 1], pts[i], pts[i + 1], pts[i + 2], tension);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pts[i + 1].x, pts[i + 1].y);
  }
};

/**
 * Thin a polyline by removing points that are closer than `minDist` px apart.
 * Keeps the first and last points. Used to reduce redundant samples before
 * smoothing so the spline evaluates fewer spans at full zoom.
 */
export const thinPoints = (points: Point[], minDist = 4): Point[] => {
  if (points.length <= 2) return points;
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const dx = points[i].x - prev.x;
    const dy = points[i].y - prev.y;
    if (dx * dx + dy * dy >= minDist * minDist) result.push(points[i]);
  }
  result.push(points[points.length - 1]);
  return result;
};
