"use client";

import { useState } from "react";
import {
  Hand, MousePointer2, Square, Diamond, Circle,
  MoveRight, Pencil, Minus, Type, Eraser, Undo2, Redo2,
} from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { MobilePropertiesPanel } from "@/components/properties/MobilePropertiesPanel";
import type { ToolType } from "@/types";

type ComboKey = "shapes" | "strokes";
type IconType = typeof Square;

const SHAPE_TOOLS: { type: ToolType; icon: IconType }[] = [
  { type: "rectangle", icon: Square },
  { type: "diamond", icon: Diamond },
  { type: "ellipse", icon: Circle },
];

const STROKE_TOOLS: { type: ToolType; icon: IconType }[] = [
  { type: "freehand", icon: Pencil },
  { type: "line", icon: Minus },
];

const MobileBtn = ({
  icon: Icon, isActive = false, onClick, size = 19,
}: { icon: IconType; isActive?: boolean; onClick: () => void; size?: number }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 ${
      isActive
        ? "bg-atelier-accent/20 text-atelier-accent"
        : "text-atelier-muted hover:text-atelier-text"
    }`}
  >
    <Icon size={size} />
  </button>
);

export const MobileToolbar = () => {
  const { activeTool, setTool, undo, redo } = useCanvasStore();
  const [openCombo, setOpenCombo] = useState<ComboKey | null>(null);
  const [lastShape, setLastShape] = useState<ToolType>("rectangle");
  const [lastStroke, setLastStroke] = useState<ToolType>("freehand");

  const isShapeActive = (["rectangle", "diamond", "ellipse"] as ToolType[]).includes(activeTool);
  const isStrokeActive = (["freehand", "line"] as ToolType[]).includes(activeTool);

  const handleShapeTap = () => {
    if (openCombo === "shapes") { setOpenCombo(null); return; }
    setOpenCombo("shapes");
    if (!isShapeActive) setTool(lastShape);
  };

  const handleStrokeTap = () => {
    if (openCombo === "strokes") { setOpenCombo(null); return; }
    setOpenCombo("strokes");
    if (!isStrokeActive) setTool(lastStroke);
  };

  const pickTool = (type: ToolType, combo: ComboKey) => {
    setTool(type);
    if (combo === "shapes") setLastShape(type);
    else setLastStroke(type);
    setOpenCombo(null);
  };

  const ShapeIcon = SHAPE_TOOLS.find((s) => s.type === lastShape)?.icon ?? Square;
  const StrokeIcon = STROKE_TOOLS.find((s) => s.type === lastStroke)?.icon ?? Pencil;

  const setToolAndClose = (tool: ToolType) => { setTool(tool); setOpenCombo(null); };

  const handleErase = () => {
    const { selectedIds, deleteElements } = useCanvasStore.getState();
    if (selectedIds.length > 0) deleteElements(selectedIds);
  };

  return (
    <div className="md:hidden relative shrink-0">
      {/*
        Properties panel: absolute overlay above the nav bar.
        bottom-full = positioned at the top edge of this div (= above nav bar).
        Does NOT affect document flow so the canvas height is unaffected.
      */}
      <div className="absolute bottom-full left-0 right-0 pb-1 z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <MobilePropertiesPanel />
        </div>
      </div>

      {/* Shape/stroke combo sub-menu popup */}
      {openCombo && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex gap-1 bg-atelier-surface border border-atelier-border rounded-2xl px-2 py-2 shadow-glass animate-fade-in z-40">
          {(openCombo === "shapes" ? SHAPE_TOOLS : STROKE_TOOLS).map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => pickTool(type, openCombo)}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
                activeTool === type ? "bg-atelier-accent/20 text-atelier-accent" : "text-atelier-muted"
              }`}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      )}

      {/* Main nav bar — tools on left, undo/redo on right */}
      <nav className="flex items-center h-[57px] bg-atelier-surface border-t border-atelier-border px-2">
        {/* Tool buttons */}
        <div className="flex flex-1 items-center justify-around">
          <MobileBtn icon={Hand} isActive={activeTool === "pan"} onClick={() => setToolAndClose("pan")} />
          <MobileBtn icon={MousePointer2} isActive={activeTool === "select"} onClick={() => setToolAndClose("select")} />
          <MobileBtn icon={ShapeIcon} isActive={isShapeActive} onClick={handleShapeTap} />
          <MobileBtn icon={Eraser} onClick={handleErase} />
          <MobileBtn icon={MoveRight} isActive={activeTool === "arrow"} onClick={() => setToolAndClose("arrow")} />
          <MobileBtn icon={StrokeIcon} isActive={isStrokeActive} onClick={handleStrokeTap} />
          <MobileBtn icon={Type} isActive={activeTool === "text"} onClick={() => setToolAndClose("text")} />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-atelier-border mx-1 shrink-0" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={undo}
            aria-label="Undo"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-atelier-muted hover:text-atelier-text hover:bg-atelier-overlay transition-all"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            aria-label="Redo"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-atelier-muted hover:text-atelier-text hover:bg-atelier-overlay transition-all"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </nav>
    </div>
  );
};
