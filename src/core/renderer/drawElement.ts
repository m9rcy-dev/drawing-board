import type {
  WhiteboardElement,
  RectangleElement,
  DiamondElement,
  EllipseElement,
  LineElement,
  ArrowElement,
  FreehandElement,
  TextElement,
  Sloppiness,
} from "@/types";
import {
  ARROW_HEAD_SIZE, ARROW_HEAD_ANGLE, STROKE_DASH,
  SELECTION_PADDING, ARROW_ENDPOINT_HANDLE_RADIUS, ARROW_BEND_HANDLE_RADIUS,
} from "@/utils/constants";
import { seededRng, drawSloppySegment, drawSloppyEllipse } from "./sloppiness";
import { getArrowMidPoint } from "@/core/collision/arrowHandles";
import { ALL_HANDLES, getResizeBox } from "@/core/collision/resizeHandles";

// ─── Context Setup ────────────────────────────────────────────────────────────

const applyStyles = (ctx: CanvasRenderingContext2D, el: WhiteboardElement): void => {
  ctx.globalAlpha = el.opacity;
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = el.fillColor === "transparent" ? "rgba(0,0,0,0)" : el.fillColor;
  ctx.setLineDash(STROKE_DASH[el.strokeStyle] ?? []);
  if (el.strokeStyle === "dotted") ctx.lineCap = "round";
};

// ─── Shape Drawers ────────────────────────────────────────────────────────────

const drawRectangle = (ctx: CanvasRenderingContext2D, el: RectangleElement, rng: () => number): void => {
  if (el.sloppiness === 0) {
    const r = Math.min(el.borderRadius, Math.abs(el.width) / 2, Math.abs(el.height) / 2);
    ctx.beginPath();
    ctx.roundRect(el.x, el.y, el.width, el.height, r);
    if (el.fillColor !== "transparent") ctx.fill();
    ctx.stroke();
    return;
  }
  if (el.fillColor !== "transparent") {
    ctx.beginPath(); ctx.rect(el.x, el.y, el.width, el.height); ctx.fill();
  }
  const { x, y, width: w, height: h, sloppiness: lvl } = el;
  drawSloppySegment(ctx, x, y, x + w, y, rng, lvl as 1 | 2);
  drawSloppySegment(ctx, x + w, y, x + w, y + h, rng, lvl as 1 | 2);
  drawSloppySegment(ctx, x + w, y + h, x, y + h, rng, lvl as 1 | 2);
  drawSloppySegment(ctx, x, y + h, x, y, rng, lvl as 1 | 2);
};

const drawDiamond = (ctx: CanvasRenderingContext2D, el: DiamondElement, rng: () => number): void => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const top = [cx, el.y] as const;
  const right = [el.x + el.width, cy] as const;
  const bottom = [cx, el.y + el.height] as const;
  const left = [el.x, cy] as const;

  if (el.sloppiness === 0) {
    ctx.beginPath();
    ctx.moveTo(...top); ctx.lineTo(...right); ctx.lineTo(...bottom); ctx.lineTo(...left);
    ctx.closePath();
    if (el.fillColor !== "transparent") ctx.fill();
    ctx.stroke();
    return;
  }
  if (el.fillColor !== "transparent") {
    ctx.beginPath();
    ctx.moveTo(...top); ctx.lineTo(...right); ctx.lineTo(...bottom); ctx.lineTo(...left);
    ctx.closePath(); ctx.fill();
  }
  const lvl = el.sloppiness as 1 | 2;
  drawSloppySegment(ctx, ...top, ...right, rng, lvl);
  drawSloppySegment(ctx, ...right, ...bottom, rng, lvl);
  drawSloppySegment(ctx, ...bottom, ...left, rng, lvl);
  drawSloppySegment(ctx, ...left, ...top, rng, lvl);
};

const drawEllipse = (ctx: CanvasRenderingContext2D, el: EllipseElement, rng: () => number): void => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const rx = Math.abs(el.width / 2);
  const ry = Math.abs(el.height / 2);

  if (el.sloppiness === 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    if (el.fillColor !== "transparent") ctx.fill();
    ctx.stroke();
    return;
  }
  if (el.fillColor !== "transparent") {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawSloppyEllipse(ctx, cx, cy, rx, ry, rng, el.sloppiness as 1 | 2);
};

const drawLine = (ctx: CanvasRenderingContext2D, el: LineElement, rng: () => number): void => {
  if (el.sloppiness === 0) {
    ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(el.x2, el.y2); ctx.stroke();
    return;
  }
  drawSloppySegment(ctx, el.x, el.y, el.x2, el.y2, rng, el.sloppiness as 1 | 2);
};

