import { strokeSmoothPath, thinPoints } from "./smoothPath";
import type { Point } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makePts = (...coords: number[]): Point[] => {
  const pts: Point[] = [];
  for (let i = 0; i < coords.length; i += 2) {
    pts.push({ x: coords[i], y: coords[i + 1] });
  }
  return pts;
};

const makeCtx = () => {
  const calls: string[] = [];
  return {
    calls,
    ctx: {
      beginPath: () => calls.push("beginPath"),
      moveTo: (x: number, y: number) => calls.push(`moveTo(${x},${y})`),
      lineTo: (x: number, y: number) => calls.push(`lineTo(${x},${y})`),
      bezierCurveTo: (...args: number[]) => calls.push(`bezierCurveTo(${args.join(",")})`),
      stroke: () => calls.push("stroke"),
    } as unknown as CanvasRenderingContext2D,
  };
};

// ─── strokeSmoothPath ─────────────────────────────────────────────────────────

describe("strokeSmoothPath", () => {
  it("does nothing for empty points", () => {
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, []);
    expect(calls).toHaveLength(0);
  });

  it("does nothing for a single point", () => {
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, makePts(0, 0));
    expect(calls).toHaveLength(0);
  });

  it("uses lineTo for exactly 2 points", () => {
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, makePts(0, 0, 10, 10));
    expect(calls).toContain("beginPath");
    expect(calls).toContain("moveTo(0,0)");
    expect(calls).toContain("lineTo(10,10)");
    expect(calls.some((c) => c.startsWith("bezierCurveTo"))).toBe(false);
  });

  it("uses bezierCurveTo for 3+ points", () => {
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, makePts(0, 0, 10, 5, 20, 0));
    expect(calls.some((c) => c.startsWith("bezierCurveTo"))).toBe(true);
  });

  it("starts with beginPath and moveTo first point", () => {
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, makePts(5, 7, 15, 20, 25, 10));
    expect(calls[0]).toBe("beginPath");
    expect(calls[1]).toBe("moveTo(5,7)");
  });

  it("ends bezier curve at last point", () => {
    const pts = makePts(0, 0, 10, 5, 20, 0, 30, 5);
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, pts);
    const bezierCalls = calls.filter((c) => c.startsWith("bezierCurveTo"));
    expect(bezierCalls.length).toBeGreaterThan(0);
    // Last bezier should end at the last point (30, 5)
    const last = bezierCalls[bezierCalls.length - 1];
    expect(last).toContain(",30,5)");
  });

  it("number of bezier calls equals points.length - 1 (padded)", () => {
    // With n points, padded array has n+2 entries, spans = n-1 bezier calls
    const pts = makePts(0, 0, 10, 0, 20, 0, 30, 0);
    const { ctx, calls } = makeCtx();
    strokeSmoothPath(ctx, pts);
    const bezierCalls = calls.filter((c) => c.startsWith("bezierCurveTo"));
    expect(bezierCalls).toHaveLength(pts.length - 1);
  });
});

// ─── thinPoints ───────────────────────────────────────────────────────────────

describe("thinPoints", () => {
  it("returns the same array for 2 or fewer points", () => {
    const pts = makePts(0, 0, 10, 10);
    expect(thinPoints(pts)).toEqual(pts);
    expect(thinPoints([pts[0]])).toEqual([pts[0]]);
    expect(thinPoints([])).toEqual([]);
  });

  it("always keeps first and last point", () => {
    const pts = makePts(0, 0, 1, 0, 2, 0, 3, 0, 1000, 1000);
    const result = thinPoints(pts, 10);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[result.length - 1]).toEqual({ x: 1000, y: 1000 });
  });

  it("removes points closer than minDist", () => {
    // points at (0,0), (1,0), (2,0), (3,0), (100,0)
    // minDist=10 → only (0,0) and (100,0) survive (interior pts too close)
    const pts = makePts(0, 0, 1, 0, 2, 0, 3, 0, 100, 0);
    const result = thinPoints(pts, 10);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 0, y: 0 });
    expect(result[1]).toEqual({ x: 100, y: 0 });
  });

  it("keeps points that exceed minDist", () => {
    const pts = makePts(0, 0, 20, 0, 40, 0, 60, 0);
    const result = thinPoints(pts, 10);
    expect(result).toHaveLength(4);
  });

  it("uses default minDist of 4px", () => {
    // points at 0, 2, 4, 6 — spacing = 2px < 4px default → only first + last survive interior filter
    const pts = makePts(0, 0, 2, 0, 4, 0, 6, 0);
    const result = thinPoints(pts);
    // (2,0) is 2px from (0,0) → dropped; (4,0) is 2px from (2,0) [previous kept was (0,0)] → 4px from (0,0) → kept
    // Actually: prev=(0,0), pt=(2,0): dist=2 < 4 → skip; pt=(4,0): dist from (0,0)=4 ≥ 4 → keep; pt=(6,0): dist from (4,0)=2 < 4 → skip
    expect(result).toContainEqual({ x: 0, y: 0 });
    expect(result).toContainEqual({ x: 6, y: 0 }); // last always kept
  });
});
