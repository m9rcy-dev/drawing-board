import { create } from "zustand";
import type { WhiteboardElement, Point, ToolType, StrokeStyle, Sloppiness, ElementStyleUpdate } from "@/types";
import type { CanvasStore, HistoryEntry } from "./types";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STROKE_STYLE,
  DEFAULT_SLOPPINESS,
  DEFAULT_OPACITY,
  MAX_HISTORY_STEPS,
  ZOOM_DEFAULT,
} from "@/utils/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clampHistory = (entries: HistoryEntry[]): HistoryEntry[] =>
  entries.slice(-MAX_HISTORY_STEPS);

const snapshot = (elements: WhiteboardElement[]): HistoryEntry => ({
  elements: JSON.parse(JSON.stringify(elements)) as WhiteboardElement[],
  timestamp: Date.now(),
});

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
  elements: [],
  selectedIds: [],
  activeTool: "select" as ToolType,
  zoom: ZOOM_DEFAULT,
  panOffset: { x: 0, y: 0 } as Point,
  history: { past: [], future: [] },
  activeColor: DEFAULT_STROKE_COLOR,
  activeFillColor: DEFAULT_FILL_COLOR,
  activeStrokeWidth: DEFAULT_STROKE_WIDTH,
  activeStrokeStyle: DEFAULT_STROKE_STYLE as StrokeStyle,
  activeSloppiness: DEFAULT_SLOPPINESS as Sloppiness,
  activeOpacity: DEFAULT_OPACITY,

  addElement: (element) => {
    const { elements, history } = get();
    set({
      elements: [...elements, element],
      history: {
        past: clampHistory([...history.past, snapshot(elements)]),
        future: [],
      },
    });
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? ({ ...el, ...updates } as WhiteboardElement) : el
      ),
    }));
  },

  updateSelectedElements: (update: ElementStyleUpdate) => {
    const { selectedIds } = get();
    set((state) => ({
      elements: state.elements.map((el) =>
        selectedIds.includes(el.id)
          ? ({ ...el, ...update } as WhiteboardElement)
          : el
      ),
    }));
  },

  deleteElements: (ids) => {
    const { elements, history } = get();
    set({
      elements: elements.filter((el) => !ids.includes(el.id)),
      selectedIds: [],
      history: {
        past: clampHistory([...history.past, snapshot(elements)]),
        future: [],
      },
    });
  },

  selectElements: (ids) => {
    set((state) => ({
      selectedIds: ids,
      elements: state.elements.map((el) => ({
        ...el,
        isSelected: ids.includes(el.id),
      })),
    }));
  },

  clearSelection: () => {
    set((state) => ({
      selectedIds: [],
      elements: state.elements.map((el) => ({ ...el, isSelected: false })),
    }));
  },

  setTool: (tool) => set({ activeTool: tool }),

  undo: () => {
    const { history, elements } = get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    set({
      elements: previous.elements,
      selectedIds: [],
      history: {
        past: history.past.slice(0, -1),
        future: [snapshot(elements), ...history.future],
      },
    });
  },

  redo: () => {
    const { history, elements } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    set({
      elements: next.elements,
      selectedIds: [],
      history: {
        past: [...history.past, snapshot(elements)],
        future: history.future.slice(1),
      },
    });
  },

  setZoom: (zoom) => set({ zoom }),
  setPanOffset: (panOffset) => set({ panOffset }),
  setActiveColor: (color) => set({ activeColor: color }),
  setActiveFillColor: (color) => set({ activeFillColor: color }),
  setActiveStrokeWidth: (width) => set({ activeStrokeWidth: width }),
  setActiveStrokeStyle: (style) => set({ activeStrokeStyle: style }),
  setActiveSloppiness: (sloppiness) => set({ activeSloppiness: sloppiness }),
  setActiveOpacity: (opacity) => set({ activeOpacity: opacity }),

  clearCanvas: () => {
    const { elements, history } = get();
    set({
      elements: [],
      selectedIds: [],
      history: {
        past: clampHistory([...history.past, snapshot(elements)]),
        future: [],
      },
    });
  },
}));