const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  fromX: number, fromY: number, toX: number, toY: number
): void => {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - ARROW_HEAD_SIZE * Math.cos(angle - ARROW_HEAD_ANGLE), toY - ARROW_HEAD_SIZE * Math.sin(angle - ARROW_HEAD_ANGLE));
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - ARROW_HEAD_SIZE * Math.cos(angle + ARROW_HEAD_ANGLE), toY - ARROW_HEAD_SIZE * Math.sin(angle + ARROW_HEAD_ANGLE));
  ctx.stroke();
  ctx.restore();
};

const drawArrow = (ctx: CanvasRenderingContext2D, el: ArrowElement, rng: () => number): void => {
  const { x, y, x2, y2, midPoint, sloppiness } = el;

  if (midPoint) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(midPoint.x, midPoint.y, x2, y2);
    ctx.stroke();
    drawArrowHead(ctx, midPoint.x, midPoint.y, x2, y2);
    return;
  }
  if (sloppiness > 0) {
    drawSloppySegment(ctx, x, y, x2, y2, rng, sloppiness as 1 | 2);
  } else {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
  }
  drawArrowHead(ctx, x, y, x2, y2);
};

const drawFreehand = (ctx: CanvasRenderingContext2D, el: FreehandElement): void => {
  if (el.points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(el.points[0].x, el.points[0].y);
  for (let i = 1; i < el.points.length; i++) {
    ctx.lineTo(el.points[i].x, el.points[i].y);
  }
  ctx.stroke();
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (ctx.measureText(paragraph).width <= maxWidth) { lines.push(paragraph); continue; }
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (ctx.measureText(trial).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
};

const drawText = (ctx: CanvasRenderingContext2D, el: TextElement): void => {
  if (!el.content) return;
  ctx.setLineDash([]);
  ctx.font = `${el.strokeWidth <= 1.5 ? "normal" : "bold"} ${el.fontSize}px ${el.fontFamily}`;
  ctx.fillStyle = el.strokeColor;
  ctx.globalAlpha = el.opacity;
  const lineHeight = el.fontSize * 1.4;
  const lines = el.width > 60 ? wrapText(ctx, el.content, el.width) : [el.content];
  lines.forEach((line, i) => ctx.fillText(line, el.x, el.y + el.fontSize + i * lineHeight));
};

// ─── Selection Overlays ───────────────────────────────────────────────────────

const drawLineSelection = (ctx: CanvasRenderingContext2D, el: LineElement): void => {
  const x = Math.min(el.x, el.x2);
  const y = Math.min(el.y, el.y2);
  const w = Math.abs(el.x2 - el.x);
  const h = Math.abs(el.y2 - el.y);
  const pad = SELECTION_PADDING;
  const zoom = ctx.getTransform().a || 1;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#8B5CF6";
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
  ctx.restore();
};

// Draws the dashed selection box + 8 resize handles for non-linear elements.
const drawSelectionBox = (ctx: CanvasRenderingContext2D, el: WhiteboardElement): void => {
  const { x, y, w, h } = getResizeBox(el);
  const zoom = ctx.getTransform().a || 1;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#8B5CF6";
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(x, y, w, h);

  ctx.setLineDash([]);
  for (const [fx, fy] of ALL_HANDLES) {
    const hx = x + w * fx;
    const hy = y + h * fy;
    ctx.beginPath(); ctx.arc(hx, hy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.strokeStyle = "#8B5CF6"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
};

const drawArrowHandles = (ctx: CanvasRenderingContext2D, el: ArrowElement): void => {
  const mid = getArrowMidPoint(el);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  for (const [hx, hy] of [[el.x, el.y], [el.x2, el.y2]] as [number, number][]) {
    ctx.beginPath(); ctx.arc(hx, hy, ARROW_ENDPOINT_HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.strokeStyle = "#8B5CF6"; ctx.lineWidth = 2; ctx.stroke();
  }

  ctx.beginPath(); ctx.arc(mid.x, mid.y, ARROW_BEND_HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#8B5CF6"; ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();
};

// ─── Main Entry ───────────────────────────────────────────────────────────────

export const drawElement = (ctx: CanvasRenderingContext2D, el: WhiteboardElement): void => {
  const rng = seededRng(el.id);
  ctx.save();
  applyStyles(ctx, el);

  switch (el.type) {
    case "rectangle": drawRectangle(ctx, el, rng); break;
    case "diamond":   drawDiamond(ctx, el, rng); break;
    case "ellipse":   drawEllipse(ctx, el, rng); break;
    case "line":      drawLine(ctx, el, rng); break;
    case "arrow":     drawArrow(ctx, el, rng); break;
    case "freehand":  drawFreehand(ctx, el); break;
    case "text":      drawText(ctx, el); break;
  }

  ctx.restore();

  if (el.isSelected) {
    if (el.type === "arrow") drawArrowHandles(ctx, el);
    else if (el.type === "line") drawLineSelection(ctx, el);
    else drawSelectionBox(ctx, el);
  }
};

// Re-export sloppiness type for use in property assertions
export type { Sloppiness };
