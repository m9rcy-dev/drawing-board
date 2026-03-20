"use client";

import { useCanvasStore } from "@/store/canvasStore";
import {
  STROKE_COLORS, FILL_COLORS, STROKE_WIDTHS, STROKE_DASH,
} from "@/utils/constants";
import type { StrokeStyle, Sloppiness } from "@/types";

// ─── Section ──────────────────────────────────────────────────────────────────

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <p className="text-[10px] uppercase tracking-widest text-atelier-muted font-sans mb-2">
      {label}
    </p>
    {children}
  </div>
);

// ─── Color Swatch ─────────────────────────────────────────────────────────────

const Swatch = ({
  value, label, active, onClick,
}: {
  value: string; label: string; active: boolean; onClick: () => void;
}) => {
  const isTransparent = value === "transparent";
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`
        relative w-7 h-7 rounded-lg transition-all duration-150
        ${active ? "ring-2 ring-atelier-accent ring-offset-1 ring-offset-atelier-surface scale-105" : "hover:scale-105"}
        border border-white/20
      `}
      style={{
        background: isTransparent
          ? "repeating-conic-gradient(#c8c8c8 0% 25%, #f0f0f0 0% 50%) 0 0 / 10px 10px"
          : value,
      }}
    />
  );
};

// ─── Stroke Width Button ──────────────────────────────────────────────────────

