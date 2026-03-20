import { useEffect } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import type { ToolType } from "@/types";

// H = hand/pan, 1-8 = tools in toolbar order, no letter shortcuts
const TOOL_KEYS: Record<string, ToolType> = {
  h: "pan",
  "1": "select",
  "2": "rectangle",
  "3": "diamond",
  "4": "ellipse",
  "5": "arrow",
  "6": "line",
  "7": "freehand",
  "8": "text",
};

export const useKeyboardShortcuts = (): void => {
  const { undo, redo, setTool, deleteElements, selectElements, elements, selectedIds, clearCanvas } =
    useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && key === "r") { e.preventDefault(); redo(); return; }
      if (ctrl && key === "y") { e.preventDefault(); redo(); return; }

      if (ctrl && key === "a") {
        e.preventDefault();
        selectElements(elements.map((el) => el.id));
        setTool("select");
        return;
      }

      if (ctrl && e.shiftKey && (key === "delete" || key === "backspace")) {
        e.preventDefault();
        clearCanvas();
        return;
      }

      if ((key === "delete" || key === "backspace") && selectedIds.length > 0) {
        e.preventDefault();
        deleteElements(selectedIds);
        return;
      }

      if (key === "escape") {
        useCanvasStore.getState().clearSelection();
        return;
      }

      // Number shortcuts use e.key directly (no lowercasing — numbers aren't affected by case)
      // H uses lowercase match
      if (!ctrl) {
        const mapped = TOOL_KEYS[e.key] ?? TOOL_KEYS[key];
        if (mapped) setTool(mapped);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setTool, deleteElements, selectElements, elements, selectedIds, clearCanvas]);
};
