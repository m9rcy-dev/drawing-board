"use client";

import { useRef, useState } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { STROKE_COLORS, FILL_COLORS, STROKE_WIDTHS, STROKE_DASH } from "@/utils/constants";
import type { StrokeStyle } from "@/types";

type ActivePanel = "stroke" | "fill" | "width" | "style" | null;

// ─── Popup Panels ─────────────────────────────────────────────────────────────

const MobileColorPicker = ({
  currentColor,
  presets,
  onChange,
}: {
  currentColor: string;
  presets: readonly { readonly value: string }[];
  onChange: (c: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = currentColor !== "transparent" && !presets.some((p) => p.value === currentColor);
  return (
    <label
      title="Custom color"
      className={`w-8 h-8 rounded-xl border-2 overflow-hidden block cursor-pointer transition-all ${
        isCustom ? "scale-110 border-atelier-accent" : "border-white/20 hover:scale-105"
      }`}
    >
      <input
        ref={inputRef}
        type="color"
        value={isCustom ? currentColor : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute opacity-0 w-0 h-0"
      />
      <div
        className="w-full h-full"
        style={{
          background: isCustom
            ? currentColor
            : "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
        }}
      />
    </label>
  );
};

const StrokePanel = ({
  active, onPick, onPickCustom,
}: { active: string; onPick: (v: string) => void; onPickCustom: (v: string) => void }) => (
  <div className="flex gap-2 justify-center bg-atelier-surface border border-atelier-border rounded-2xl px-3 py-3 shadow-glass animate-fade-in">
    {STROKE_COLORS.map(({ value, label }) => (
      <button
        key={value}
        onClick={() => onPick(value)}
        title={label}
        className={`w-8 h-8 rounded-xl border-2 transition-all ${
          active === value ? "scale-110 border-atelier-accent" : "border-white/20 hover:scale-105"
        }`}
        style={{ background: value }}
      />
    ))}
    <MobileColorPicker currentColor={active} presets={STROKE_COLORS} onChange={onPickCustom} />
  </div>
);

const FillPanel = ({
  active, onPick, onPickCustom,
}: { active: string; onPick: (v: string) => void; onPickCustom: (v: string) => void }) => (
  <div className="flex gap-2 justify-center bg-atelier-surface border border-atelier-border rounded-2xl px-3 py-3 shadow-glass animate-fade-in">
    {FILL_COLORS.map(({ value, label }) => (
      <button
        key={value}
        onClick={() => onPick(value)}
        title={label}
        className={`w-8 h-8 rounded-xl border-2 transition-all ${
          active === value ? "scale-110 border-atelier-accent" : "border-white/20 hover:scale-105"
        }`}
        style={{
          background: value === "transparent"
            ? "repeating-conic-gradient(#c8c8c8 0% 25%, #f0f0f0 0% 50%) 0 0 / 8px 8px"
            : value,
        }}
      />
    ))}
    <MobileColorPicker currentColor={active} presets={FILL_COLORS} onChange={onPickCustom} />
  </div>
);

const WidthPanel = ({
  active, onPick,
}: { active: number; onPick: (v: number) => void }) => (
  <div className="flex gap-2 justify-center bg-atelier-surface border border-atelier-border rounded-2xl px-4 py-3 shadow-glass animate-fade-in">
    {STROKE_WIDTHS.map(({ value, label }) => (
      <button
        key={value}
        onClick={() => onPick(value)}
        title={label}
        className={`w-14 h-10 rounded-xl border flex items-center justify-center transition-all ${
          Math.abs(active - value) < 0.5
            ? "bg-atelier-accent/20 border-atelier-accent/50 text-atelier-accent"
            : "bg-atelier-overlay border-atelier-border text-atelier-muted"
        }`}
      >
        <div
          className="rounded-full bg-current"
          style={{ width: Math.max(14, 32 - value * 2), height: Math.min(value * 1.5, 6) }}
        />
      </button>
    ))}
  </div>
);

const StylePanel = ({
  active, onPick,
}: { active: StrokeStyle; onPick: (v: StrokeStyle) => void }) => (
  <div className="flex gap-2 justify-center bg-atelier-surface border border-atelier-border rounded-2xl px-4 py-3 shadow-glass animate-fade-in">
    {(["solid", "dashed", "dotted"] as StrokeStyle[]).map((s) => {
      const dash = STROKE_DASH[s] ?? [];
      const isActive = active === s;
      return (
        <button
          key={s}
          onClick={() => onPick(s)}
          title={s}
          className={`w-14 h-10 rounded-xl border flex items-center justify-center transition-all ${
            isActive
              ? "bg-atelier-accent/20 border-atelier-accent/50"
              : "bg-atelier-overlay border-atelier-border"
          }`}
        >
          <svg width="28" height="6" viewBox="0 0 28 6">
            <line
              x1="0" y1="3" x2="28" y2="3"
              stroke={isActive ? "#90E0EF" : "#909099"}
              strokeWidth="2" strokeLinecap="round"
              strokeDasharray={dash.join(" ")}
            />
          </svg>
        </button>
      );
    })}
  </div>
);

// ─── Mobile Properties Panel ──────────────────────────────────────────────────

export const MobilePropertiesPanel = () => {
  const {
    elements, selectedIds,
    activeColor, activeFillColor, activeStrokeWidth, activeStrokeStyle,
    setActiveColor, setActiveFillColor, setActiveStrokeWidth, setActiveStrokeStyle,
    updateSelectedElements,
  } = useCanvasStore();

  const [openPanel, setOpenPanel] = useState<ActivePanel>(null);

  if (selectedIds.length === 0) return null;

  const firstEl = elements.find((el) => el.id === selectedIds[0]);
  const strokeColor = firstEl?.strokeColor ?? activeColor;
  const fillColor = firstEl?.fillColor ?? activeFillColor;
  const strokeWidth = firstEl?.strokeWidth ?? activeStrokeWidth;
  const strokeStyle = (firstEl?.strokeStyle ?? activeStrokeStyle) as StrokeStyle;

  const toggle = (panel: ActivePanel) =>
    setOpenPanel((prev) => (prev === panel ? null : panel));

  const onStrokeColor = (c: string) => {
    setActiveColor(c);
    updateSelectedElements({ strokeColor: c });
    setOpenPanel(null);
  };
  const onStrokeColorCustom = (c: string) => {
    setActiveColor(c);
    updateSelectedElements({ strokeColor: c });
    // Don't close — user is still in the native color picker
  };
  const onFillColor = (c: string) => {
    setActiveFillColor(c);
    updateSelectedElements({ fillColor: c });
    setOpenPanel(null);
  };
  const onFillColorCustom = (c: string) => {
    setActiveFillColor(c);
    updateSelectedElements({ fillColor: c });
    // Don't close — user is still in the native color picker
  };
  const onWidth = (w: number) => {
    setActiveStrokeWidth(w);
    updateSelectedElements({ strokeWidth: w });
    setOpenPanel(null);
  };
  const onStyle = (s: StrokeStyle) => {
    setActiveStrokeStyle(s);
    updateSelectedElements({ strokeStyle: s });
    setOpenPanel(null);
  };

  return (
    <div
      className="flex flex-col items-center gap-2 mx-3 mb-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Popup panels — appear above the bar */}
      {openPanel === "stroke" && <StrokePanel active={strokeColor} onPick={onStrokeColor} onPickCustom={onStrokeColorCustom} />}
      {openPanel === "fill" && <FillPanel active={fillColor} onPick={onFillColor} onPickCustom={onFillColorCustom} />}
      {openPanel === "width" && <WidthPanel active={strokeWidth} onPick={onWidth} />}
      {openPanel === "style" && <StylePanel active={strokeStyle} onPick={onStyle} />}

      {/* Compact bar */}
      <div className="flex items-center gap-0.5 bg-atelier-surface/95 border border-atelier-border rounded-2xl px-2 py-1.5 shadow-glass">
        {/* Stroke color */}
        <button
          onClick={() => toggle("stroke")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            openPanel === "stroke" ? "bg-atelier-accent/15" : "hover:bg-atelier-overlay"
          }`}
        >
          <div
            className="w-4 h-4 rounded-full border border-white/40 shrink-0"
            style={{ background: strokeColor }}
          />
          <span className="text-[10px] text-atelier-muted font-sans">Stroke</span>
        </button>

        <div className="w-px h-4 bg-atelier-border" />

        {/* Fill color */}
        <button
          onClick={() => toggle("fill")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            openPanel === "fill" ? "bg-atelier-accent/15" : "hover:bg-atelier-overlay"
          }`}
        >
          <div
            className="w-4 h-4 rounded shrink-0 border border-white/30"
            style={{
              background: fillColor === "transparent"
                ? "repeating-conic-gradient(#c8c8c8 0% 25%, #f0f0f0 0% 50%) 0 0 / 6px 6px"
                : fillColor,
            }}
          />
          <span className="text-[10px] text-atelier-muted font-sans">Fill</span>
        </button>

        <div className="w-px h-4 bg-atelier-border" />

        {/* Stroke width */}
        <button
          onClick={() => toggle("width")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            openPanel === "width" ? "bg-atelier-accent/15" : "hover:bg-atelier-overlay"
          }`}
        >
          <div
            className="rounded-full bg-atelier-muted shrink-0"
            style={{ width: 16, height: Math.min(strokeWidth * 1.2, 5) + 1 }}
          />
          <span className="text-[10px] text-atelier-muted font-sans">Width</span>
        </button>

        <div className="w-px h-4 bg-atelier-border" />

        {/* Stroke style */}
        <button
          onClick={() => toggle("style")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
            openPanel === "style" ? "bg-atelier-accent/15" : "hover:bg-atelier-overlay"
          }`}
        >
          <svg width="18" height="4" viewBox="0 0 18 4" className="shrink-0">
            <line
              x1="0" y1="2" x2="18" y2="2"
              stroke="#909099" strokeWidth="2" strokeLinecap="round"
              strokeDasharray={(STROKE_DASH[strokeStyle] ?? []).join(" ")}
            />
          </svg>
          <span className="text-[10px] text-atelier-muted font-sans">Line</span>
        </button>
      </div>
    </div>
  );
};
