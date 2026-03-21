# Drawing Board — Progress Log

_Single source of truth for resuming work. Read this before starting any session._

---

## Current Status: Phase 2 — Drawing Tools (Refinement) 🔄

**Last updated**: 2026-03-21

---

## Completed Tasks

### Phase 1.1 — Project Scaffold ✅
- `package.json` with all dependencies (Next.js 14, Zustand, Lucide React, Jest, Playwright)
- `tsconfig.json` — strict TypeScript mode, path aliases (`@/*`)
- `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`
- `jest.config.ts`, `jest.setup.ts`

### Phase 1.2 — Type System ✅
- `src/types/index.ts` — All element types (`WhiteboardElement` union), `Point`, `BoundingBox`, `ToolType`
- `src/store/types.ts` — `CanvasState`, `CanvasActions`, `HistoryState`
- `src/utils/constants.ts` — All magic values centralized

### Phase 1.3 — State Management ✅
- `src/store/canvasStore.ts` — Zustand store with:
  - `addElement`, `updateElement`, `deleteElements`
  - `selectElements`, `clearSelection`
  - `undo` / `redo` with history up to 100 steps
  - `setZoom`, `setPanOffset`
  - `clearCanvas`
- `src/store/canvasStore.test.ts` — Full unit test coverage

### Phase 1.4 — Core Element Factory ✅
- `src/core/elements/createElement.ts` — Factory function for all element types
- `src/core/elements/createElement.test.ts` — Unit tests (all types, unique IDs, timestamps)

### Phase 1.5 — Rendering Engine ✅
- `src/core/renderer/drawElement.ts` — Draws all element types to `CanvasRenderingContext2D`
  - Rectangle (with `roundRect`), Ellipse, Line, Arrow (with head), Freehand, Text
  - Selection overlay (dashed violet border)
- `src/core/renderer/Renderer.ts` — Scene renderer with:
  - Background fill + dot grid
  - Pan/zoom transform
  - Export mode (no grid)

### Phase 1.6 — Canvas Hooks ✅
- `src/hooks/useCanvas.ts` — Pointer-based drawing interaction
  - Works with mouse AND touch (pointer events)
  - Drawing state machine (down → move → up)
  - Scroll-to-zoom with mouse-position anchor
  - Alt-drag / middle-button pan
- `src/hooks/useWindowSize.ts` — Debounced responsive resize hook
- `src/hooks/useKeyboardShortcuts.ts` — Keyboard shortcuts (Ctrl+Z, tools, delete)

### Phase 1.7 — UI Components ✅
- `src/components/canvas/Canvas.tsx` — Full canvas with `ResizeObserver`, RAF render loop, DPR scaling
- `src/components/toolbar/ToolButton.tsx` — Animated tool button (hover tooltip, active glow)
- `src/components/toolbar/ToolbarButtons.tsx` — Shared buttons (vertical/horizontal orientation)
- `src/components/header/Header.tsx` — Zoom controls, logo, export button

### Phase 1.8 — App Layout ✅
- `src/app/globals.css` — Atelier Dark design system (variables, grain overlay, font config)
- `src/app/layout.tsx` — Root layout with Fraunces + DM Sans + JetBrains Mono fonts
- `src/app/page.tsx` — Full-screen drawing board (desktop sidebar + mobile bottom bar)

---

## Design System — "Atelier Dark"

| Token | Value | Usage |
|-------|-------|-------|
| `atelier-bg` | `#0B0A14` | Workspace background |
| `atelier-surface` | `#15141F` | Toolbar, header |
| `atelier-canvas` | `#FAF9F6` | Drawing canvas (warm cream) |
| `atelier-accent` | `#8B5CF6` | Active tool, selection |
| `atelier-text` | `#EAE8F5` | Primary text |
| `atelier-muted` | `#6B6884` | Secondary text |

Fonts: **Fraunces** (display) · **DM Sans** (UI) · **JetBrains Mono** (code/numbers)

