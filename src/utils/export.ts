import type { WhiteboardElement } from "@/types";
import { Renderer } from "@/core/renderer/Renderer";
import { EXPORT_PADDING, EXPORT_SCALE } from "./constants";

// ─── Bounding Box ─────────────────────────────────────────────────────────────

const getElementBounds = (el: WhiteboardElement) => {
  if (el.type === "line" || el.type === "arrow") {
    return {
      x: Math.min(el.x, el.x2),
      y: Math.min(el.y, el.y2),
      right: Math.max(el.x, el.x2),
      bottom: Math.max(el.y, el.y2),
    };
  }
  return { x: el.x, y: el.y, right: el.x + el.width, bottom: el.y + el.height };
};

const getSceneBounds = (elements: WhiteboardElement[]) => {
  if (elements.length === 0) return { x: 0, y: 0, width: 800, height: 600 };

  const bounds = elements.map(getElementBounds);
  const x = Math.min(...bounds.map((b) => b.x)) - EXPORT_PADDING;
  const y = Math.min(...bounds.map((b) => b.y)) - EXPORT_PADDING;
  const right = Math.max(...bounds.map((b) => b.right)) + EXPORT_PADDING;
  const bottom = Math.max(...bounds.map((b) => b.bottom)) + EXPORT_PADDING;

  return { x, y, width: right - x, height: bottom - y };
};

// ─── PNG Export ───────────────────────────────────────────────────────────────

export const exportAsPNG = (elements: WhiteboardElement[]): void => {
  const bounds = getSceneBounds(elements);
  const scale = EXPORT_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width * scale;
  canvas.height = bounds.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  const renderer = new Renderer(ctx);
  renderer.render(elements, null, { zoom: 1, panOffset: { x: -bounds.x, y: -bounds.y }, exportMode: true });

  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `drawboard-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ─── Copy to Clipboard ────────────────────────────────────────────────────────

export const copyToClipboard = async (
  elements: WhiteboardElement[]
): Promise<boolean> => {
  const bounds = getSceneBounds(elements);
  const scale = EXPORT_SCALE;

  const canvas = document.createElement("canvas");
  canvas.width = bounds.width * scale;
  canvas.height = bounds.height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.scale(scale, scale);

  const renderer = new Renderer(ctx);
  renderer.render(elements, null, {
    zoom: 1,
    panOffset: { x: -bounds.x, y: -bounds.y },
    exportMode: true,
  });

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(false); return; }
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        resolve(true);
      } catch {
        resolve(false);
      }
    }, "image/png");
  });
};
