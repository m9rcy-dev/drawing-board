"use client";

import { useRef, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useCanvas, type TextEditState } from "@/hooks/useCanvas";
import { Renderer } from "@/core/renderer/Renderer";

// ─── Text Edit Overlay ────────────────────────────────────────────────────────
// Safari notes:
//   • `autoFocus` handles focus cross-browser (avoids async useEffect timing issues).
//   • setSelectionRange is deferred via useEffect (cursor at end — safe in all browsers).
//   • Outside-click uses `pointerdown` (not mousedown) — works on Safari/iOS.
//   • 100ms delay before registering the outside listener avoids catching the
//     pointer-up sequence of the same tap/click that created the textarea.

const TextOverlay = ({
  edit, zoom, panOffset, onCommit, onCancel,
}: {
  edit: TextEditState;
  zoom: number;
  panOffset: { x: number; y: number };
  onCommit: (text: string) => void;
  onCancel: () => void;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Position cursor at end after mount (works alongside autoFocus)
  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, []);

  // Outside-click detection: delayed so the creating tap/click is not caught.
  // Uses pointerdown (works on Safari/iOS) instead of mousedown.
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCommit(ref.current.value);
      }
    };
    const id = setTimeout(() => {
      document.addEventListener("pointerdown", handler, { capture: true });
    }, 100);
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler, { capture: true });
    };
  }, [onCommit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") { onCancel(); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommit(ref.current?.value ?? ""); }
  };

  const handleInput = () => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  };

  const screenX = edit.x * zoom + panOffset.x;
  const screenY = edit.y * zoom + panOffset.y;

  return (
    <textarea
      ref={ref}
      // autoFocus works synchronously in Safari — no async useEffect needed for focus
      autoFocus
      defaultValue={edit.initialContent ?? ""}
      rows={1}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        fontSize: edit.fontSize * zoom,
        fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
        color: edit.color,
        minWidth: 120,
        // When re-editing a resized text element, constrain to the element's width
        ...(edit.width ? { width: edit.width * zoom, maxWidth: edit.width * zoom } : {}),
        lineHeight: 1.4,
        background: "rgba(255,255,255,0.85)",
        border: "2px solid #8B5CF6",
        borderRadius: 4,
        padding: "2px 6px",
        outline: "none",
        resize: "none",
        overflow: "hidden",
        zIndex: 30,
        boxShadow: "0 2px 12px rgba(139,92,246,0.2)",
      }}
    />
  );
};

// ─── Canvas Component ─────────────────────────────────────────────────────────

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  const { elements, zoom, panOffset, activeTool } = useCanvasStore();
  const {
    activeDrawing, marqueeRect, textEdit,
    isPanning, resizeCursor,
    commitText, cancelText, handlers,
  } = useCanvas(canvasRef);

  // ── Init renderer ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) rendererRef.current = new Renderer(ctx);
  }, []);

  // ── DPR-aware resize ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.scale(dpr, dpr); rendererRef.current = new Renderer(ctx); }
    });

    observer.observe(canvas.parentElement ?? canvas);
    return () => observer.disconnect();
  }, []);

  // ── Render loop ──────────────────────────────────────────────────────────
  const renderFrame = useCallback(() => {
    rendererRef.current?.render(elements, activeDrawing, { zoom, panOffset, marqueeRect });
  }, [elements, activeDrawing, zoom, panOffset, marqueeRect]);

  useEffect(() => {
    const id = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(id);
  }, [renderFrame]);

  // ── Cursor ───────────────────────────────────────────────────────────────
  // resizeCursor is set during an active resize drag.
  // Hover cursor (idle select) is set directly on the DOM in handlePointerMove.
  const TOOL_CURSORS: Record<string, string> = {
    select: "default", pan: "grab", text: "text",
  };
  const cursor = textEdit
    ? "text"
    : resizeCursor          // active resize drag
    ?? (isPanning ? "grabbing" : (TOOL_CURSORS[activeTool] ?? "crosshair"));

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        data-testid="whiteboard-canvas"
        className="absolute inset-0 w-full h-full touch-none select-none"
        style={{ cursor }}
        {...handlers}
      />

      {textEdit && (
        <TextOverlay
          edit={textEdit}
          zoom={zoom}
          panOffset={panOffset}
          onCommit={commitText}
          onCancel={cancelText}
        />
      )}
    </div>
  );
};
