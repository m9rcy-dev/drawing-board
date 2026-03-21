# Drawboard — Simple Whiteboard

A lightweight, production-grade whiteboard built with Next.js 16, TypeScript, and HTML5 Canvas. Draw shapes, connect them with smart arrows, write text, and export your work as PNG.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [How It Works — Architecture Overview](#how-it-works--architecture-overview)
3. [How Shapes Are Structured](#how-shapes-are-structured)
4. [How Arrows Link Shapes](#how-arrows-link-shapes)
5. [File & Folder Structure](#file--folder-structure)
6. [Design System — Atelier](#design-system--atelier)
7. [Configuration Files Explained](#configuration-files-explained)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Extending the App](#extending-the-app)
10. [Deploying to GitHub Pages](#deploying-to-github-pages)
11. [Production Readiness Notes](#production-readiness-notes)
12. [Recent Changes](#recent-changes)

---

## Quick Start

```bash
# 1. Install dependencies (required before first run)
npm install

# 2. Start the development server
npm run dev
# → Open http://localhost:3000

# 3. Run unit tests
npm test

# 4. Type-check without building
npm run type-check

# 5. Lint the codebase
npm run lint

# 6. Build the static site and preview it locally
npm run build
npm run preview
# → Open http://localhost:3000
```

> **Important — never open `out/index.html` directly in your browser.**
> Next.js generates asset paths like `/_next/static/css/...` which are absolute and only
> work over HTTP. Opening the file via `file://` means the browser looks for `/_next/` at
> your filesystem root — styles and scripts will be missing. Always use `npm run preview`
> (which runs `npx serve out`) to serve the build over HTTP.

> **No `.env` file needed.** The app is entirely client-side with no backend or external API calls.

---

## How It Works — Architecture Overview

The app is built around three layers that talk to each other in one direction:

```
User Input (mouse / touch / keyboard)
        ↓
   useCanvas.ts  ←──────────────────────────────┐
   (the brain)   reads fresh state every frame    │
        ↓                                         │
  canvasStore.ts (Zustand)                        │
  (single source of truth)  ─────────────────────┘
        ↓
  Renderer.ts → drawElement.ts
  (draws to <canvas> on every frame via requestAnimationFrame)
```

### The render loop

Every time the Zustand store changes (element added, moved, resized, etc.), a new `requestAnimationFrame` fires and the `Renderer` redraws the entire canvas from scratch. This is the same approach used by Excalidraw and Figma — it's simpler and more correct than trying to patch individual elements.

```
Store changes → React re-render → renderFrame() → RAF → Renderer.render()
```

### Coordinate system

The canvas has **two coordinate spaces**:

| Space | What it is | Used by |
|-------|-----------|---------|
| **Screen space** | CSS pixels, top-left = (0,0) | Mouse events, HTML overlays |
| **World space** | The infinite canvas coordinate | All stored element positions |

Converting between them:
```
worldX = (screenX - panOffset.x) / zoom
worldY = (screenY - panOffset.y) / zoom
```

All element positions (`x`, `y`, `width`, `height`) are stored in **world space**. The renderer applies pan and zoom as a canvas transform before drawing.

---

## How Shapes Are Structured

Every element on the canvas is a TypeScript object stored in the Zustand array `elements: WhiteboardElement[]`.

### The type hierarchy

```
WhiteboardElement (union)
├── RectangleElement
├── DiamondElement
├── EllipseElement
├── LineElement
├── ArrowElement
├── FreehandElement
└── TextElement
```

All element types share a common **BaseElement**:

```typescript
interface BaseElement {
  id: string;          // unique ID: "el_<timestamp>_<random>"
  type: ElementType;   // "rectangle" | "diamond" | "ellipse" | ...
  x: number;           // left edge in world space
  y: number;           // top edge in world space
  width: number;       // bounding box width
  height: number;      // bounding box height
  angle: number;       // rotation in radians (not yet used in UI)
  strokeColor: string; // e.g. "#1e1e2e"
  fillColor: string;   // e.g. "#a5d8ff" or "transparent"
  strokeWidth: number; // 1 | 2.5 | 5
  strokeStyle: "solid" | "dashed" | "dotted";
  sloppiness: 0 | 1 | 2;  // 0=clean, 1=sketch, 2=rough
  opacity: number;         // 0–1
  isSelected: boolean;     // true when user has selected this element
  createdAt: number;       // Date.now() timestamp
  label?: string;          // optional inline text label (set by double-clicking a shape)
}
```

Each specific element type adds its own fields on top:

```typescript
// Rectangle: adds corner radius
interface RectangleElement extends BaseElement {
  type: "rectangle";
  borderRadius: number;
}

// Line: adds a second endpoint
interface LineElement extends BaseElement {
  type: "line";
  x2: number;
  y2: number;
}

// Arrow: adds second endpoint + binding metadata + optional bend
interface ArrowElement extends BaseElement {
  type: "arrow";
  x2: number;
  y2: number;
  midPoint: Point | null;             // null = straight, Point = bent bezier
  startBinding: ArrowBinding | null;  // { elementId } of bound start shape
  endBinding: ArrowBinding | null;    // { elementId } of bound end shape
}

// Freehand: stores every point the user drew through
interface FreehandElement extends BaseElement {
  type: "freehand";
  points: Point[];   // raw captured pointer positions
}

// Text: adds content and typography
interface TextElement extends BaseElement {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  // width is used for text wrapping (inherited from BaseElement)
}
```

### Shape labels

Any shape (except freehand and text) can have an optional text label set by double-clicking it in select mode. Labels are stored in `BaseElement.label?: string` and rendered by `drawShapeLabel()` in `drawElement.ts`:

- **Rectangles, diamonds, ellipses**: label is drawn centered inside the shape
- **Arrows and lines**: label is drawn at the midpoint, with a small white background pill for readability

### Creating an element

Use the factory function in `src/core/elements/createElement.ts`:

```typescript
const el = createElement("rectangle", {
  x: 100,
  y: 100,
  strokeColor: "#1e1e2e",
  fillColor: "#a5d8ff",
  strokeWidth: 2,
});
// Returns a fully initialised RectangleElement with a unique id
```

The factory handles all defaults so callers don't need to provide every field.

### How sloppiness (sketch style) works

The `sloppiness` value controls how elements are rendered:

- **0 (clean)**: Uses native canvas APIs (`roundRect`, `ellipse`, `lineTo`)
- **1 (sketch)**: Adds a slight bezier jitter perpendicular to each line segment
- **2 (rough)**: Draws each stroke twice with stronger jitter (like a pencil sketch)

The jitter uses a **seeded deterministic RNG** (`src/core/renderer/sloppiness.ts`) so a "rough" rectangle looks the same every frame — the randomness is seeded from the element's `id`, not `Math.random()`.

---

## How Arrows Link Shapes

This is the most complex part of the app. Here's a complete walkthrough.

### Arrow data model

An `ArrowElement` has two endpoints:

```
(x, y) ──────────────────────────── (x2, y2)
 start                                  end
```

When either endpoint is "bound" to a shape, it stores that shape's `id`:

```typescript
startBinding: { elementId: "el_1234_abc" } | null
endBinding:   { elementId: "el_5678_def" } | null
```

### Drawing an arrow (creating a new one)

1. User clicks: if the click lands inside a shape's bounding box, the arrow **snaps its start** to that shape's border. The border point is computed toward the click position using `shapeBorderPoint()`.
2. User drags: the end endpoint follows the cursor. If the cursor enters another shape's bounding box, the end snaps to that shape's border, facing toward the arrow's start.
3. User releases: the final element is added to the store.

### Border intersection math

Instead of connecting to a shape's center (which looks wrong), arrows connect to the **exact border of the shape**, from the direction of the other endpoint. The math varies per shape type:

**Rectangle**
```
// AABB (axis-aligned bounding box) ray intersection
tx = halfWidth  / |dx|   // how far to scale before hitting left/right side
ty = halfHeight / |dy|   // how far to scale before hitting top/bottom side
t  = min(tx, ty)         // whichever side we hit first
borderPoint = center + direction * t
```

**Ellipse**
```
// Parametric ellipse equation
t = 1 / sqrt( (dx/hw)² + (dy/hh)² )
borderPoint = center + direction * t
```

**Diamond (rhombus)**
```
// L1 norm (Manhattan distance on rotated axes)
t = 1 / ( |dx|/hw + |dy|/hh )
borderPoint = center + direction * t
```

All three are implemented in `shapeBorderPoint()` in `src/hooks/useCanvas.ts`.

### Moving bound shapes (live arrow stretching)

When the user moves a shape that has arrows bound to it:

```
1. moveBoundArrows() runs after every pointermove
2. For each arrow whose startBinding or endBinding matches a moved shape:
   a. Compute the shape's NEW position (old position + drag delta)
   b. Compute shapeBorderPoint(movedShape, otherEndpoint.x, otherEndpoint.y)
      → border point facing the arrow's OTHER endpoint
   c. Update arrow.x / arrow.x2 to that border point
```

This ensures arrows always connect to the correct border, even as shapes move.

### Stale-closure prevention

A critical implementation detail: React's `useCallback` captures variables at render time. When the user drags fast, many `pointermove` events fire **between React renders**, so the captured `elements` array would be stale.

The fix: inside `handlePointerMove`, always call `useCanvasStore.getState()` to get the freshest state:

```typescript
// ✅ Always fresh
const { elements: freshEls, selectedIds: freshIds } = useCanvasStore.getState();

// ❌ Could be stale (captured at last render)
// const { elements } = store;
```

### Arrow bending (midpoint)

Users can drag the cyan midpoint handle to create a curved arrow:

```
ArrowElement.midPoint = { x: 450, y: 200 }  // bend control point
```

When `midPoint` is set, the renderer draws a **quadratic bezier curve** instead of a straight line:
```
ctx.quadraticCurveTo(midPoint.x, midPoint.y, x2, y2)
```

The arrowhead direction is computed from `midPoint → (x2,y2)` so it always looks natural at the tip.

---

## File & Folder Structure

```
drawing-board/
├── src/
│   ├── types/
│   │   └── index.ts              ← All TypeScript types. Start here to understand the data model.
│   │
│   ├── utils/
│   │   ├── constants.ts          ← Every magic number/string lives here. No inline literals in code.
│   │   └── export.ts             ← PNG export and copy-to-clipboard logic
│   │
│   ├── store/
│   │   ├── types.ts              ← CanvasState and CanvasActions interfaces
│   │   ├── canvasStore.ts        ← Zustand store: all state + actions (add/delete/undo/redo/zoom...)
│   │   └── canvasStore.test.ts   ← Unit tests for the store
│   │
│   ├── core/                     ← Pure domain logic — no React, no UI concerns
│   │   ├── elements/
│   │   │   ├── createElement.ts       ← Factory: creates any element type with defaults
│   │   │   └── createElement.test.ts  ← Tests for factory
│   │   │
│   │   ├── renderer/
│   │   │   ├── Renderer.ts       ← Orchestrates a full frame: background + grid + all elements
│   │   │   ├── drawElement.ts    ← Draws a single element to ctx; also renders shape labels
│   │   │   └── sloppiness.ts     ← Seeded RNG + sloppy bezier drawing utilities
│   │   │
│   │   └── collision/
│   │       ├── hitTest.ts        ← Click-to-select: per-shape point-in-shape tests
│   │       ├── arrowHandles.ts   ← Arrow handle positions + hit detection (bend / endpoints)
│   │       └── resizeHandles.ts  ← 8-handle resize: positions, cursors, resize math
│   │
│   ├── hooks/
│   │   ├── useCanvas.ts             ← THE brain: all pointer interaction + native wheel zoom
│   │   ├── useTheme.ts              ← Light/dark mode via useSyncExternalStore + localStorage
│   │   ├── usePreventBrowserZoom.ts ← Blocks Ctrl+scroll browser zoom via non-passive wheel listener
│   │   ├── useKeyboardShortcuts.ts  ← Keyboard bindings (tool keys, undo/redo, delete, select-all)
│   │   └── useWindowSize.ts         ← Debounced window resize hook
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   └── Canvas.tsx        ← <canvas> element + ResizeObserver + RAF loop + text overlay
│   │   │
│   │   ├── common/
│   │   │   └── Logo.tsx          ← Inline SVG logo component (theme-independent)
│   │   │
│   │   ├── header/
│   │   │   └── Header.tsx        ← Top bar: logo, zoom controls, theme toggle, export dropdown
│   │   │
│   │   ├── toolbar/
│   │   │   ├── ToolButton.tsx       ← Single tool button with tooltip and active glow
│   │   │   ├── ToolbarButtons.tsx   ← All tool buttons in vertical or horizontal orientation
│   │   │   ├── WebToolbar.tsx       ← Collapsible floating sidebar (desktop only)
│   │   │   └── MobileToolbar.tsx    ← Bottom sheet toolbar with combo pickers + undo/redo (mobile)
│   │   │
│   │   └── properties/
│   │       ├── PropertiesPanel.tsx       ← Floating panel near selected element (desktop)
│   │       └── MobilePropertiesPanel.tsx ← Compact overlay bar above mobile toolbar
│   │
│   └── app/
│       ├── layout.tsx            ← Root layout: fonts, metadata, viewport, anti-FOUC theme script
│       ├── page.tsx              ← Main page: header + canvas + toolbars
│       └── globals.css           ← CSS variables, Tailwind v4 @theme {}, light/dark overrides
│
├── docs/
│   └── progress.md               ← Session-by-session progress log. Read before starting work.
│
├── next.config.mjs               ← Next.js config (static export for GitHub Pages)
├── postcss.config.mjs            ← PostCSS config for Tailwind v4
├── tsconfig.json                 ← TypeScript strict mode, path alias @/* → src/*
├── jest.config.js                ← Jest config for ts-jest + jsdom
└── package.json                  ← Scripts and dependencies
```

### Where to find things quickly

| "I want to…" | Look in |
|---|---|
| Add a new element type | `src/types/index.ts` → `src/core/elements/createElement.ts` → `src/core/renderer/drawElement.ts` |
| Change how an element is drawn | `src/core/renderer/drawElement.ts` |
| Add a new tool | `src/types/index.ts` (ToolType) → `src/hooks/useKeyboardShortcuts.ts` → toolbar components → `src/hooks/useCanvas.ts` |
| Change a color or size constant | `src/utils/constants.ts` |
| Change the store (new action, new state) | `src/store/types.ts` → `src/store/canvasStore.ts` |
| Change pointer/mouse interaction | `src/hooks/useCanvas.ts` |
| Change the theme system | `src/app/globals.css` (`@theme {}` + `html[data-theme="light"]`) |
| Change the mobile toolbar | `src/components/toolbar/MobileToolbar.tsx` |
| Change the properties panel | `src/components/properties/PropertiesPanel.tsx` (desktop) or `MobilePropertiesPanel.tsx` (mobile) |
| Add a keyboard shortcut | `src/hooks/useKeyboardShortcuts.ts` |

---

## Design System — Atelier

The app uses a two-mode design system called **Atelier** defined entirely in `src/app/globals.css`. There is no `tailwind.config.ts` — all tokens live in the `@theme {}` block and Tailwind v4 generates utility classes from them automatically (`bg-atelier-bg`, `text-atelier-text`, etc.).

### Dark mode (default)

| Token | Value | Used for |
|-------|-------|----------|
| `atelier-bg` | `#1B1B1B` | Page / workspace background |
| `atelier-surface` | `#252525` | Toolbar, header, panels |
| `atelier-elevated` | `#303030` | Dropdown menus, popups |
| `atelier-canvas` | `#F0EFEB` | Drawing canvas (warm cream) |
| `atelier-accent` | `#90E0EF` | Active tool, selection handles, highlights |
| `atelier-text` | `#F0EFEB` | Primary text |
| `atelier-muted` | `#909099` | Labels, secondary text |
| `atelier-border` | `rgba(255,255,255,0.10)` | Borders and dividers |
| `atelier-overlay` | `rgba(255,255,255,0.05)` | Hover backgrounds |

### Light mode

Activated via `html[data-theme="light"]` on the `<html>` element. Overrides only the variables that differ:

| Token | Value |
|-------|-------|
| `atelier-bg` | `#F0EFEB` |
| `atelier-surface` | `#FFFFFF` |
| `atelier-accent` | `#0891B2` |
| `atelier-text` | `#1B1B1B` |
| `atelier-muted` | `#6B7280` |
| `atelier-border` | `rgba(0,0,0,0.10)` |

### Theme switching implementation

The theme hook (`src/hooks/useTheme.ts`) uses React's `useSyncExternalStore`:

```typescript
// Server and first client render always return "dark" (via getServerSnapshot)
// → no hydration mismatch, even if localStorage holds "light"
// After hydration, React automatically switches to getSnapshot() (actual stored value)

const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
```

The `<html>` element has `suppressHydrationWarning` because the anti-FOUC inline script (in `<head>`) mutates `data-theme` before React hydrates — React would otherwise log a mismatch for that attribute.

Fonts: **Fraunces** (display/logo) · **DM Sans** (UI) · **JetBrains Mono** (numbers/mono)

---

## Configuration Files Explained

### `next.config.mjs` — Next.js configuration

```js
const nextConfig = {
  output: "export",     // Generates a static site in /out — required for GitHub Pages
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",  // Set to "/repo-name" for GitHub Pages
  trailingSlash: true,  // Helps GitHub Pages serve index.html from subdirectories
  images: { unoptimized: true },  // Static export doesn't support Next.js image optimization
};
```

### `src/app/layout.tsx` — Root layout

Exports two named constants that Next.js picks up automatically:

- **`metadata`** — sets `<title>` and `<meta name="description">`
- **`viewport`** — sets `<meta name="viewport">` with `maximum-scale=1, user-scalable=no` to prevent the browser from pinch-zooming the page (canvas zoom is handled in JS instead)

Also includes an inline `<script>` in `<head>` that reads `localStorage` and sets `data-theme` synchronously before React hydrates — preventing a flash of the wrong theme (FOUC).

### `src/app/globals.css` — Design system (Tailwind v4)

In Tailwind v4 there is no `tailwind.config.ts`. All design tokens live in the `@theme {}` block inside `globals.css`. The file is structured as:

1. `@import "tailwindcss"` — single import replaces the old three-directive setup
2. `@theme {}` — dark-mode design tokens (auto-generates all `bg-*`, `text-*`, etc. utilities)
3. Keyframe definitions (`fade-in`, `tool-pop`, `glow-pulse`, `grain`)
4. `html[data-theme="light"] {}` — light-mode overrides (unlayered CSS wins over `@layer`)
5. Base styles (`html`, `body`, `canvas`, scrollbar, focus ring, grain overlay)

### `tsconfig.json` — TypeScript

Key settings:
- `"strict": true` — enables all strict checks (no implicit `any`, strict null checks, etc.)
- `"paths": { "@/*": ["./src/*"] }` — allows `import { X } from "@/types"` instead of relative paths

### `jest.config.js` — Testing

- Uses `ts-jest` to run TypeScript tests directly
- `testEnvironment: "jsdom"` — simulates a browser environment for component tests
- `moduleNameMapper` maps `@/*` path aliases so they work in tests too

### `src/utils/constants.ts` — All magic values

**Every** number and string literal used in rendering or interaction lives here. Never put raw values in component code — always import from constants. This makes the app easy to tune (e.g., changing `ARROW_HEAD_SIZE` in one place affects all arrows everywhere).

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Hand (pan) tool |
| `1` | Select tool |
| `2` | Rectangle |
| `3` | Diamond |
| `4` | Ellipse (circle) |
| `5` | Arrow |
| `6` | Line |
| `7` | Freehand / pencil |
| `8` | Text |
| `Ctrl+Z` | Undo |
| `Ctrl+R` or `Ctrl+Y` | Redo |
| `Ctrl+A` | Select all elements |
| `Ctrl+Shift+Delete` | Clear canvas |
| `Delete` / `Backspace` | Delete selected elements |
| `Escape` | Deselect all |
| `Space + drag` | Temporary pan (works in any tool mode) |
| `Scroll wheel` | Zoom in / out (anchored to cursor position) |
| `Ctrl + Scroll` | Zoom (browser zoom is blocked; this always zooms the canvas) |
| `Middle button + drag` | Pan |
| `Double-click shape` | Edit inline label (rect / diamond / ellipse / arrow / line) |
| `Double-click text` | Re-edit text content |

---

## Extending the App

### Adding a new shape type (e.g., Triangle)

Follow these steps in order:

**1. Add the type** (`src/types/index.ts`):
```typescript
export interface TriangleElement extends BaseElement {
  type: "triangle";
}

// Add "triangle" to the ElementType union:
export type ElementType = "rectangle" | "diamond" | "ellipse" | "line" | "arrow" | "freehand" | "text" | "triangle";

// Add to WhiteboardElement union:
export type WhiteboardElement = RectangleElement | ... | TriangleElement;
```

**2. Create the factory case** (`src/core/elements/createElement.ts`):
```typescript
case "triangle":
  return { ...b, type: "triangle" } as TriangleElement;
```

**3. Draw it** (`src/core/renderer/drawElement.ts`):
```typescript
const drawTriangle = (ctx: CanvasRenderingContext2D, el: TriangleElement): void => {
  const { x, y, width: w, height: h } = el;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);        // top center
  ctx.lineTo(x + w, y + h);        // bottom right
  ctx.lineTo(x, y + h);            // bottom left
  ctx.closePath();
  if (el.fillColor !== "transparent") ctx.fill();
  ctx.stroke();
};

// In the switch statement:
case "triangle": drawTriangle(ctx, el); break;
```

**4. Add hit testing** (`src/core/collision/hitTest.ts`):
```typescript
case "triangle":
  return isPointInRect(p, el.x, el.y, el.width, el.height, RECT_HIT_PADDING);
```

**5. Add to toolbar** — add an entry to `WebToolbar` / `MobileToolbar` and `ToolbarButtons.tsx`.

**6. Add keyboard shortcut** (`src/hooks/useKeyboardShortcuts.ts`):
```typescript
const TOOL_KEYS: Record<string, ToolType> = {
  // ...existing...
  "9": "triangle",
};
```

That's it. The store, history, selection, export, and label system all work automatically because they operate on `WhiteboardElement[]` generically.

### Adding a new property (e.g., opacity slider)

1. Add `activeOpacity` state + `setActiveOpacity` action to the store (pattern already exists)
2. Add a UI control to `PropertiesPanel.tsx` and `MobilePropertiesPanel.tsx`
3. Pass the value through `createElement()` and the relevant `drawXxx()` function

### Adding persistence (save/load)

The Zustand store doesn't currently persist. To add localStorage persistence:

```typescript
import { persist } from "zustand/middleware";

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({ /* ...existing store... */ }),
    {
      name: "drawboard-storage",
      partialize: (state) => ({ elements: state.elements }), // only save elements
    }
  )
);
```

---

## Deploying to GitHub Pages

The app is configured for static export — no server required.

### One-time setup

1. In your GitHub repo: **Settings → Pages → Source → GitHub Actions**

2. Create a `.env.local` for local testing with a base path:
```bash
# .env.local (not committed)
NEXT_PUBLIC_BASE_PATH=/your-repo-name
```

### Automatic deployment

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. It runs on every push to `main`:

1. Builds the app with `npm run build` (generates static files in `/out`)
2. Uploads the `/out` directory as a Pages artifact
3. Deploys to `https://<your-username>.github.io/<your-repo-name>/`

### Manual deployment

```bash
# Build the static site
NEXT_PUBLIC_BASE_PATH=/your-repo-name npm run build

# The /out directory contains the deployable static site
# Upload it to any static host (GitHub Pages, Netlify, Vercel, S3, etc.)
```

---

## Production Readiness Notes

### What's solid ✅

- **Type safety**: TypeScript strict mode throughout, no `any`
- **Performance**: `requestAnimationFrame` render loop, DPR-aware canvas scaling, no unnecessary re-renders
- **Touch support**: Pointer events work on mobile and tablet; 44px minimum touch targets
- **History**: Undo/redo with up to 100 steps, deep-cloned snapshots
- **Stale-closure safety**: `useCanvasStore.getState()` inside event handlers avoids drift between pointer events
- **Deterministic rendering**: Seeded RNG for sloppiness — elements look the same on every frame
- **Export**: PNG export and clipboard copy use `toDataURL()` for maximum iOS/Safari compatibility
- **Zoom isolation**: Browser pinch-zoom and Ctrl+scroll are blocked at two levels (viewport meta + non-passive wheel listener) so the UI chrome is never accidentally scaled
- **Hydration safety**: `useSyncExternalStore` with `getServerSnapshot` ensures SSR and client agree on initial theme; `suppressHydrationWarning` on `<html>` handles the anti-FOUC attribute mutation
- **Theme flash prevention**: Inline `<script>` in `<head>` sets `data-theme` synchronously before React hydrates, with matching CSS variables for instant visual response

### Known gaps to address before v1.0

| Gap | Where to fix | Effort |
|-----|-------------|--------|
| No persistence — data lost on page refresh | Add Zustand `persist` middleware | Low |
| No error boundaries — a rendering error crashes the whole app | Add `<ErrorBoundary>` in `page.tsx` | Low |
| Test coverage is partial | Add tests for `useCanvas`, `hitTest`, `Renderer` | Medium |
| No 404 page | Add `src/app/not-found.tsx` | Low |
| Canvas state is global — can't have two boards | Scoped store per board | High |
| No collaboration | Would require a WebSocket layer + CRDT | Very high |

---

## Recent Changes

### UI Redesign — Atelier Light/Dark Theme

- **New color palette**: Eerie Black (`#1B1B1B`) dark / White Picket Fence (`#F0EFEB`) light / Soft Cyan (`#90E0EF`) accent — replaces the old violet scheme
- **Light/Dark mode toggle**: Sun/Moon button in the header. Persists to `localStorage`. Anti-FOUC script prevents flash of wrong theme on load.
- **Header height**: 57px (matches mobile toolbar height for visual consistency)

### Desktop Toolbar (WebToolbar)

- Collapsible floating sidebar on the left — click the panel-close icon to hide, panel-open to restore
- Lives in `src/components/toolbar/WebToolbar.tsx`

### Mobile Toolbar (MobileToolbar)

- Excalidraw-style bottom sheet replacing the old fixed sidebar
- **Combo pickers**: shapes (rect / diamond / ellipse) and strokes (freehand / line) share one button each; tapping opens a sub-menu above the bar
- **Undo / Redo** integrated into the right side of the nav bar (no longer floating — avoids overlap with the properties bar)
- Properties panel is rendered inside `MobileToolbar` as an `absolute bottom-full` overlay — it floats above the nav without affecting document flow or canvas height

### Mobile Properties Panel (MobilePropertiesPanel)

- Compact floating bar that appears above the mobile toolbar when elements are selected
- Four property buttons: Stroke color / Fill color / Stroke width / Stroke style
- Tapping each opens a popup panel above with full options; picking a value commits and closes

### Desktop Properties Panel — Follows Selected Element

- No longer fixed at `top-3 left-[72px]`
- `computePosition()` converts the selected element's world-space bounds to screen coordinates and places the panel to the right of the element (falls back to left, then near toolbar if no room)

### Shape Labels

- Double-click any non-text, non-freehand shape in select mode to add an inline label
- Labels on rectangles/diamonds/ellipses render centered inside the shape
- Labels on arrows/lines render at the midpoint with a white background pill for readability
- Double-click again to edit; clearing the label removes it without deleting the shape
- Stored in `BaseElement.label?: string`

### Auto-Switch to Select After Drawing

- After placing any shape, the active tool automatically switches back to `select` — consistent with Excalidraw's workflow

### Zoom Isolation

- **Browser pinch-zoom blocked** via `viewport` export in `layout.tsx` (`maximum-scale=1, user-scalable=no`)
- **Ctrl+scroll blocked** via `usePreventBrowserZoom` hook (non-passive `document.wheel` listener)
- **Canvas wheel handler moved to native listener** (`canvas.addEventListener("wheel", h, { passive: false })`): React attaches `onWheel` as passive since React 17, making `e.preventDefault()` a silent no-op. Moving to a native listener fixes the "Unable to preventDefault inside passive event listener" console error.

### Bug Fixes

| Bug | Root cause | Fix |
|-----|-----------|-----|
| React hydration mismatch on theme | Anti-FOUC script adds `data-theme` to `<html>` before React hydrates; React's VDOM had no record of this attribute | `suppressHydrationWarning` on `<html>` in `layout.tsx` |
| `useTheme` causing hydration mismatch | `useState` lazy initializer read `localStorage` on client but not server → different initial HTML | Replaced with `useSyncExternalStore` + `getServerSnapshot = () => "dark"` |
| Canvas showed page background on load | `<canvas>` element has no CSS background; `Renderer.render()` fires via RAF which hasn't run yet | Added `style={{ background: 'var(--canvas-bg)' }}` to the canvas wrapper div |
| Mobile canvas shrank when shape selected | `MobilePropertiesPanel` was in the normal flex document flow — growing when a popup opened compressed the canvas | Moved inside `MobileToolbar` as `absolute bottom-full` overlay; doesn't affect layout |
| Undo/redo overlapped properties bar on mobile | Both were at the same absolute offset from the toolbar wrapper | Integrated undo/redo into the nav bar as a permanent right-side group |
| "Unable to preventDefault inside passive event listener" on pinch-zoom | React attaches `onWheel` as passive since React 17 | Replaced with native `addEventListener("wheel", h, { passive: false })` in `useEffect` |

---

## Tech Stack

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 16 | App framework (App Router, static export) |
| React | 19 | UI component model |
| TypeScript | 5.8 | Type safety, strict mode |
| Zustand | 5 | State management + history |
| Tailwind CSS | 4 | Styling and design tokens (via `@theme {}` in `globals.css`) |
| Lucide React | 0.577 | Icon set |
| Jest | 30 | Unit testing |
| Playwright | 1.50 | End-to-end testing |
| Node.js | 22 | Runtime (CI uses Node 22) |
