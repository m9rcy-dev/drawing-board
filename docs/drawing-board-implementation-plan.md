# Simple Drawing Whiteboard - Implementation Plan

## Project Overview

A lightweight, mobile-friendly whiteboard application inspired by Excalidraw, built with React/Next.js following clean code principles with comprehensive test coverage.

---

## Non-Negotiables Checklist

| Requirement | Approach |
|-------------|----------|
| Clean Code Principles | SOLID, DRY, separation of concerns, meaningful naming, small functions |
| Unit & Integration Tests | Jest + React Testing Library + Playwright for E2E |
| Mobile Friendly | Touch gestures, responsive canvas, mobile-first CSS |
| React/Next.js | Next.js 14+ with App Router, React 18+ |

---

## Tech Stack

### Core
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand (lightweight, simple API)
- **Canvas Rendering**: HTML5 Canvas API + custom rendering engine

### Styling
- **CSS**: Tailwind CSS (utility-first, mobile-friendly)
- **Icons**: Lucide React (SVG icons)

### Testing
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Jest + MSW (API mocking)
- **E2E Tests**: Playwright
- **Coverage Target**: 80%+

### Code Quality
- **Linting**: ESLint (strict config)
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged

---

## Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                   # UI Components
│   ├── canvas/
│   │   ├── Canvas.tsx            # Main canvas component
│   │   ├── Canvas.test.tsx
│   │   └── index.ts
│   ├── toolbar/
│   │   ├── Toolbar.tsx           # Tool selection bar
│   │   ├── ToolButton.tsx
│   │   ├── Toolbar.test.tsx
│   │   └── index.ts
│   ├── properties/
│   │   ├── PropertiesPanel.tsx   # Element properties
│   │   └── index.ts
│   └── ui/                       # Shared UI components
│       ├── Button.tsx
│       ├── ColorPicker.tsx
│       └── index.ts
├── core/                         # Core business logic
│   ├── elements/
│   │   ├── types.ts              # Element type definitions
│   │   ├── createElement.ts      # Factory function
│   │   ├── createElement.test.ts
│   │   ├── Rectangle.ts
│   │   ├── Ellipse.ts
│   │   ├── Line.ts
│   │   ├── Arrow.ts
│   │   ├── Text.ts
│   │   └── Freehand.ts
│   ├── renderer/
│   │   ├── Renderer.ts           # Canvas rendering engine
│   │   ├── Renderer.test.ts
│   │   ├── drawElement.ts
│   │   └── drawElement.test.ts
│   ├── history/
│   │   ├── History.ts            # Undo/Redo manager
│   │   └── History.test.ts
│   └── collision/
│       ├── hitTest.ts            # Element selection
│       └── hitTest.test.ts
├── hooks/                        # Custom React hooks
│   ├── useCanvas.ts              # Canvas interaction logic
│   ├── useCanvas.test.ts
│   ├── useTouchGestures.ts       # Mobile touch handling
│   ├── useKeyboardShortcuts.ts
│   └── useWindowSize.ts
├── store/                        # State management
│   ├── canvasStore.ts            # Zustand store
│   ├── canvasStore.test.ts
│   └── types.ts
├── utils/                        # Utility functions
│   ├── geometry.ts               # Math utilities
│   ├── geometry.test.ts
│   ├── export.ts                 # Export functionality
│   └── constants.ts
└── types/                        # Global type definitions
    └── index.ts
```

### Clean Code Principles Applied

#### 1. Single Responsibility Principle (SRP)
Each module has one clear purpose:
- `Renderer.ts` - Only handles drawing to canvas
- `History.ts` - Only manages undo/redo stack
- `hitTest.ts` - Only handles collision detection

#### 2. Open/Closed Principle (OCP)
Element system is extensible without modification:
```typescript
// Base interface - closed for modification
interface DrawableElement {
  id: string;
  type: ElementType;
  draw(ctx: CanvasRenderingContext2D): void;
}

