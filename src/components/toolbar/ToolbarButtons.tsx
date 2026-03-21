"use client";

import {
  MousePointer2,
  Hand,
  Square,
  Diamond,
  Circle,
  Minus,
  MoveRight,
  Pencil,
  Type,
  Undo2,
  Redo2,
  Trash2,
} from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { ToolButton } from "./ToolButton";
import type { ToolType } from "@/types";

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const DRAW_TOOLS: {
  type: ToolType;
  icon: typeof Square;
  label: string;
  key: string;
}[] = [
  { type: "pan",       icon: Hand,          label: "Hand (Pan)",  key: "H"  },
  { type: "select",    icon: MousePointer2, label: "Select",      key: "1"  },
  { type: "rectangle", icon: Square,        label: "Rectangle",   key: "2"  },
  { type: "diamond",   icon: Diamond,       label: "Diamond",     key: "3"  },
  { type: "ellipse",   icon: Circle,        label: "Ellipse",     key: "4"  },
  { type: "arrow",     icon: MoveRight,     label: "Arrow",       key: "5"  },
  { type: "line",      icon: Minus,         label: "Line",        key: "6"  },
  { type: "freehand",  icon: Pencil,        label: "Freehand",    key: "7"  },
  { type: "text",      icon: Type,          label: "Text",        key: "8"  },
];

// ─── Divider ──────────────────────────────────────────────────────────────────

interface DividerProps {
  orientation: "horizontal" | "vertical";
}

const Divider = ({ orientation }: DividerProps) =>
  orientation === "horizontal" ? (
    <div className="w-full h-px bg-atelier-border my-1" />
  ) : (
    <div className="h-full w-px bg-atelier-border mx-1 self-stretch" />
  );

// ─── Component ────────────────────────────────────────────────────────────────

interface ToolbarButtonsProps {
  orientation: "vertical" | "horizontal";
}

export const ToolbarButtons = ({ orientation }: ToolbarButtonsProps) => {
  const { activeTool, setTool, undo, redo, clearCanvas } = useCanvasStore();

  const isVertical = orientation === "vertical";
  const dividerOrientation = isVertical ? "horizontal" : "vertical";

  return (
    <>
      {DRAW_TOOLS.map((tool) => (
        <ToolButton
          key={tool.type}
          icon={tool.icon}
          label={tool.label}
          shortcut={isVertical ? tool.key : undefined}
          isActive={activeTool === tool.type}
          onClick={() => setTool(tool.type)}
        />
      ))}

      <Divider orientation={dividerOrientation} />

      <ToolButton
        icon={Undo2}
        label="Undo"
        shortcut={isVertical ? "⌘Z" : undefined}
        onClick={undo}
        variant="action"
      />
      <ToolButton
        icon={Redo2}
        label="Redo"
        shortcut={isVertical ? "⌘R" : undefined}
        onClick={redo}
        variant="action"
      />

      <Divider orientation={dividerOrientation} />

      <ToolButton
        icon={Trash2}
        label="Clear canvas"
        onClick={clearCanvas}
        variant="action"
        danger
      />
    </>
  );
};
