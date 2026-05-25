# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework:** TanStack Start (React 19 SSR) + TanStack Router (file-based) + TanStack Query
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix UI primitives)
- **Build:** Vite via `@lovable.dev/vite-tanstack-config` (wraps all plugins — do NOT add tanstackStart, viteReact, tailwindcss, tsConfigPaths, or cloudflare manually)
- **Runtime:** Cloudflare Workers
- **Package manager:** Bun
- **Language:** TypeScript

## Commands

```bash
bun dev          # dev server
bun build        # production build (Cloudflare Workers)
bun lint         # ESLint
bun format       # Prettier
```

## Architecture

### Routing (`src/routes/`)
TanStack Router with file-based routing. `routeTree.gen.ts` is **auto-generated** — never edit it by hand, it regenerates on `bun dev`/`bun build`. Add pages as new `.tsx` files in `src/routes/`. For multi-page apps, create separate files (`about.tsx`, `products.tsx`) — do not pile all pages into `index.tsx`.

### Server Entry (`src/server.ts`)
Cloudflare Worker entry point. Wraps the SSR handler to catch h3's swallowed errors (which surface as JSON `{"unhandled":true,"message":"HTTPError"}`) and convert them to proper HTML error pages. `wrangler.jsonc` points `main` here.

### Router Setup (`src/router.tsx`)
Creates the TanStack Router with `QueryClient` injected as context. `scrollRestoration: true` and `defaultPreloadStaleTime: 0` are intentional defaults.

### UI Components (`src/components/ui/`)
Full shadcn/ui component library — Accordion, Dialog, Form, Table, Charts, etc. These are vendored copies; modify only if you need to patch a specific component. To add more shadcn components use the CLI or copy from shadcn docs.

### Utilities (`src/lib/`)
- `utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `error-capture.ts` / `error-page.ts` — SSR error interception for Cloudflare

## Deploy

Push to `main` on GitHub. Set up Cloudflare Pages/Workers CI to deploy automatically, or run:

```bash
bunx wrangler deploy
```

## Important Constraints

- The `vite.config.ts` comment lists plugins already included by `@lovable.dev/vite-tanstack-config`. Adding them again breaks the build.
- `src/routeTree.gen.ts` is auto-generated — never edit manually.
- `src/routes/index.tsx` currently has a Lovable placeholder (`PlaceholderIndex`). Replace it with the real app UI.