const StrokeWidthBtn = ({
  value, label, active, onClick,
}: {
  value: number; label: string; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={`
      flex-1 h-9 flex items-center justify-center rounded-xl border transition-all duration-150
      ${active
        ? "bg-atelier-accent/20 border-atelier-accent/50 text-atelier-accent"
        : "bg-white/[0.03] border-white/[0.07] text-atelier-muted hover:bg-white/[0.07]"
      }
    `}
  >
    <div
      className="rounded-full bg-current"
      style={{ width: Math.max(12, 28 - value * 2), height: Math.min(value * 1.5, 6) }}
    />
  </button>
);

// ─── Stroke Style Button ──────────────────────────────────────────────────────

const StrokeStyleBtn = ({
  value, active, onClick,
}: {
  value: StrokeStyle; active: boolean; onClick: () => void;
}) => {
  const labels: Record<StrokeStyle, string> = { solid: "Solid", dashed: "Dashed", dotted: "Dotted" };
  const dash = STROKE_DASH[value] ?? [];

  return (
    <button
      onClick={onClick}
      title={labels[value]}
      aria-label={labels[value]}
      aria-pressed={active}
      className={`
        flex-1 h-9 flex items-center justify-center gap-1 rounded-xl border transition-all duration-150
        ${active
          ? "bg-atelier-accent/20 border-atelier-accent/50"
          : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.07]"
        }
      `}
    >
      <svg width="28" height="6" viewBox="0 0 28 6">
        <line
          x1="0" y1="3" x2="28" y2="3"
          stroke={active ? "#06B6D4" : "#6B6884"}
          strokeWidth="2" strokeLinecap="round"
          strokeDasharray={dash.join(" ")}
        />
      </svg>
    </button>
  );
};

// ─── Sloppiness Button ────────────────────────────────────────────────────────

const SLOPPINESS_OPTIONS: { value: Sloppiness; label: string; path: string }[] = [
  { value: 0, label: "Clean",   path: "M2,9 L28,9" },
  { value: 1, label: "Sketch",  path: "M2,9 C7,6 13,12 20,7 S26,9 28,9" },
  { value: 2, label: "Rough",   path: "M2,10 C6,5 11,14 16,8 C20,3 24,13 28,8" },
];

const SloppinessBtn = ({
  option, active, onClick,
}: {
  option: typeof SLOPPINESS_OPTIONS[number]; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title={option.label}
    aria-label={option.label}
    aria-pressed={active}
    className={`
      flex-1 h-9 flex items-center justify-center rounded-xl border transition-all duration-150
      ${active
        ? "bg-atelier-accent/20 border-atelier-accent/50"
        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.07]"
      }
    `}
  >
    <svg width="30" height="18" viewBox="0 0 30 18">
      <path
        d={option.path}
        stroke={active ? "#06B6D4" : "#6B6884"}
        strokeWidth="2" strokeLinecap="round"
        fill="none"
      />
    </svg>
  </button>
);

// ─── Properties Panel ─────────────────────────────────────────────────────────

export const PropertiesPanel = () => {
  const {
    elements, selectedIds,
    activeColor, activeFillColor, activeStrokeWidth, activeStrokeStyle, activeSloppiness,
    setActiveColor, setActiveFillColor, setActiveStrokeWidth, setActiveStrokeStyle, setActiveSloppiness,
    updateSelectedElements,
  } = useCanvasStore();

  if (selectedIds.length === 0) return null;

  const firstEl = elements.find((el) => el.id === selectedIds[0]);
  const strokeColor = firstEl?.strokeColor ?? activeColor;
  const fillColor = firstEl?.fillColor ?? activeFillColor;
  const strokeWidth = firstEl?.strokeWidth ?? activeStrokeWidth;
  const strokeStyle = firstEl?.strokeStyle ?? activeStrokeStyle;
  const sloppiness = (firstEl?.sloppiness ?? activeSloppiness) as Sloppiness;

  const onStrokeColor = (c: string) => { setActiveColor(c); updateSelectedElements({ strokeColor: c }); };
  const onFillColor = (c: string) => { setActiveFillColor(c); updateSelectedElements({ fillColor: c }); };
  const onStrokeWidth = (w: number) => { setActiveStrokeWidth(w); updateSelectedElements({ strokeWidth: w }); };
  const onStrokeStyle = (s: StrokeStyle) => { setActiveStrokeStyle(s); updateSelectedElements({ strokeStyle: s }); };
  const onSloppiness = (s: Sloppiness) => { setActiveSloppiness(s); updateSelectedElements({ sloppiness: s }); };

  return (
    <div
      className="
        absolute top-3 left-3 z-20 w-52
        bg-atelier-surface/90 backdrop-blur-2xl
        border border-white/[0.08] rounded-2xl
        shadow-glass p-4 animate-fade-in
      "
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Section label="Stroke">
        <div className="grid grid-cols-5 gap-1.5">
          {STROKE_COLORS.map(({ value, label }) => (
            <Swatch key={value} value={value} label={label} active={strokeColor === value} onClick={() => onStrokeColor(value)} />
          ))}
        </div>
      </Section>

      <Section label="Background">
        <div className="grid grid-cols-5 gap-1.5">
          {FILL_COLORS.map(({ value, label }) => (
            <Swatch key={value} value={value} label={label} active={fillColor === value} onClick={() => onFillColor(value)} />
          ))}
        </div>
      </Section>

      <Section label="Stroke width">
        <div className="flex gap-1.5">
          {STROKE_WIDTHS.map(({ value, label }) => (
            <StrokeWidthBtn key={value} value={value} label={label} active={Math.abs(strokeWidth - value) < 0.5} onClick={() => onStrokeWidth(value)} />
          ))}
        </div>
      </Section>

      <Section label="Stroke style">
        <div className="flex gap-1.5">
          {(["solid", "dashed", "dotted"] as StrokeStyle[]).map((s) => (
            <StrokeStyleBtn key={s} value={s} active={strokeStyle === s} onClick={() => onStrokeStyle(s)} />
          ))}
        </div>
      </Section>

      <Section label="Sloppiness">
        <div className="flex gap-1.5">
          {SLOPPINESS_OPTIONS.map((opt) => (
            <SloppinessBtn key={opt.value} option={opt} active={sloppiness === opt.value} onClick={() => onSloppiness(opt.value)} />
          ))}
        </div>
      </Section>

      {selectedIds.length > 1 && (
        <p className="mt-3 text-[10px] text-atelier-muted text-center font-sans">
          {selectedIds.length} elements selected
        </p>
      )}
    </div>
  );
};