---

## Bug Fixes Applied (2026-03-20)

- **Coordinate fix**: Removed erroneous DPR multiplication in `getCanvasPoint` — coordinates were off by 2× on retina screens
- **Select tool**: Implemented hit testing (`src/core/collision/hitTest.ts`) — click to select elements, drag to move them
- **Pan/Hand tool**: Added `pan` ToolType + Hand icon in toolbar (key `H`); Space+drag works as temporary pan in any mode
- **Text tool**: Text click-to-place now shows an editable `<textarea>` overlay positioned over canvas; Enter commits, Escape cancels
- **Export PNG**: Implemented `exportAsPNG` and `copyToClipboard` in `src/utils/export.ts`; Header Export button now has a dropdown menu
- **Arrow/Line rendering**: Was working once coordinates were fixed
- **Cursor**: Mapped per-tool: select→default, pan→grab, text→text, drawing tools→crosshair

## Feature Update (2026-03-20) — Excalidraw parity pass

### Marquee Selection (rubber-band)
- Select tool + drag on empty space → draws a dashed selection rect
- On mouseUp: selects all elements whose bounding boxes intersect the rect
- Visible as purple dashed rect with semi-transparent fill (drawn in Renderer)

### Multi-select
- Ctrl/Meta/Shift + click → toggles individual elements in/out of selection
- Ctrl+A → selects ALL elements
- Escape → clears selection
- Moving ANY selected element moves ALL of them simultaneously

### Arrow Snap + Binding
- When drawing arrows, endpoint snaps to the center of nearby shapes (within 28px)
- Binding stored as `endBinding: { elementId }` in ArrowElement
- Moving a shape updates all arrows bound to it

### Properties Panel
- Appears on left side of canvas when elements are selected (`src/components/properties/PropertiesPanel.tsx`)
- Stroke color (6 presets: black, dark, red, green, blue, orange)
- Background/fill color (6 presets + transparent with checkerboard)
- Stroke width (thin/normal/bold)
- Stroke style (solid/dashed/dotted) — `strokeStyle: StrokeStyle` added to BaseElement
- Changes apply to ALL selected elements simultaneously

### Text Tool Fix
- Textarea overlay now uses document-level `mousedown` for click-outside detection (more reliable than onBlur)
- `onPointerDown: e.stopPropagation()` prevents canvas from stealing events
- White semi-transparent background + violet border for high visibility
- `autoFocus`-equivalent via `useEffect` focus call
- Auto-grows height as user types
- Enter commits, Escape cancels, click-outside commits

### Keyboard Changes
- Ctrl+A = Select All (was: clear canvas)
- Ctrl+Shift+Delete = Clear Canvas
- Escape = Deselect all

## Feature Update (2026-03-20) — Phase 2 Refinement Pass

### Tool Reorder + Number Shortcuts
- Toolbar order: Hand(H) → Select(1) → Rectangle(2) → Diamond(3) → Ellipse(4) → Arrow(5) → Line(6) → Freehand(P) → Text(7)
- Legacy letter shortcuts retained (V/R/E/L/A/T still work)
- Redo changed from Ctrl+Shift+Z → **Ctrl+R**

### Diamond Element
- New `DiamondElement` type (rhombus shape) in `src/types/index.ts`
- Rendering via `drawDiamond()` in `drawElement.ts` — clean and sloppy variants
- Hit testing via rhombus formula: `|px-cx|/(w/2) + |py-cy|/(h/2) <= 1`
- Factory in `createElement.ts`

### Stroke Sloppiness (3 levels)
- `sloppiness: 0 | 1 | 2` added to `BaseElement` and `ElementStyleUpdate`
- `src/core/renderer/sloppiness.ts` — seeded deterministic RNG + `drawSloppySegment` + `drawSloppyEllipse`
- Level 0 = clean; Level 1 = sketch (single bezier jitter); Level 2 = rough (double pass)
- Applies to Rectangle, Diamond, Ellipse, Line, Arrow
- Properties panel: new **Sloppiness** section with 3 icon buttons

