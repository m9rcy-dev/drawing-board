// ─── Canvas ───────────────────────────────────────────────────────────────────

export const CANVAS_BACKGROUND_COLOR = "#FAF9F6";
export const CANVAS_DOT_COLOR = "rgba(180, 176, 200, 0.45)";
export const CANVAS_DOT_SIZE = 1.5;
export const CANVAS_GRID_SIZE = 24;

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 20;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1;

// ─── Drawing Defaults ─────────────────────────────────────────────────────────

export const DEFAULT_STROKE_COLOR = "#1e1e2e";
export const DEFAULT_FILL_COLOR = "transparent";
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_STROKE_STYLE = "solid" as const;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BORDER_RADIUS = 8;
export const DEFAULT_FONT_SIZE = 18;
export const DEFAULT_FONT_FAMILY = "DM Sans, sans-serif";

// ─── Color Presets ────────────────────────────────────────────────────────────

export const STROKE_COLORS = [
  { label: "Black", value: "#1e1e2e" },
  { label: "Dark", value: "#495057" },
  { label: "Red", value: "#c92a2a" },
  { label: "Green", value: "#2b8a3e" },
  { label: "Blue", value: "#1864ab" },
  { label: "Orange", value: "#e67700" },
] as const;

export const FILL_COLORS = [
  { label: "Transparent", value: "transparent" },
  { label: "Light red", value: "#ffc9c9" },
  { label: "Light green", value: "#b2f2bb" },
  { label: "Light blue", value: "#a5d8ff" },
  { label: "Light yellow", value: "#ffec99" },
  { label: "White", value: "#ffffff" },
] as const;

export const STROKE_WIDTHS = [
  { label: "Thin", value: 1 },
  { label: "Normal", value: 2.5 },
  { label: "Bold", value: 5 },
] as const;

// ─── Element Constraints ──────────────────────────────────────────────────────

export const MIN_ELEMENT_SIZE = 4;
export const SELECTION_HANDLE_SIZE = 8;
export const SELECTION_PADDING = 6;
export const ARROW_SNAP_THRESHOLD = 28;

// ─── History ──────────────────────────────────────────────────────────────────

export const MAX_HISTORY_STEPS = 100;

// ─── Touch ────────────────────────────────────────────────────────────────────

export const MIN_TOUCH_TARGET = 44;

// ─── Arrow ────────────────────────────────────────────────────────────────────

export const ARROW_HEAD_SIZE = 14;
export const ARROW_HEAD_ANGLE = Math.PI / 6;

// ─── Export ───────────────────────────────────────────────────────────────────

export const EXPORT_PADDING = 24;
export const EXPORT_SCALE = 2;

// ─── Stroke style dashes ──────────────────────────────────────────────────────

export const STROKE_DASH: Record<string, number[]> = {
  solid: [],
  dashed: [12, 6],
  dotted: [2, 8],
};

// ─── Sloppiness ───────────────────────────────────────────────────────────────

export const DEFAULT_SLOPPINESS = 0 as const;

// ─── Arrow handles ────────────────────────────────────────────────────────────

export const ARROW_ENDPOINT_HANDLE_RADIUS = 8;
export const ARROW_BEND_HANDLE_RADIUS = 6;
