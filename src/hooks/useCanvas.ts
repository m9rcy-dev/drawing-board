"use client";

import {
  useState, useRef, useCallback, useEffect,
  type RefObject, type PointerEvent,
} from "react";
import type {
  WhiteboardElement, Point, FreehandElement, ArrowElement,
  BoundingBox, ElementType, TextElement,
} from "@/types";
import { useCanvasStore } from "@/store/canvasStore";
import { createElement } from "@/core/elements/createElement";
import { findHitElement } from "@/core/collision/hitTest";
import { findArrowHandle, getArrowMidPoint } from "@/core/collision/arrowHandles";
import {
  findResizeHandle, applyResize, applyFreehandResize,
  RESIZE_CURSORS, type ResizeHandle,
} from "@/core/collision/resizeHandles";
import { MIN_ELEMENT_SIZE } from "@/utils/constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const ARROW_SNAP_BOX_PAD = 8; // px — snap when endpoint enters shape bounding box

// ─── Interaction Mode ─────────────────────────────────────────────────────────

type Mode =
  | { type: "idle" }
  | { type: "drawing"; startPoint: Point; element: WhiteboardElement }
  | { type: "panning"; startClient: Point; startPanOffset: Point }
  | { type: "moving"; lastPoint: Point }
  | { type: "marquee"; startPoint: Point; currentPoint: Point }
  | { type: "bending"; arrowId: string }
  | { type: "resizing-arrow"; arrowId: string; handle: "start" | "end" }
  | { type: "resizing"; elementId: string; handle: ResizeHandle; startPoint: Point; startEl: WhiteboardElement };

// ─── Text Edit State ──────────────────────────────────────────────────────────

export interface TextEditState {
  elementId: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  width?: number;
  initialContent?: string;
}

export interface UseCanvasReturn {
  activeDrawing: WhiteboardElement | null;
  marqueeRect: BoundingBox | null;
  textEdit: TextEditState | null;
  isPanning: boolean;
  resizeCursor: string | null;
  commitText: (text: string) => void;
  cancelText: () => void;
  handlers: {
    onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
    onDoubleClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  };
}

// ─── Coordinate Conversion ────────────────────────────────────────────────────

export const clientToWorld = (
  clientX: number, clientY: number,
  canvas: HTMLCanvasElement, zoom: number, pan: Point
): Point => {
  const r = canvas.getBoundingClientRect();
  return { x: (clientX - r.left - pan.x) / zoom, y: (clientY - r.top - pan.y) / zoom };
};

const toWorld = (e: PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement, zoom: number, pan: Point): Point =>
  clientToWorld(e.clientX, e.clientY, canvas, zoom, pan);

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

const normalizeRect = (a: Point, b: Point): BoundingBox => ({
  x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y),
});

const getElementBounds = (el: WhiteboardElement): BoundingBox => {
  if (el.type === "line" || el.type === "arrow") {
    return {
      x: Math.min(el.x, el.x2), y: Math.min(el.y, el.y2),
      width: Math.abs(el.x2 - el.x), height: Math.abs(el.y2 - el.y),
    };
  }
  return { x: el.x, y: el.y, width: el.width, height: el.height };
};

const rectsIntersect = (a: BoundingBox, b: BoundingBox): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x &&
  a.y < b.y + b.height && a.y + a.height > b.y;

// ─── Arrow Border Snap ────────────────────────────────────────────────────────
// Computes the exact border intersection point of a shape from a given direction.
// fromX/fromY is the "other end" of the arrow — the border point is on the line
// from the shape center toward (fromX, fromY).

const shapeBorderPoint = (el: WhiteboardElement, fromX: number, fromY: number): Point => {
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const hw = Math.max(1, Math.abs(el.width / 2));
  const hh = Math.max(1, Math.abs(el.height / 2));
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (Math.hypot(dx, dy) < 0.001) return { x: cx + hw, y: cy };

  let t: number;
  if (el.type === "ellipse") {
    t = 1 / Math.sqrt((dx * dx) / (hw * hw) + (dy * dy) / (hh * hh));
  } else if (el.type === "diamond") {
    t = 1 / (Math.abs(dx) / hw + Math.abs(dy) / hh);
  } else {
    // Rectangle (AABB): find smallest t so the ray hits a side
    const tx = Math.abs(dx) > 0.001 ? hw / Math.abs(dx) : Infinity;
    const ty = Math.abs(dy) > 0.001 ? hh / Math.abs(dy) : Infinity;
    t = Math.min(tx, ty);
  }
  return { x: cx + dx * t, y: cy + dy * t };
};

