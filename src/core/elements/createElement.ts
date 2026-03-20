import type {
  ElementType,
  WhiteboardElement,
  RectangleElement,
  DiamondElement,
  EllipseElement,
  LineElement,
  ArrowElement,
  FreehandElement,
  TextElement,
  StrokeStyle,
  Sloppiness,
} from "@/types";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STROKE_STYLE,
  DEFAULT_SLOPPINESS,
  DEFAULT_OPACITY,
  DEFAULT_BORDER_RADIUS,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
} from "@/utils/constants";

// ─── Options ──────────────────────────────────────────────────────────────────

interface CreateElementOptions {
  x: number;
  y: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  sloppiness?: Sloppiness;
  opacity?: number;
}

// ─── ID ───────────────────────────────────────────────────────────────────────

const generateId = (): string =>
  `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ─── Base ─────────────────────────────────────────────────────────────────────

const base = (type: ElementType, opts: CreateElementOptions) => ({
  id: generateId(),
  type,
  x: opts.x,
  y: opts.y,
  width: 0,
  height: 0,
  angle: 0,
  strokeColor: opts.strokeColor ?? DEFAULT_STROKE_COLOR,
  fillColor: opts.fillColor ?? DEFAULT_FILL_COLOR,
  strokeWidth: opts.strokeWidth ?? DEFAULT_STROKE_WIDTH,
  strokeStyle: (opts.strokeStyle ?? DEFAULT_STROKE_STYLE) as StrokeStyle,
  sloppiness: (opts.sloppiness ?? DEFAULT_SLOPPINESS) as Sloppiness,
  opacity: opts.opacity ?? DEFAULT_OPACITY,
  isSelected: false,
  createdAt: Date.now(),
});

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createElement = (
  type: ElementType,
  opts: CreateElementOptions
): WhiteboardElement => {
  const b = base(type, opts);

  switch (type) {
    case "rectangle":
      return { ...b, type: "rectangle", borderRadius: DEFAULT_BORDER_RADIUS } as RectangleElement;

    case "diamond":
      return { ...b, type: "diamond" } as DiamondElement;

    case "ellipse":
      return { ...b, type: "ellipse" } as EllipseElement;

    case "line":
      return { ...b, type: "line", x2: opts.x, y2: opts.y } as LineElement;

    case "arrow":
      return {
        ...b, type: "arrow", x2: opts.x, y2: opts.y,
        midPoint: null, startBinding: null, endBinding: null,
      } as ArrowElement;

    case "freehand":
      return { ...b, type: "freehand", points: [{ x: opts.x, y: opts.y }] } as FreehandElement;

    case "text":
      return {
        ...b, type: "text", content: "", width: 120, height: DEFAULT_FONT_SIZE * 1.4,
        fontSize: DEFAULT_FONT_SIZE, fontFamily: DEFAULT_FONT_FAMILY,
      } as TextElement;

    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown element type: ${_exhaustive}`);
    }
  }
};
