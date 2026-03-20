import type { Point, ToolType, WhiteboardElement, StrokeStyle, Sloppiness, ElementStyleUpdate } from "@/types";

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  elements: WhiteboardElement[];
  timestamp: number;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

// ─── Canvas State ─────────────────────────────────────────────────────────────

export interface CanvasState {
  elements: WhiteboardElement[];
  selectedIds: string[];
  activeTool: ToolType;
  zoom: number;
  panOffset: Point;
  history: HistoryState;
  activeColor: string;
  activeFillColor: string;
  activeStrokeWidth: number;
  activeStrokeStyle: StrokeStyle;
  activeSloppiness: Sloppiness;
  activeOpacity: number;
}

// ─── Canvas Actions ───────────────────────────────────────────────────────────

export interface CanvasActions {
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  updateSelectedElements: (update: ElementStyleUpdate) => void;
  deleteElements: (ids: string[]) => void;
  selectElements: (ids: string[]) => void;
  clearSelection: () => void;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Point) => void;
  setActiveColor: (color: string) => void;
  setActiveFillColor: (color: string) => void;
  setActiveStrokeWidth: (width: number) => void;
  setActiveStrokeStyle: (style: StrokeStyle) => void;
  setActiveSloppiness: (sloppiness: Sloppiness) => void;
  setActiveOpacity: (opacity: number) => void;
  clearCanvas: () => void;
}

export type CanvasStore = CanvasState & CanvasActions;
