## 🧠 Project Context

This project builds **Simple Drawing Whiteboard** with:

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Canvas Rendering**: HTML5 Canvas API + custom rendering engine
- **Styling**: Tailwind CSS + Lucide React icons
- **Testing**: Jest + React Testing Library + Playwright (E2E)
- **Code Quality**: ESLint + Prettier + Husky + lint-staged

Specifics are defined in `drawing-board-implementation-plan.md`

The system must be:

* Clean-code compliant
* Fully documented
* Fully testable
* Resume-friendly via `/docs/progress.md`

Claude must treat this as a **long-running production system**, not a demo.

---

# 🎯 Primary Objective

Deliver features in **small, complete, production-ready increments**.

Each increment MUST:

1. Compile
2. Pass tests
3. Be documented
4. Update progress log

Never leave partial implementations.

---

# ⚙️ Global Engineering Rules

## 1. Clean Code (Mandatory)

* Max 20 lines per function
* Max 3 levels of nesting
* Single responsibility per function
* No magic values — use `src/utils/constants.ts`
* Explicit naming
* Feature-based modular structure under `src/`
* No business logic in React components — delegate to hooks and core modules

If a solution violates these → refactor before continuing.

---

## 2. Type Safety

* No `any`
* Strict TypeScript mode
* Shared types defined in `src/types/index.ts` and `src/store/types.ts`

---

## 3. Testing Policy

Every feature must include:

### Core Logic

* Unit tests for `src/core/` modules (elements, renderer, history, collision)
* Coverage targets: 90%+ for core, 95%+ for utils

### Hooks

* Unit tests for custom hooks in `src/hooks/`
* Coverage target: 85%+

### Frontend

* Component tests for UI logic in `src/components/`
* Coverage target: 80%+

### E2E

* Playwright tests for complete user workflows in `e2e/`

No feature is complete without tests.

---

## 4. Documentation Policy

Each module must include:

README.md with:

* Purpose
* Public API
* Data flow
* Dependencies

System-level docs:

/docs/architecture.md

---

## 5. Progress Tracking (CRITICAL)

After EVERY change, Claude MUST update:

/docs/progress.md

This file is the **single source of truth for resuming work**.

Before starting new work:

Claude MUST read:

/docs/progress.md

to determine the next task.

---

# 🧭 Execution Workflow

## Step 0 — Resume Protocol

At the start of every session:

1. Read `/docs/progress.md`
2. Identify the next unfinished task
3. Continue from there

Never ask the user what to do next if it is defined in progress.md.

---

## Step 1 — Planning

For each task:

* Explain what will be implemented
* List affected files
* Keep scope minimal

---

## Step 2 — Implementation Order

Always follow:

1. Types (`src/types/`, `src/store/types.ts`)
2. Domain logic (`src/core/`)
3. State management (`src/store/`)
4. Hooks (`src/hooks/`)
5. Components (`src/components/`)
6. Tests
7. Documentation
8. Progress update

---

## Step 3 — Definition of Done

A task is complete only if:

* Build succeeds (`npm run build`)
* Tests pass (`npm test`)
* Lint passes (`npm run lint`)
* Type check passes (`npm run type-check`)
* Docs updated
* Progress updated

---

## Error Handling

Use a consistent error pattern for async operations:

```json
{
  "code": "STRING_CODE",
  "message": "Human readable",
  "details": {}
}
```

## Planning Rule

Before implementing a feature, Claude must:

1. Locate the relevant section in `drawing-board-implementation-plan.md`
2. Break it into the smallest complete task
3. Implement only that task

---

# 🎨 Frontend Rules

* Use **Next.js App Router** — no Pages Router patterns
* Canvas interaction logic lives in `src/hooks/useCanvas.ts`, not in components
* Element rendering logic lives in `src/core/renderer/` only
* Components must be pure and driven by Zustand store state
* Mobile-first CSS — all interactions must work on touch devices
* Minimum touch target size: 44×44px
* Use `touch-action: manipulation` to prevent accidental browser zoom
* Toolbar: bottom sheet on mobile, sidebar on desktop (use Tailwind responsive prefixes)
* Use `requestAnimationFrame` for all canvas rendering loops
* Throttle touch move events; use passive event listeners

---

# 🐳 Dev Environment

Local Node.js setup (no Docker required):

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

# Other commands
npm run lint
npm run type-check
npm run test:coverage
```

---

# 🚫 Forbidden

Claude MUST NOT:

* Introduce paid services
* Skip tests
* Skip documentation
* Use `any`
* Create large files (>300 lines)
* Mix unrelated responsibilities
* Implement multiple features in one step
* Put canvas drawing logic inside React components
* Use inline styles instead of Tailwind classes
* Skip mobile touch handling for any interactive feature

---

# 🧩 Task Size Rule

Each implementation step must be:

* Small
* Atomic
* Fully complete

---

# 🏗 Initial Roadmap

Claude must execute phases in this order (see `drawing-board-implementation-plan.md` for details):

1. **Phase 1 — Foundation**: Project setup, Canvas component, basic rendering engine, Zustand state management
2. **Phase 2 — Drawing Tools**: Rectangle, Ellipse, Line, Arrow, Freehand, Text tools
3. **Phase 3 — Interactions**: Element selection, movement, resizing, multi-select, deletion
4. **Phase 4 — Canvas Controls**: Pan, zoom (scroll + pinch), fit-to-screen
5. **Phase 5 — Element Properties**: Stroke color, fill color, stroke width, opacity
6. **Phase 6 — History**: Undo (Ctrl+Z) and Redo (Ctrl+Shift+Z)
7. **Phase 7 — Export**: PNG export, SVG export, copy to clipboard

---

# 🔁 Refactoring Rule

If better structure is discovered:

* Refactor immediately
* Update docs
* Update progress log

Never leave "we will refactor later".

---

# 🧪 Test Strategy

Prefer:

* Unit tests for core domain logic (`src/core/`, `src/utils/`)
* Integration tests for canvas interaction flows
* Component tests for UI behavior (toolbar, properties panel)
* E2E tests with Playwright for complete drawing workflows

Avoid testing implementation details.

Coverage targets per `drawing-board-implementation-plan.md`:
| Category | Target |
|----------|--------|
| Core logic (elements, renderer, history) | 90%+ |
| Hooks | 85%+ |
| Components | 80%+ |
| Utils | 95%+ |
| Overall | 80%+ |

---

# 📦 Output Style

Claude must:

* Generate complete files
* Use real production patterns
* Avoid pseudo-code
* Keep responses structured

---

# 🧠 Decision Principle

When multiple solutions exist:

Choose the one that maximizes:

1. Simplicity
2. Readability
3. Testability
4. Long-term maintainability

---

# ✅ Success Criteria

The project can be:

* Stopped at any time
* Resumed from progress.md
* Understood by a new developer from documentation alone

This is the primary goal.