// Open for extension - add new shapes easily
class Diamond implements DrawableElement { ... }
```

#### 3. Dependency Inversion
Components depend on abstractions, not concrete implementations:
```typescript
// Hook depends on abstract store interface
const useCanvas = (store: CanvasStore) => { ... }
```

---

## Core Features (MVP)

### Phase 1: Foundation
- [ ] Project setup (Next.js, TypeScript, Tailwind)
- [ ] Canvas component with responsive sizing
- [ ] Basic rendering engine
- [ ] State management setup

### Phase 2: Drawing Tools
- [ ] Rectangle tool
- [ ] Ellipse/Circle tool
- [ ] Line tool
- [ ] Arrow tool
- [ ] Freehand/Pencil tool
- [ ] Text tool

### Phase 3: Interactions
- [ ] Element selection (click)
- [ ] Element movement (drag)
- [ ] Element resizing (handles)
- [ ] Multi-select (shift+click or box select)
- [ ] Delete elements (backspace/delete)

### Phase 4: Canvas Controls
- [ ] Pan (drag with space or middle mouse)
- [ ] Zoom (scroll wheel, pinch on mobile)
- [ ] Fit to screen

### Phase 5: Element Properties
- [ ] Stroke color
- [ ] Fill color
- [ ] Stroke width
- [ ] Opacity

### Phase 6: History
- [ ] Undo (Ctrl+Z)
- [ ] Redo (Ctrl+Shift+Z)

### Phase 7: Export
- [ ] Export as PNG
- [ ] Export as SVG
- [ ] Copy to clipboard

---

## Mobile-Friendly Implementation

### Touch Gesture Mapping

| Desktop Action | Mobile Gesture |
|----------------|----------------|
| Click | Tap |
| Drag | Touch drag |
| Right-click menu | Long press |
| Scroll zoom | Pinch to zoom |
| Pan (space+drag) | Two-finger drag |
| Shift+click multi-select | Toggle select mode |

### Responsive Design Strategy

```typescript
// hooks/useWindowSize.ts
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    // Debounced resize handler
  }, []);

  return size;
};
```

### Mobile UI Adaptations
- **Collapsible toolbar**: Bottom sheet on mobile, sidebar on desktop
- **Touch-friendly buttons**: Minimum 44x44px touch targets
- **Gesture hints**: Visual indicators for available gestures
- **Viewport lock**: Prevent accidental page scroll/zoom

```css
/* Prevent mobile browser zoom on double-tap */
touch-action: manipulation;

/* Lock viewport */
html, body {
  overflow: hidden;
  overscroll-behavior: none;
}
```

---

## Data Models

### Element Types

```typescript
// types/index.ts
type ElementType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'text'
  | 'freehand';

interface Point {
  x: number;
  y: number;
}

interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  isSelected: boolean;
}

interface RectangleElement extends BaseElement {
  type: 'rectangle';
  borderRadius: number;
}

interface FreehandElement extends BaseElement {
  type: 'freehand';
  points: Point[];
}

type WhiteboardElement =
  | RectangleElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | TextElement
  | FreehandElement;
```

### Canvas State

```typescript
// store/types.ts
interface CanvasState {
  elements: WhiteboardElement[];
  selectedIds: Set<string>;
  activeTool: ToolType;
  zoom: number;
  panOffset: Point;
  history: HistoryState;
}

