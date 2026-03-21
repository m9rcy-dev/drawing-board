"use client";

import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2, Download, Copy, ChevronDown, Sun, Moon } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { exportAsPNG, copyToClipboard } from "@/utils/export";
import { ZOOM_DEFAULT } from "@/utils/constants";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "@/components/common/Logo";
import type { WhiteboardElement } from "@/types";

// ─── Zoom Button ──────────────────────────────────────────────────────────────

const ZoomButton = ({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="flex items-center justify-center w-8 h-8 rounded-lg text-atelier-muted hover:text-atelier-text hover:bg-atelier-overlay transition-all duration-150"
  >
    {children}
  </button>
);

// ─── Export Menu ──────────────────────────────────────────────────────────────

const ExportMenu = ({ elements }: { elements: WhiteboardElement[] }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExportPNG = () => {
    exportAsPNG(elements);
    setOpen(false);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(elements);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Mobile: icon only */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-atelier-accent/10 border border-atelier-accent/20 text-atelier-accent hover:bg-atelier-accent/20 transition-all duration-200"
        aria-label="Export options"
      >
        <Download size={14} />
      </button>

      {/* Desktop: full label button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-atelier-accent/10 border border-atelier-accent/20 text-atelier-accent text-xs font-sans hover:bg-atelier-accent/20 hover:border-atelier-accent/40 transition-all duration-200"
        aria-label="Export options"
      >
        <Download size={13} />
        <span>Export</span>
        <ChevronDown size={11} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-atelier-elevated border border-atelier-border rounded-xl shadow-glass overflow-hidden z-50 animate-fade-in">
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-atelier-text text-xs hover:bg-atelier-overlay transition-colors"
          >
            <Download size={13} className="text-atelier-muted" />
            Save as PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-atelier-text text-xs hover:bg-atelier-overlay transition-colors"
          >
            <Copy size={13} className="text-atelier-muted" />
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────

export const Header = () => {
  const { zoom, setZoom, setPanOffset, elements } = useCanvasStore();
  const { theme, toggleTheme } = useTheme();
  const zoomPercent = Math.round(zoom * 100);

  const handleZoomIn = () => setZoom(Math.min(20, zoom * 1.2));
  const handleZoomOut = () => setZoom(Math.max(0.1, zoom / 1.2));
  const handleResetView = () => {
    setZoom(ZOOM_DEFAULT);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <header className="flex items-center justify-between h-[57px] px-4 shrink-0 bg-atelier-surface/60 backdrop-blur-xl border-b border-atelier-border z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Logo size={28} />
        <span className="hidden sm:block font-display text-atelier-text text-[15px] tracking-tight">
          Draw<span className="text-atelier-muted">Board</span>
        </span>
      </div>

      {/* Zoom controls + theme toggle */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5 bg-atelier-overlay border border-atelier-border rounded-xl px-1 py-1">
          <ZoomButton onClick={handleZoomOut} label="Zoom out"><ZoomOut size={14} /></ZoomButton>
          <button
            onClick={handleResetView}
            className="px-2.5 py-0.5 rounded-lg text-atelier-muted hover:text-atelier-text text-xs font-mono tabular-nums hover:bg-atelier-overlay transition-all duration-150 min-w-[48px] text-center"
            title="Reset view"
          >
            {zoomPercent}%
          </button>
          <ZoomButton onClick={handleZoomIn} label="Zoom in"><ZoomIn size={14} /></ZoomButton>
          <div className="w-px h-4 bg-atelier-border mx-1" />
          <ZoomButton onClick={handleResetView} label="Fit to screen"><Maximize2 size={14} /></ZoomButton>
        </div>

        <div className="w-px h-4 bg-atelier-border mx-1" />

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-atelier-muted hover:text-atelier-text hover:bg-atelier-overlay transition-all duration-150"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Export */}
      <ExportMenu elements={elements} />
    </header>
  );
};
