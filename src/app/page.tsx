"use client";

import { Header } from "@/components/header/Header";
import { Canvas } from "@/components/canvas/Canvas";
import { PropertiesPanel } from "@/components/properties/PropertiesPanel";
import { WebToolbar } from "@/components/toolbar/WebToolbar";
import { MobileToolbar } from "@/components/toolbar/MobileToolbar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePreventBrowserZoom } from "@/hooks/usePreventBrowserZoom";

export default function DrawingBoardPage() {
  useKeyboardShortcuts();
  usePreventBrowserZoom();

  return (
    <div className="flex flex-col h-[100dvh] bg-atelier-bg overflow-hidden animate-fade-in">
      <Header />

      {/* Canvas area fills remaining height between header and mobile toolbar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="relative flex-1 overflow-hidden">
          <Canvas />

          {/* Web: floating toolbar + properties panel near selected element */}
          <div className="hidden md:block">
            <WebToolbar />
            <PropertiesPanel />
          </div>
        </main>
      </div>

      {/*
        MobileToolbar is a direct flex child so its height is deducted from canvas area.
        MobilePropertiesPanel is rendered INSIDE MobileToolbar as an absolute overlay
        so it doesn't affect layout flow.
      */}
      <MobileToolbar />
    </div>
  );
}
