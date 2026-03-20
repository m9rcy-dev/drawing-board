# Drawboard — Simple Whiteboard

A lightweight, production-grade collaborative whiteboard built with Next.js 16, TypeScript, and HTML5 Canvas. Draw shapes, connect them with smart arrows, write text, and export your work as PNG.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [How It Works — Architecture Overview](#how-it-works--architecture-overview)
3. [How Shapes Are Structured](#how-shapes-are-structured)
4. [How Arrows Link Shapes](#how-arrows-link-shapes)
5. [File & Folder Structure](#file--folder-structure)
6. [Configuration Files Explained](#configuration-files-explained)
7. [Keyboard Shortcuts](#keyboard-shortcuts)
8. [Extending the App](#extending-the-app)
9. [Deploying to GitHub Pages](#deploying-to-github-pages)
10. [Production Readiness Notes](#production-readiness-notes)

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

Users can drag the purple midpoint handle to create a curved arrow:

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
│   │   │   ├── drawElement.ts    ← Draws a single element to ctx (switch on element.type)
│   │   │   └── sloppiness.ts     ← Seeded RNG + sloppy bezier drawing utilities
│   │   │
│   │   └── collision/
│   │       ├── hitTest.ts        ← Click-to-select: per-shape point-in-shape tests
│   │       ├── arrowHandles.ts   ← Arrow handle positions + hit detection (bend / endpoints)
│   │       └── resizeHandles.ts  ← 8-handle resize: positions, cursors, resize math
│   │
│   ├── hooks/
│   │   ├── useCanvas.ts          ← THE brain: all pointer interaction logic (draw, move, resize, pan...)
│   │   ├── useKeyboardShortcuts.ts ← Keyboard bindings (tool keys, undo/redo, delete, select-all)
│   │   └── useWindowSize.ts      ← Debounced window resize hook
│   │
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx        ← <canvas> element + ResizeObserver + RAF loop + text textarea overlay
│   │   │   └── index.ts          ← Re-export
│   │   │
│   │   ├── header/
│   │   │   └── Header.tsx        ← Top bar: logo, zoom controls, export dropdown
│   │   │
│   │   ├── toolbar/
│   │   │   ├── ToolButton.tsx    ← A single tool button (hover tooltip, active state, animation)
│   │   │   ├── ToolbarButtons.tsx ← Renders all tool buttons in vertical or horizontal orientation
│   │   │   └── index.ts          ← Re-export
│   │   │
│   │   └── properties/
│   │       └── PropertiesPanel.tsx ← Floating panel: stroke/fill/width/style/sloppiness controls
│   │
│   └── app/                      ← Next.js App Router
│       ├── layout.tsx            ← Root layout: fonts, metadata, <html> + <body>
│       ├── page.tsx              ← Main page: header + toolbar + canvas + properties panel
│       └── globals.css           ← CSS variables, reset, Tailwind base, grain overlay
│
├── docs/
│   └── progress.md               ← Session-by-session progress log. Read before starting work.
│
├── next.config.mjs               ← Next.js config (static export settings for GitHub Pages)
├── postcss.config.mjs            ← PostCSS config for Tailwind v4 (@tailwindcss/postcss)
├── tsconfig.json                 ← TypeScript strict mode, path alias @/* → src/*
├── jest.config.js                ← Jest config for ts-jest + jsdom
└── package.json                  ← Scripts and dependencies
```

### Where to find things quickly

| "I want to…" | Look in |
|---|---|
| Add a new element type | `src/types/index.ts` → `src/core/elements/createElement.ts` → `src/core/renderer/drawElement.ts` |
| Change how an element is drawn | `src/core/renderer/drawElement.ts` |
| Add a new tool | `src/types/index.ts` (ToolType) → `src/hooks/useKeyboardShortcuts.ts` → `src/components/toolbar/ToolbarButtons.tsx` → `src/hooks/useCanvas.ts` |
| Change a color or size constant | `src/utils/constants.ts` |
| Change the store (new action, new state) | `src/store/types.ts` → `src/store/canvasStore.ts` |
| Change how pointer/mouse interaction works | `src/hooks/useCanvas.ts` |
| Change the toolbar layout | `src/components/toolbar/ToolbarButtons.tsx` |
| Change the properties panel | `src/components/properties/PropertiesPanel.tsx` |
| Add a keyboard shortcut | `src/hooks/useKeyboardShortcuts.ts` |

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

### `src/app/globals.css` — Design system (Tailwind v4)

In Tailwind v4 there is no `tailwind.config.ts`. All design tokens live in the `@theme {}` block inside `globals.css`.

Defines the **Atelier Dark** design tokens:

| Token | Value | Used for |
|-------|-------|----------|
| `atelier-bg` | `#0B0A14` | Page background |
| `atelier-surface` | `#15141F` | Toolbar, header, panels |
| `atelier-canvas` | `#FAF9F6` | Drawing canvas (warm cream) |
| `atelier-accent` | `#8B5CF6` | Active tool, selection, handles |
| `atelier-text` | `#EAE8F5` | Primary text |
| `atelier-muted` | `#6B6884` | Labels, secondary text |

Fonts: **Fraunces** (display/logo) · **DM Sans** (UI) · **JetBrains Mono** (numbers/mono)

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
| `Scroll wheel` | Zoom in / out (anchored to cursor) |
| `Middle button + drag` | Pan |

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
// In hitTest() switch:
case "triangle":
  return isPointInRect(p, el.x, el.y, el.width, el.height, RECT_HIT_PADDING);
  // For more accurate hit testing, implement point-in-triangle math
```

**5. Add to toolbar** (`src/components/toolbar/ToolbarButtons.tsx`):
```typescript
{ tool: "triangle", icon: Triangle, label: "Triangle", shortcut: "9" }
```

**6. Add keyboard shortcut** (`src/hooks/useKeyboardShortcuts.ts`):
```typescript
const TOOL_KEYS: Record<string, ToolType> = {
  // ...existing...
  "9": "triangle",
};
```

**7. Add ToolType** (`src/types/index.ts`):
```typescript
export type ToolType = ... | "triangle";
```

That's it. The store, history, selection, and export all work automatically because they operate on `WhiteboardElement[]` generically.

### Adding a new property (e.g., corner rounding for all shapes)

1. Add `cornerRadius?: number` to `BaseElement` in `src/types/index.ts`
2. Set a default in `src/utils/constants.ts`
3. Apply it in each relevant `drawXxx()` function in `drawElement.ts`
4. Add a UI control to `PropertiesPanel.tsx`
5. Add `activeCornerRadius` state + `setActiveCornerRadius` action to the store

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
- **Stale-closure safety**: `useCanvasStore.getState()` inside event handlers avoids drift
- **Deterministic rendering**: Seeded RNG for sloppiness — elements look the same on every frame
- **Export**: PNG export and clipboard copy work correctly with proper DPR scaling

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