### Arrow Midpoint Bending
- `midPoint: Point | null` added to `ArrowElement`
- Arrow renders as quadratic bezier when `midPoint` is set
- Dragging the purple bend handle (◉ midpoint) in select mode sets `midPoint`
- `src/core/collision/arrowHandles.ts` — handle hit detection and midpoint calculation

### Arrow Endpoint Resize Handles
- White circle handles shown at `(x,y)` and `(x2,y2)` when arrow is selected
- Dragging endpoint re-snaps to nearby shapes (within 28px) or disconnects binding
- `"resizing-arrow"` interaction mode in `useCanvas.ts`

### Arrow Both-End Binding
- Drawing an arrow from a shape center now stores `startBinding`
- Both start and end bindings update when bound shapes move

### Line vs Arrow Differentiation
- Arrow: snaps both endpoints to shape centers, stores bindings
- Line: no snapping, no binding (plain line segment)

### Hand Cursor Improvements
- `isPanning` exposed from `useCanvas`
- Cursor shows `grab` when pan tool active, `grabbing` while actively panning

### Text Double-Click Re-edit
- Double-click on a text element in select mode reopens the textarea overlay
- `initialContent` pre-fills the textarea with existing text
- `cancelText` only deletes the element if it was newly created (not re-edited)

## Bug Fixes (2026-03-21)

### Stale-closure arrow binding bug fixed
- `handlePointerMove` now calls `useCanvasStore.getState()` on every frame instead of relying on the closure-captured `elements`/`selectedIds`
- Root cause: multiple pointer events fire between React renders; old approach computed `el.x + dx` from the ORIGINAL position each frame, causing shapes to snap back
- `moveBoundArrows()` extracted as a pure function; computes binding point from the shape's actual center (not `arrow.x + dx`)

### `getTranslation` now includes `midPoint` for arrows
- Moving a bent arrow now also translates the bend handle

### Keyboard shortcuts corrected
- New numbering: H=pan, 1=select, 2=rect, 3=diamond, 4=ellipse, 5=arrow, 6=line, 7=freehand, 8=text
- ALL old letter shortcuts removed (v/r/e/l/a/t/p no longer work)
- Redo: Ctrl+R (also Ctrl+Y)

## Feature Update (2026-03-21) — Resize + Arrow Snap + Safari Text

### Resize Handles
- 8 resize handles (nw/n/ne/w/e/sw/s/se) drawn on all selected non-linear elements
- New file: `src/core/collision/resizeHandles.ts` — hit detection, resize math, freehand point scaling
- `applyResize` computes from the ORIGINAL element bounds + total delta (no stale drift)
- `applyFreehandResize` scales all freehand points proportionally within new bounding box
- Hover cursor changes to appropriate resize cursor (nwse-resize, ns-resize, etc.)
- Lines show dashed selection outline only (no resize handles — endpoint handles planned)
- New `"resizing"` interaction mode in `useCanvas.ts`

### Arrow Snap Fix
- Was: snap only when endpoint within 28px of shape CENTER
- Now: snap when endpoint is anywhere INSIDE the shape bounding box (+ 8px padding)
- Large shapes now work correctly — no need to drag arrow to the shape's center

### Safari Text Tool Fix
- Replaced programmatic `focus()` in `useEffect` with `autoFocus` attribute (works sync in Safari)
- Replaced `mousedown` outside-click listener with `pointerdown` (works on iOS/Safari)
- Added 100ms delay before registering outside-click listener to avoid catching the creating tap

## Feature Update (2026-03-21) — Arrow Border Snap + Text Wrapping

