// ─── Primitives ───────────────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Tool Types ───────────────────────────────────────────────────────────────

export type ToolType =
  | "select"
  | "pan"
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "freehand"
  | "text";

// ─── Element Types ────────────────────────────────────────────────────────────

export type ElementType =
  | "rectangle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "freehand"
  | "text";

export type StrokeStyle = "solid" | "dashed" | "dotted";
export type Sloppiness = 0 | 1 | 2;

// ─── Base Element ─────────────────────────────────────────────────────────────

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  sloppiness: Sloppiness;
  opacity: number;
  isSelected: boolean;
  createdAt: number;
  label?: string;
}

// ─── Concrete Element Types ───────────────────────────────────────────────────

export interface RectangleElement extends BaseElement {
  type: "rectangle";
  borderRadius: number;
}

export interface DiamondElement extends BaseElement {
  type: "diamond";
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
}

export interface ArrowBinding {
  elementId: string;
}

export interface LineElement extends BaseElement {
  type: "line";
  x2: number;
  y2: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  x2: number;
  y2: number;
  midPoint: Point | null;
  startBinding: ArrowBinding | null;
  endBinding: ArrowBinding | null;
}

export interface FreehandElement extends BaseElement {
  type: "freehand";
  points: Point[];
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
}

// ─── Union Type ───────────────────────────────────────────────────────────────

export type WhiteboardElement =
  | RectangleElement
  | DiamondElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | FreehandElement
  | TextElement;

// ─── Style Update (for properties panel) ─────────────────────────────────────

export interface ElementStyleUpdate {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  sloppiness?: Sloppiness;
  opacity?: number;
}

// ─── Error Handling ───────────────────────────────────────────────────────────

export interface AppError {
  code: string;
  message: string;
  details: Record<string, unknown>;
}
