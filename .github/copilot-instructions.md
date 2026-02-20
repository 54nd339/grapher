---
description: Grapher project coding conventions and architecture rules
---

# Grapher Conventions

## Architecture

- Follow SOLID, DRY, KISS principles. Prefer minimal diffs.
- Components are **dumb and presentational only**. No business logic in components.
- Business logic belongs in `lib/`, `utils/`, `hooks/`, `stores/`, or `providers/`.
- Default to **Server Components**. Add `'use client'` only on interactive leaf components that need browser APIs, event handlers, or hooks.
- Use `next/link` instead of `<a>`. Use `next/image` instead of `<img>`.
- Avoid prop drilling. Use Zustand stores, React context, or composition (children/render props).
- **Web Worker Offloading**: Heavy mathematical computations (like $O(N^2)$ implicit grids, $O(N^3)$ 3D surface mapping, RK4 integrations, and high-frequency calculus) MUST be offloaded to `workers/math.worker.ts` using Comlink. 
  - Send raw strings (`latex` or plain expression) and the `scope` to the worker for `ceCompile` compilation. Never evaluate on the main thread just to send large arrays.
  - Simple $O(N)$ iterations (like 120-step polygons) or `Plot.OfX` adaptive sampling should remain synchronous on the main thread to avoid IPC latency overhead.

## State Management

- Use Zustand for global state. Keep stores **minimal and atomic** -- one concern per store.
- Export individual selector hooks, never the entire store object.
- Components must subscribe to the smallest slice needed to prevent unnecessary re-renders.
- Prefer `useShallow` from zustand for multi-field selectors.

## Styling

- Use Tailwind CSS v4 utility classes exclusively. No inline styles or CSS modules.
- Order classes logically: **layout -> box model -> visual -> typography**.
  - Example: `flex items-center gap-2 p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-medium text-zinc-900`
- Use `next-themes` for light/dark mode. Reference theme via `dark:` variant.
- Stick to the project's CSS custom properties defined in `globals.css` for theme colors.

## Imports & Bundle

- Zero tolerance for unused imports or dead code. Remove them immediately.
- Never keep duplicate imports from the same module. Merge them into a single import statement.
  - Good: `import { Toolbar, Sidebar, MobileSheet } from "@/components/layout"`
  - Bad: multiple `import ... from "@/components/layout"` lines in the same file
- Order imports in this **standard grouping**:
  1. Third-party packages (`react` > `next` > `lucide-react`, etc.)
  2. Internal aliases (`@/...`)
     - Internal alias precedence: `@/components` > `@/lib` > `@/providers` > `@/stores` > `@/hooks` > `@/types`
  3. Relative imports (`../...`, `./...`)
- Sort paths alphabetically within each group.
- Prefer combining `type` specifiers into existing imports when possible (e.g. `import { foo, type Bar } from "..."`).
- Heavy libraries (`mathlive`, `three`, `@react-three/fiber`, `@cortex-js/compute-engine`) must be **dynamically imported** via `next/dynamic` or lazy `import()`.
- Prefer tree-shakable named imports over default imports where possible.
- Offload custom logic to pre-built libraries when a well-maintained one exists.

## TypeScript

- Strict mode. No `any` unless absolutely unavoidable.
- Define types in `types/index.ts` or co-locate in `lib/math/types.ts` for domain types.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Use `as const` for literal arrays and objects used as configuration.

## Comments

- Comments explain **why**, never **what**. If the code needs a "what" comment, refactor for clarity.
- Bad: `// increment counter` Good: `// reset after max retries to avoid infinite loop`

## File Organization

```
app/           -- Next.js routes, layouts, metadata, PWA files
components/    -- Presentational React components (ui/, graph/, editor/, solver/, layout/)
lib/           -- Pure business logic, no React dependencies where possible
hooks/         -- Custom React hooks that bridge stores/lib to components
stores/        -- Zustand store definitions
providers/     -- React context providers (theme, etc.)
types/         -- Shared TypeScript interfaces and types
public/        -- Static assets (icons, OG image)
```

## PWA

- PWA uses `@ducanh2912/next-pwa` with static export output and a generated service worker at `public/sw.js`.
- Manifest generated dynamically in `app/manifest.ts`.
