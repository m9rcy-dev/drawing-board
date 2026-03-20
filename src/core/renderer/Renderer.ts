import type { WhiteboardElement, Point, BoundingBox } from "@/types";
import { drawElement } from "./drawElement";
import {
  CANVAS_BACKGROUND_COLOR,
  CANVAS_DOT_COLOR,
  CANVAS_DOT_SIZE,
  CANVAS_GRID_SIZE,
} from "@/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RenderOptions {
  zoom: number;
  panOffset: Point;
  exportMode?: boolean;
  marqueeRect?: BoundingBox | null;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(
    elements: WhiteboardElement[],
    activeElement: WhiteboardElement | null,
    opts: RenderOptions
  ): void {
    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.drawBackground(width, height, opts);
    this.drawScene(elements, activeElement, opts);
  }

  private drawBackground(w: number, h: number, opts: RenderOptions): void {
    this.ctx.fillStyle = CANVAS_BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, w, h);
    if (!opts.exportMode) this.drawDotGrid(w, h, opts);
  }

  private drawDotGrid(w: number, h: number, opts: RenderOptions): void {
    const { zoom, panOffset } = opts;
    const gridSize = CANVAS_GRID_SIZE * zoom;
    const offsetX = ((panOffset.x % gridSize) + gridSize) % gridSize;
    const offsetY = ((panOffset.y % gridSize) + gridSize) % gridSize;

    this.ctx.fillStyle = CANVAS_DOT_COLOR;
    for (let x = offsetX; x < w; x += gridSize) {
      for (let y = offsetY; y < h; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, CANVAS_DOT_SIZE * Math.min(zoom, 1.5), 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawScene(
    elements: WhiteboardElement[],
    activeElement: WhiteboardElement | null,
    opts: RenderOptions
  ): void {
    this.ctx.save();
    this.ctx.translate(opts.panOffset.x, opts.panOffset.y);
    this.ctx.scale(opts.zoom, opts.zoom);

    for (const el of elements) drawElement(this.ctx, el);
    if (activeElement) drawElement(this.ctx, activeElement);

    if (opts.marqueeRect) this.drawMarquee(opts.marqueeRect);

    this.ctx.restore();
  }

  private drawMarquee(rect: BoundingBox): void {
    this.ctx.save();
    this.ctx.strokeStyle = "#06B6D4";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 4]);
    this.ctx.fillStyle = "rgba(6,182,212,0.06)";
    this.ctx.beginPath();
    this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.restore();
  }
}
