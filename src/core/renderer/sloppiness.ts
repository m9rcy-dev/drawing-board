// ─── Seeded RNG ───────────────────────────────────────────────────────────────
// Deterministic per element so the "sketch" look is stable across re-renders.

export const seededRng = (seed: string): () => number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return (): number => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};

// ─── Sloppy Segment ───────────────────────────────────────────────────────────

export const drawSloppySegment = (
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  rng: () => number,
  level: 1 | 2
): void => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = -dy / len;
  const ny = dx / len;
  const amp = Math.min(len * 0.05 * level, 8 * level);
  const j = (): number => (rng() - 0.5) * 2 * amp;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(
    x1 + dx * 0.3 + nx * j(), y1 + dy * 0.3 + ny * j(),
    x1 + dx * 0.7 + nx * j(), y1 + dy * 0.7 + ny * j(),
    x2, y2
  );
  ctx.stroke();

  if (level === 2) {
    const s = amp * 0.6;
    const j2 = (): number => (rng() - 0.5) * 2 * s;
    ctx.beginPath();
    ctx.moveTo(x1 + j2(), y1 + j2());
    ctx.bezierCurveTo(
      x1 + dx * 0.35 + nx * j2(), y1 + dy * 0.35 + ny * j2(),
      x1 + dx * 0.65 + nx * j2(), y1 + dy * 0.65 + ny * j2(),
      x2 + j2(), y2 + j2()
    );
    ctx.stroke();
  }
};

// ─── Sloppy Ellipse ───────────────────────────────────────────────────────────

export const drawSloppyEllipse = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  rng: () => number,
  level: 1 | 2
): void => {
  const passes = level === 2 ? 2 : 1;
  const kappa = 0.5523;

  for (let p = 0; p < passes; p++) {
    const amp = Math.min(rx, ry) * (level === 1 ? 0.04 : 0.07);
    const j = (): number => (rng() - 0.5) * 2 * amp;

    ctx.beginPath();
    ctx.moveTo(cx + rx + j(), cy + j());
    ctx.bezierCurveTo(
      cx + rx + j(), cy - ry * kappa + j(),
      cx + rx * kappa + j(), cy - ry + j(),
      cx + j(), cy - ry + j()
    );
    ctx.bezierCurveTo(
      cx - rx * kappa + j(), cy - ry + j(),
      cx - rx + j(), cy - ry * kappa + j(),
      cx - rx + j(), cy + j()
    );
    ctx.bezierCurveTo(
      cx - rx + j(), cy + ry * kappa + j(),
      cx - rx * kappa + j(), cy + ry + j(),
      cx + j(), cy + ry + j()
    );
    ctx.bezierCurveTo(
      cx + rx * kappa + j(), cy + ry + j(),
      cx + rx + j(), cy + ry * kappa + j(),
      cx + rx + j(), cy + j()
    );
    ctx.closePath();
    ctx.stroke();
  }
};
