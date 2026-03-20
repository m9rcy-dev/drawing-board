"use client";

import { Header } from "@/components/header/Header";
import { ToolbarButtons } from "@/components/toolbar/ToolbarButtons";
import { Canvas } from "@/components/canvas/Canvas";
import { PropertiesPanel } from "@/components/properties/PropertiesPanel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DrawingBoardPage() {
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-[100dvh] bg-atelier-bg overflow-hidden animate-fade-in">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop left toolbar */}
        <aside
          className="hidden md:flex flex-col items-center gap-1.5 w-[68px] shrink-0 py-4 px-3 bg-atelier-surface/70 backdrop-blur-xl border-r border-white/[0.06]"
          role="toolbar"
          aria-label="Drawing tools"
        >
          <ToolbarButtons orientation="vertical" />
        </aside>

        {/* Canvas + floating panels */}
        <main className="relative flex-1 overflow-hidden">
          <Canvas />
          <PropertiesPanel />
        </main>
      </div>

      {/* Mobile bottom toolbar */}
      <nav
        className="md:hidden flex items-center justify-center gap-1.5 h-[68px] shrink-0 px-3 bg-atelier-surface/80 backdrop-blur-xl border-t border-white/[0.06] overflow-x-auto no-scrollbar"
        role="toolbar"
        aria-label="Drawing tools"
      >
        <ToolbarButtons orientation="horizontal" />
      </nav>
    </div>
  );
}
