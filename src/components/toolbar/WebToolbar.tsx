"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ToolbarButtons } from "./ToolbarButtons";

export const WebToolbar = () => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Show toolbar"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 rounded-xl bg-atelier-surface border border-atelier-border text-atelier-muted shadow-glass hover:text-atelier-text transition-all"
      >
        <PanelLeftOpen size={16} />
      </button>
    );
  }

  return (
    <aside
      className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 p-2 bg-atelier-surface/90 backdrop-blur-xl border border-atelier-border rounded-2xl shadow-glass animate-fade-in"
      role="toolbar"
      aria-label="Drawing tools"
    >
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Hide toolbar"
        className="flex items-center justify-center w-9 h-6 rounded-lg text-atelier-muted hover:text-atelier-text hover:bg-atelier-overlay transition-all mb-1"
      >
        <PanelLeftClose size={14} />
      </button>
      <ToolbarButtons orientation="vertical" />
    </aside>
  );
};