// Snaps when endpoint is inside the shape bounding box (+ small pad).
// Returns the border point on the shape facing toward (fromX, fromY).
const findSnapPoint = (
  point: Point, elements: WhiteboardElement[], excludeId: string,
  fromX?: number, fromY?: number,
): { snapPoint: Point; elementId: string } | null => {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (el.id === excludeId || el.type === "arrow" || el.type === "line" || el.type === "freehand" || el.type === "text") continue;
    const inBox =
      point.x >= el.x - ARROW_SNAP_BOX_PAD && point.x <= el.x + el.width + ARROW_SNAP_BOX_PAD &&
      point.y >= el.y - ARROW_SNAP_BOX_PAD && point.y <= el.y + el.height + ARROW_SNAP_BOX_PAD;
    if (inBox) {
      const fx = fromX ?? point.x;
      const fy = fromY ?? point.y;
      return { snapPoint: shapeBorderPoint(el, fx, fy), elementId: el.id };
    }
  }
  return null;
};

// ─── Element Updaters ─────────────────────────────────────────────────────────

const updateDrawingElement = (
  state: { startPoint: Point; element: WhiteboardElement },
  current: Point,
  elements: WhiteboardElement[]
): WhiteboardElement => {
  const { startPoint, element } = state;

  if (element.type === "freehand") {
    const fe = element as FreehandElement;
    return { ...fe, points: [...fe.points, current] };
  }
  if (element.type === "line") {
    return { ...element, x2: current.x, y2: current.y };
  }
  if (element.type === "arrow") {
    // Pass arrow start as "from" so end snaps to shape border facing the start
    const snap = findSnapPoint(current, elements, element.id, element.x, element.y);
    return {
      ...element,
      x2: snap?.snapPoint.x ?? current.x,
      y2: snap?.snapPoint.y ?? current.y,
      endBinding: snap ? { elementId: snap.elementId } : null,
    } as ArrowElement;
  }
  return {
    ...element,
    x: Math.min(startPoint.x, current.x), y: Math.min(startPoint.y, current.y),
    width: Math.abs(current.x - startPoint.x), height: Math.abs(current.y - startPoint.y),
  };
};