### Arrow Border Snap (true Excalidraw parity)
- Arrows now connect at the **exact shape border**, not the center
- `shapeBorderPoint(el, fromX, fromY)` in `useCanvas.ts` computes border intersection per shape type:
  - Rectangle: AABB ray — `t = min(hw/|dx|, hh/|dy|)`
  - Ellipse: parametric — `t = 1/sqrt(dx²/hw² + dy²/hh²)`
  - Diamond: absolute-value norm — `t = 1/(|dx|/hw + |dy|/hh)`
- `findSnapPoint` now accepts `fromX?, fromY?` and returns border point facing the from direction
- Drawing an arrow: end snaps to border facing the start point
- Start snap (pointer down): border nearest to click position
- `moveBoundArrows`: recomputes border points using the arrow's OTHER endpoint as direction (not center)
- `resizing-arrow` mode: passes other endpoint as from for correct border reconnect

### Text Wrapping
- `wrapText(ctx, text, maxWidth)` in `drawElement.ts` — paragraph-aware line wrapping using `measureText`
- `drawText` wraps at `el.width` when width > 60 — supports both single-line and multi-line
- `TextEditState.width` added — when re-editing a resized text element, textarea constrains to element width
- `commitText` preserves existing element width when re-editing (no auto-resize override)
- `handleDoubleClick` passes `textEl.width` to `TextEditState` when > 60

## Documentation + Deployment (2026-03-21)

- `README.md` — comprehensive documentation: architecture, shape data model, arrow binding math, folder structure, all config files, extending guide, keyboard shortcuts, production notes, GitHub Pages deployment steps
- `next.config.mjs` — configured for static export (`output: "export"`, `trailingSlash: true`, `images.unoptimized: true`, `basePath` via `NEXT_PUBLIC_BASE_PATH` env var)
- `.github/workflows/deploy.yml` — GitHub Actions workflow: type-check → lint → test → build → deploy to GitHub Pages on every push to `main`
- Static build verified: `npm run build` produces clean `/out` directory

**To deploy to GitHub Pages:**
1. Repo Settings → Pages → Source → GitHub Actions
2. Add repository variable `PAGES_BASE_PATH = /your-repo-name` (Settings → Secrets → Variables)
3. Push to `main` — the Actions workflow handles the rest

## Dependency Upgrade (2026-03-21) — Full Stack to Latest

- **Next.js 14 → 16**, **React 18 → 19**, **Tailwind CSS 3 → 4**, **Zustand 4 → 5**, **ESLint 8 → 9**, **Jest 29 → 30**, **Node CI 20 → 22**
- Tailwind v4: `tailwind.config.ts` deleted; all design tokens moved to `@theme {}` in `globals.css`; `@tailwindcss/postcss` replaces `tailwindcss` + `autoprefixer` in `postcss.config.mjs`
- React 19: `RefObject<T>` → `RefObject<T | null>` in `useCanvas.ts`; generic event types now require `React.` prefix
- Zustand 5: `create<T>()(...)` curried form required for TypeScript
- ESLint 9 flat config: `eslint.config.mjs` with native `eslint-config-next` array exports; `lint` script changed to `eslint src/`
- GitHub Actions: `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` env; `node-version: 22`

## Bug Fix (2026-03-21) — Full UI Layout Regression (Root Cause Found)

### Root cause
In Tailwind v4, all utility classes live in `@layer utilities`. CSS Cascade Layers give **unlayered styles higher priority than any `@layer`** regardless of specificity. The `*,*::before,*::after { margin: 0; padding: 0 }` reset in `globals.css` was NOT in any layer → it silently overrode every Tailwind margin/padding utility across the entire app.

- `p-4` (panel padding), `mb-4` (section spacing), `px-*`, `py-*`, `gap-*` for flex/grid → all overridden to 0
- This broke PropertiesPanel layout, Export dropdown spacing, tooltip padding, and all button padding
- The bug was invisible in v3 because Tailwind v3 did NOT use CSS layers; class specificity (0,1,0) correctly beat the universal selector (0,0,0)