interface CanvasActions {
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  deleteElements: (ids: string[]) => void;
  selectElements: (ids: string[]) => void;
  setTool: (tool: ToolType) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
  setPan: (offset: Point) => void;
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// core/elements/createElement.test.ts
describe('createElement', () => {
  it('creates rectangle with default properties', () => {
    const rect = createElement('rectangle', { x: 0, y: 0 });

    expect(rect.type).toBe('rectangle');
    expect(rect.id).toBeDefined();
    expect(rect.strokeColor).toBe('#000000');
  });

  it('applies custom properties', () => {
    const rect = createElement('rectangle', {
      x: 10,
      y: 20,
      strokeColor: '#ff0000'
    });

    expect(rect.x).toBe(10);
    expect(rect.strokeColor).toBe('#ff0000');
  });
});
```

### Integration Tests

```typescript
// components/canvas/Canvas.integration.test.tsx
describe('Canvas Integration', () => {
  it('creates element on mouse drag', async () => {
    render(<Canvas />);
    const canvas = screen.getByTestId('whiteboard-canvas');

    // Select rectangle tool
    fireEvent.click(screen.getByLabelText('Rectangle tool'));

    // Draw rectangle
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);

    // Verify element created
    const store = useCanvasStore.getState();
    expect(store.elements).toHaveLength(1);
    expect(store.elements[0].type).toBe('rectangle');
  });

  it('supports undo/redo flow', async () => {
    // ... test undo/redo integration
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/drawing.spec.ts
test('complete drawing workflow', async ({ page }) => {
  await page.goto('/');

  // Draw a rectangle
  await page.click('[data-tool="rectangle"]');
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(300, 300);
  await page.mouse.up();

  // Verify rectangle exists
  const elements = await page.evaluate(() =>
    window.__CANVAS_STATE__.elements
  );
  expect(elements.length).toBe(1);

  // Export as PNG
  await page.click('[data-action="export-png"]');
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.png');
});
```

### Test Coverage Requirements

| Category | Target |
|----------|--------|
| Core logic (elements, renderer, history) | 90%+ |
| Hooks | 85%+ |
| Components | 80%+ |
| Utils | 95%+ |
| Overall | 80%+ |

---

## Implementation Timeline

### Week 1: Foundation
- Day 1-2: Project setup, tooling, CI/CD
- Day 3-4: Canvas component, basic rendering
- Day 5: State management, element types

### Week 2: Drawing Tools
- Day 1-2: Rectangle, ellipse implementation + tests
- Day 3-4: Line, arrow, freehand + tests
- Day 5: Text tool + tests

### Week 3: Interactions
- Day 1-2: Selection, movement, resizing
- Day 3: Multi-select, deletion
- Day 4-5: Pan, zoom, mobile gestures

### Week 4: Polish & Testing
- Day 1-2: Properties panel, colors, stroke width
- Day 3: History (undo/redo)
- Day 4: Export functionality
- Day 5: E2E tests, bug fixes, documentation

---

## Code Quality Checklist

### Before Each PR
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Test coverage maintained (`npm run test:coverage`)
- [ ] Mobile responsiveness verified
- [ ] Touch interactions tested

### Code Review Criteria
- [ ] Functions < 20 lines (ideally)
- [ ] Clear, descriptive naming
- [ ] No magic numbers (use constants)
- [ ] Proper error handling
- [ ] JSDoc comments for public APIs
- [ ] Unit tests for new logic

---

## Performance Considerations

### Canvas Optimization
- Use `requestAnimationFrame` for smooth rendering
- Implement dirty rectangle tracking (only redraw changed areas)
- Use `OffscreenCanvas` for complex operations
- Debounce resize handlers

### React Optimization
- Memoize expensive computations with `useMemo`
- Use `React.memo` for pure components
- Avoid re-renders with proper dependency arrays
- Virtualize element lists if needed

### Mobile Performance
- Throttle touch move events
- Use passive event listeners
- Reduce canvas resolution on low-power devices
- Implement level-of-detail rendering during pan/zoom

---

## Future Enhancements (Post-MVP)

- [ ] Collaboration (real-time sync)
- [ ] Local storage persistence
- [ ] Shape libraries
- [ ] Grid snapping
- [ ] Alignment guides
- [ ] Layers panel
- [ ] Dark mode
- [ ] Keyboard shortcuts help overlay

---

## Getting Started

```bash
# Create project
npx create-next-app@latest drawing-board --typescript --tailwind --app

# Install dependencies
npm install zustand lucide-react

# Install dev dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
npm install -D husky lint-staged

# Run development server
npm run dev

# Run tests
npm test
npm run test:e2e
```

---

## Success Criteria

1. **Functional**: All MVP features work on desktop and mobile
2. **Quality**: 80%+ test coverage, zero critical bugs
3. **Performance**: 60fps rendering, < 100ms interaction response
4. **Accessibility**: Keyboard navigable, screen reader friendly
5. **Code**: Passes all linting, follows clean code principles