const computeFreehandBounds = (el: FreehandElement): FreehandElement => {
  if (el.points.length === 0) return el;
  const xs = el.points.map((p) => p.x);
  const ys = el.points.map((p) => p.y);
  return { ...el, x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};

const isMeaningful = (el: WhiteboardElement): boolean => {
  if (el.type === "freehand") return (el as FreehandElement).points.length > 2;
  if (el.type === "line" || el.type === "arrow") return Math.hypot(el.x2 - el.x, el.y2 - el.y) > MIN_ELEMENT_SIZE;
  return el.width > MIN_ELEMENT_SIZE || el.height > MIN_ELEMENT_SIZE;
};

const getTranslation = (el: WhiteboardElement, dx: number, dy: number): Partial<WhiteboardElement> => {
  if (el.type === "arrow") {
    const arrow = el as ArrowElement;
    const midPoint = arrow.midPoint ? { x: arrow.midPoint.x + dx, y: arrow.midPoint.y + dy } : null;
    return { x: el.x + dx, y: el.y + dy, x2: el.x2 + dx, y2: el.y2 + dy, midPoint } as Partial<WhiteboardElement>;
  }
  if (el.type === "line") return { x: el.x + dx, y: el.y + dy, x2: el.x2 + dx, y2: el.y2 + dy } as Partial<WhiteboardElement>;
  if (el.type === "freehand") {
    const fe = el as FreehandElement;
    return { x: fe.x + dx, y: fe.y + dy, points: fe.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } as Partial<WhiteboardElement>;
  }
  return { x: el.x + dx, y: el.y + dy };
};

const isDrawingTool = (tool: string): tool is Exclude<ElementType, "text"> =>
  ["rectangle", "diamond", "ellipse", "line", "arrow", "freehand"].includes(tool);

// ─── Bound Arrow Update ───────────────────────────────────────────────────────

const moveBoundArrows = (
  freshEls: WhiteboardElement[],
  selectedIds: string[],
  dx: number, dy: number,
  updateElement: (id: string, u: Partial<WhiteboardElement>) => void
): void => {
  for (const el of freshEls) {
    if (el.type !== "arrow" || selectedIds.includes(el.id)) continue;
    const arrow = el as ArrowElement;
    let changes: Partial<ArrowElement> = {};

    if (arrow.startBinding && selectedIds.includes(arrow.startBinding.elementId)) {
      const shape = freshEls.find((s) => s.id === arrow.startBinding!.elementId);
      if (shape) {
        const moved = { ...shape, x: shape.x + dx, y: shape.y + dy };
        const pt = shapeBorderPoint(moved, arrow.x2, arrow.y2);
        changes = { ...changes, x: pt.x, y: pt.y };
      }
    }
    if (arrow.endBinding && selectedIds.includes(arrow.endBinding.elementId)) {
      const shape = freshEls.find((s) => s.id === arrow.endBinding!.elementId);
      if (shape) {
        const moved = { ...shape, x: shape.x + dx, y: shape.y + dy };
        const pt = shapeBorderPoint(moved, arrow.x, arrow.y);
        changes = { ...changes, x2: pt.x, y2: pt.y };
      }
    }
    if (Object.keys(changes).length > 0) updateElement(arrow.id, changes as Partial<WhiteboardElement>);
  }
};

// ─── Hover Cursor ─────────────────────────────────────────────────────────────

const getHoverCursor = (
  elements: WhiteboardElement[], selectedIds: string[], point: Point
): string | null => {
  for (const id of selectedIds) {
    const el = elements.find((e) => e.id === id);
    if (!el) continue;
    const h = findResizeHandle(el, point);
    if (h) return RESIZE_CURSORS[h];
    if (el.type === "arrow") {
      const ah = el.type === "arrow" ? findArrowHandle(el as ArrowElement, point) : null;
      if (ah) return "crosshair";
    }
  }
  return null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCanvas = (canvasRef: RefObject<HTMLCanvasElement>): UseCanvasReturn => {
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
  const spaceDown = useRef(false);

  const store = useCanvasStore();
  const {
    activeTool, zoom, panOffset,
    addElement, updateElement, deleteElements,
    selectElements, clearSelection, setZoom, setPanOffset,
    activeColor, activeFillColor, activeStrokeWidth, activeStrokeStyle, activeSloppiness, activeOpacity,
  } = store;

  // ── Space = temporary pan ─────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) { e.preventDefault(); spaceDown.current = true; }
    };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceDown.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ── Text commit / cancel ──────────────────────────────────────────────────

  const commitText = useCallback((text: string) => {
    if (!textEdit) return;
    if (text.trim() === "") {
      deleteElements([textEdit.elementId]);
    } else {
      // Preserve existing width when re-editing a resized text element
      const existingWidth = textEdit.width ?? 0;
      const autoWidth = Math.max(60, text.length * (textEdit.fontSize * 0.6));
      updateElement(textEdit.elementId, {
        content: text,
        width: existingWidth > 60 ? existingWidth : autoWidth,
        height: textEdit.fontSize * 1.4,
      } as Partial<WhiteboardElement>);
    }
    setTextEdit(null);
  }, [textEdit, updateElement, deleteElements]);

  const cancelText = useCallback(() => {
    if (textEdit && !textEdit.initialContent) deleteElements([textEdit.elementId]);
    setTextEdit(null);
  }, [textEdit, deleteElements]);

  // ── Double click — re-edit text ───────────────────────────────────────────

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || activeTool !== "select") return;
    const { elements } = useCanvasStore.getState();
    const point = clientToWorld(e.clientX, e.clientY, canvasRef.current, zoom, panOffset);
    const hit = findHitElement(elements, point);
    if (!hit || hit.type !== "text") return;
    const textEl = hit as TextElement;
    setTextEdit({
      elementId: textEl.id, x: textEl.x, y: textEl.y,
      fontSize: textEl.fontSize, color: textEl.strokeColor,
      width: textEl.width > 60 ? textEl.width : undefined,
      initialContent: textEl.content,
    });
  }, [activeTool, canvasRef, zoom, panOffset]);

  // ── Arrow handle check ─────────────────────────────────────────────────────

  const checkArrowHandles = useCallback((point: Point): boolean => {
    const { elements, selectedIds } = useCanvasStore.getState();
    for (const id of selectedIds) {
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== "arrow") continue;
      const handle = findArrowHandle(el as ArrowElement, point);
      if (!handle) continue;
      if (handle.type === "bend") { setMode({ type: "bending", arrowId: el.id }); return true; }
      if (handle.type === "start" || handle.type === "end") {
        setMode({ type: "resizing-arrow", arrowId: el.id, handle: handle.type }); return true;
      }
    }
    return false;
  }, []);

  // ── Pointer Down ─────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (textEdit) return;

    const isPan = activeTool === "pan" || e.button === 1 || spaceDown.current;
    if (isPan) {
      setMode({ type: "panning", startClient: { x: e.clientX, y: e.clientY }, startPanOffset: { ...panOffset } });
      return;
    }

    const { elements, selectedIds } = useCanvasStore.getState();
    const point = toWorld(e, canvasRef.current, zoom, panOffset);

    if (activeTool === "select") {
      // Priority 1: arrow handles (bend / endpoint resize)
      if (checkArrowHandles(point)) return;

      // Priority 2: resize handles on selected shapes
      for (const id of selectedIds) {
        const el = elements.find((f) => f.id === id);
        if (!el) continue;
        const handle = findResizeHandle(el, point);
        if (handle) {
          setMode({ type: "resizing", elementId: id, handle, startPoint: point, startEl: el });
          return;
        }
      }

      // Priority 3: hit test for select / move
      const hit = findHitElement(elements, point);
      const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;

      if (hit) {
        if (isMulti) {
          const next = selectedIds.includes(hit.id)
            ? selectedIds.filter((id) => id !== hit.id)
            : [...selectedIds, hit.id];
          selectElements(next);
          setMode({ type: "idle" });
        } else {
          if (!selectedIds.includes(hit.id)) selectElements([hit.id]);
          setMode({ type: "moving", lastPoint: point });
        }
      } else {
        if (!isMulti) clearSelection();
        setMode({ type: "marquee", startPoint: point, currentPoint: point });
      }
      return;
    }

    if (activeTool === "text") {
      const el = createElement("text", {
        x: point.x, y: point.y,
        strokeColor: activeColor, strokeWidth: activeStrokeWidth, opacity: activeOpacity,
      }) as TextElement;
      addElement(el);
      setTextEdit({ elementId: el.id, x: el.x, y: el.y, fontSize: el.fontSize, color: el.strokeColor });
      return;
    }

    if (!isDrawingTool(activeTool)) return;

    let startPos = point;
    let startBinding = null;

    if (activeTool === "arrow") {
      // fromX/fromY = cursor position → border point on the side nearest to where user clicked
      const snap = findSnapPoint(point, elements, "", point.x, point.y);
      if (snap) { startPos = snap.snapPoint; startBinding = { elementId: snap.elementId }; }
    }

    const el = createElement(activeTool, {
      x: startPos.x, y: startPos.y,
      strokeColor: activeColor, fillColor: activeFillColor,
      strokeWidth: activeStrokeWidth, strokeStyle: activeStrokeStyle,
      sloppiness: activeSloppiness, opacity: activeOpacity,
    });

    if (startBinding && el.type === "arrow") (el as ArrowElement).startBinding = startBinding;
    setMode({ type: "drawing", startPoint: startPos, element: el });
  }, [
    canvasRef, activeTool, zoom, panOffset, textEdit,
    activeColor, activeFillColor, activeStrokeWidth, activeStrokeStyle, activeSloppiness, activeOpacity,
    addElement, selectElements, clearSelection, checkArrowHandles,
  ]);

  // ── Pointer Move ─────────────────────────────────────────────────────────

  const handlePointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Idle: update hover cursor for resize handles (no state update → direct DOM)
    if (mode.type === "idle") {
      if (activeTool === "select") {
        const point = toWorld(e, canvasRef.current, zoom, panOffset);
        const { elements, selectedIds } = useCanvasStore.getState();
        const cursor = getHoverCursor(elements, selectedIds, point) ?? "default";
        canvasRef.current.style.cursor = cursor;
      }
      return;
    }

    if (mode.type === "panning") {
      setPanOffset({
        x: mode.startPanOffset.x + (e.clientX - mode.startClient.x),
        y: mode.startPanOffset.y + (e.clientY - mode.startClient.y),
      });
      return;
    }

    const point = toWorld(e, canvasRef.current, zoom, panOffset);
    const { elements: freshEls, selectedIds: freshIds } = useCanvasStore.getState();

    if (mode.type === "marquee") { setMode({ ...mode, currentPoint: point }); return; }

    if (mode.type === "drawing") {
      setMode({ ...mode, element: updateDrawingElement(mode, point, freshEls) });
      return;
    }

    if (mode.type === "bending") {
      updateElement(mode.arrowId, { midPoint: point } as Partial<WhiteboardElement>);
      return;
    }

    if (mode.type === "resizing-arrow") {
      const arrow = freshEls.find((el) => el.id === mode.arrowId) as ArrowElement | undefined;
      if (!arrow) return;
      // fromX/fromY is the OTHER endpoint so border faces it correctly
      const fromX = mode.handle === "start" ? arrow.x2 : arrow.x;
      const fromY = mode.handle === "start" ? arrow.y2 : arrow.y;
      const snap = findSnapPoint(point, freshEls, arrow.id, fromX, fromY);
      const pos = snap?.snapPoint ?? point;
      const binding = snap ? { elementId: snap.elementId } : null;
      const upd = mode.handle === "start"
        ? { x: pos.x, y: pos.y, startBinding: binding }
        : { x2: pos.x, y2: pos.y, endBinding: binding };
      updateElement(arrow.id, upd as Partial<WhiteboardElement>);
      return;
    }

    if (mode.type === "resizing") {
      const totalDx = point.x - mode.startPoint.x;
      const totalDy = point.y - mode.startPoint.y;
      const newBounds = applyResize(mode.startEl, mode.handle, totalDx, totalDy);

      if (mode.startEl.type === "freehand") {
        const scaled = applyFreehandResize(mode.startEl as FreehandElement, newBounds);
        updateElement(mode.elementId, scaled as Partial<WhiteboardElement>);
      } else {
        updateElement(mode.elementId, newBounds as Partial<WhiteboardElement>);
      }
      return;
    }

    if (mode.type === "moving") {
      const dx = point.x - mode.lastPoint.x;
      const dy = point.y - mode.lastPoint.y;

      for (const el of freshEls) {
        if (freshIds.includes(el.id)) updateElement(el.id, getTranslation(el, dx, dy));
      }
      moveBoundArrows(freshEls, freshIds, dx, dy, updateElement);
      setMode({ ...mode, lastPoint: point });
    }
  }, [canvasRef, mode, activeTool, zoom, panOffset, setPanOffset, updateElement]);

  // ── Pointer Up ───────────────────────────────────────────────────────────

  const handlePointerUp = useCallback(() => {
    const { elements, selectedIds } = useCanvasStore.getState();

    if (mode.type === "drawing") {
      let el = mode.element;
      if (el.type === "freehand") el = computeFreehandBounds(el as FreehandElement);
      if (isMeaningful(el)) addElement(el);
    }

    if (mode.type === "marquee") {
      const sel = normalizeRect(mode.startPoint, mode.currentPoint);
      if (sel.width > 2 && sel.height > 2) {
        const hit = elements.filter((el) => rectsIntersect(getElementBounds(el), sel));
        if (hit.length > 0) selectElements(hit.map((el) => el.id));
      }
    }

    // Reset hover cursor when drag ends
    if (canvasRef.current && activeTool === "select") {
      canvasRef.current.style.cursor = selectedIds.length > 0 ? "default" : "default";
    }

    setMode({ type: "idle" });
  }, [mode, addElement, selectElements, canvasRef, activeTool]);

  const handlePointerLeave = useCallback(() => {
    if (mode.type === "drawing") {
      let el = mode.element;
      if (el.type === "freehand") el = computeFreehandBounds(el as FreehandElement);
      if (isMeaningful(el)) addElement(el);
    }
    setMode({ type: "idle" });
  }, [mode, addElement]);

  // ── Wheel (zoom) ─────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(20, Math.max(0.1, zoom * factor));
    if (!canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    setZoom(newZoom);
    setPanOffset({
      x: mx - (mx - panOffset.x) * (newZoom / zoom),
      y: my - (my - panOffset.y) * (newZoom / zoom),
    });
  }, [zoom, panOffset, setZoom, setPanOffset, canvasRef]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const marqueeRect = mode.type === "marquee"
    ? normalizeRect(mode.startPoint, mode.currentPoint)
    : null;

  const resizeCursor = mode.type === "resizing" ? RESIZE_CURSORS[mode.handle] : null;

  return {
    activeDrawing: mode.type === "drawing" ? mode.element : null,
    marqueeRect,
    textEdit,
    isPanning: mode.type === "panning",
    resizeCursor,
    commitText,
    cancelText,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
    },
  };
};