### Fix
Removed the duplicate `*, *::before, *::after { box-sizing; margin; padding }` block from `globals.css`. Tailwind v4's `@layer base` already provides this exact reset, and being in a layer, it is correctly overridden by `@layer utilities` classes.

### Also fixed
- Swatch containers changed from `flex gap-1.5 flex-wrap` to `grid grid-cols-5 gap-1.5` for explicit 5-per-row layout

## Feature Update (2026-03-21) — UI Redesign Pass

### New Color Theme: Atelier Light/Dark
- Dark mode: Eerie Black `#1B1B1B` bg, `#252525` surface, Soft Cyan `#90E0EF` accent
- Light mode: White Picket Fence `#F0EFEB` bg, `#FFFFFF` surface, Deep Cyan `#0891B2` accent
- Added theme-aware CSS variables: `--color-atelier-border`, `--color-atelier-overlay`
- Updated `globals.css` `@theme {}` + `html[data-theme="light"]` overrides
- All selection/handle colors updated: `#06B6D4` → `#90E0EF` in renderers + Canvas

### Light/Dark Mode Toggle
- `src/hooks/useTheme.ts` — NEW: localStorage persistence, `data-theme` attribute on `<html>`
- Anti-FOUC inline script in `src/app/layout.tsx` reads localStorage before React hydration
- Toggle button (Sun/Moon icon) added to header beside Export button

### New Logo Component
- `src/components/common/Logo.tsx` — NEW: Inline SVG from `docs/logo.svg`
- Header: shows Logo + "DrawBoard" text on desktop, logo-only on mobile

### Collapsible Desktop Toolbar (WebToolbar)
- `src/components/toolbar/WebToolbar.tsx` — NEW: floating vertical sidebar, left side of canvas
- Collapse/expand via PanelLeftClose/PanelLeftOpen icon button
- Replaces old fixed sidebar in `page.tsx`

### Excalidraw-style Mobile Toolbar (MobileToolbar)
- `src/components/toolbar/MobileToolbar.tsx` — NEW: bottom sheet, 7 tool buttons
- Combo buttons: Shapes (rect/diamond/ellipse), Strokes (freehand/line) — shows last-used icon
- Sub-menu popup appears above toolbar for combo buttons
- Eraser button: deletes currently selected elements
- Undo/Redo floating above bottom-right corner
- No keyboard shortcut labels (mobile-specific UX)

### Auto-switch to Select After Drawing
- `src/hooks/useCanvas.ts`: after `addElement(el)` when element is meaningful, calls `setTool("select")`
- Applies in both `handlePointerUp` and `handlePointerLeave`

### Mobile PNG Export Fix
- `src/utils/export.ts`: replaced `canvas.toBlob()` + `URL.createObjectURL()` with
  `canvas.toDataURL()` + `document.body.appendChild(a)` — reliable on iOS/Safari

### Mobile Export Button
- Header Export button shows icon-only on mobile, full "Export" label on desktop
- Both trigger the same dropdown menu (Save as PNG / Copy to clipboard)

## Bug Fix (2026-03-21) — Hydration, Canvas Flash, Mobile Layout, Properties Position

### Hydration mismatch (root cause found)
Anti-FOUC `<script>` in layout sets `data-theme` on `<html>` before React hydrates.
React's VDOM has no knowledge of this attribute → hydration error.
Fix: `suppressHydrationWarning` on `<html>` in `layout.tsx`.

### Canvas background flash / "blocked by theme color"
The HTML `<canvas>` element has no CSS background — transparent before first RAF frame renders.
Behind it, the page background (`var(--bg)`) was visible: black in dark mode, cream in light.
Fix: `style={{ background: 'var(--canvas-bg)' }}` on the canvas wrapper div in `Canvas.tsx`.

### Mobile: properties panel blocking canvas + undo/redo clash
- `MobilePropertiesPanel` was in the normal flex document flow → grew when popup opened → shrank canvas
- Undo/redo at `absolute -top-14` overlapped `MobilePropertiesPanel`
Fix:
- Removed `MobilePropertiesPanel` from `page.tsx` outer flex column
- Moved it INSIDE `MobileToolbar` as `absolute bottom-full` overlay → doesn't affect layout flow
- Integrated undo/redo INTO the nav bar (right side with separator) → no overlap possible

### Web: properties panel now appears adjacent to selected element
Previously fixed at `left-[72px] top-3` (far from shapes on right side of canvas).
Now: `computePosition()` converts the selected element's world-space bounds to screen coords
and places the panel to the right of the element (falls back to left, then near toolbar if no room).
Clamps vertically to stay within viewport.

## Feature Update (2026-03-21) — Layout & Label Pass

### Hydration fix (useTheme)
- Replaced `useState` + `useEffect` (caused React hydration mismatch + lint error) with `useSyncExternalStore`
- Server/hydration uses `getServerSnapshot()` = "dark"; after hydration switches to actual localStorage value
- Theme changes dispatch a custom `theme-change` window event so all instances stay in sync

### Header & toolbar heights = 57px
- `Header.tsx`: `h-12` → `h-[57px]`
- `MobileToolbar.tsx`: nav `py-1.5` → `h-[57px]` explicit height

### Web: Properties panel no longer overlaps toolbar
- Repositioned from `left-3` to `left-[72px]` (clears the ~60px wide floating WebToolbar)
- Hidden on mobile via `hidden md:block` wrapper in `page.tsx`

### Mobile: Compact collapsible properties panel
- `src/components/properties/MobilePropertiesPanel.tsx` — NEW
- Appears above mobile toolbar when elements are selected
- Compact bar: Stroke color dot / Fill color square / Width icon / Style icon
- Tapping each opens a popup panel above with full color/width/style options
- Popups dismiss after selection

### Double-click labels on shapes
- `src/types/index.ts`: Added `label?: string` to `BaseElement`
- `src/core/renderer/drawElement.ts`: `drawShapeLabel()` renders label centered inside shapes; on line/arrow at midpoint with white background pill
- `src/hooks/useCanvas.ts`: Extended `TextEditState` with `mode: "text" | "label"`; `handleDoubleClick` now opens label editor on rect/diamond/ellipse/arrow/line; `commitText` branches on mode — label mode updates `label` field, never deletes the element on empty; `cancelText` only deletes for mode="text"
- `TextOverlay` in `Canvas.tsx` is reused for labels — positioned at shape center approximation

### page.tsx restructure
- PropertiesPanel: web-only inside `hidden md:block`
- MobilePropertiesPanel + MobileToolbar: stacked in `md:hidden flex-col` wrapper

## Next Task: Phase 2.1 — Freehand Smoothing
- Implement Catmull-Rom spline smoothing in `drawElement.ts` for freehand paths
- Add `src/core/renderer/smoothPath.ts` utility

---

## Keyboard Shortcuts Reference

| Key | Action |
|-----|--------|
| `H` | Pan tool |
| `1` | Select tool |
| `2` | Rectangle |
| `3` | Diamond |
| `4` | Ellipse |
| `5` | Arrow |
| `6` | Line |
| `7` | Freehand |
| `8` | Text |
| `Ctrl+Z` | Undo |
| `Ctrl+R` / `Ctrl+Y` | Redo |
| `Ctrl+A` | Select all |
| `Ctrl+Shift+Delete` | Clear canvas |
| `Delete/Backspace` | Delete selected |
| `Escape` | Deselect all |
| `Scroll` | Zoom in/out |
| `Space+Drag` | Pan canvas (any mode) |

---

## Setup Instructions

```bash
cd drawing-board
npm install
npm run dev       # http://localhost:3000
npm test          # Unit tests
npm run type-check
npm run lint
```

> **Note**: Run `npm install` first — no `node_modules` present yet.
