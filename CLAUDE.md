# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build (`dist/`)
- `npm run preview` — serve the production build
- `npm run lint` — ESLint over all `.ts`/`.tsx`
- `npm run typecheck` — `tsc --noEmit` against `tsconfig.app.json` (the only type-check step; `build` does not type-check)

There is no test framework configured. Verify changes with `npm run typecheck` and `npm run lint`.

## Architecture

FlowDo is a client-only React + TypeScript + Vite single-page app: a canvas where users build node-graph "learning flows" with AI assistance. There is no backend of our own — the app talks directly to Google Gemini (AI) and Firebase (optional cloud storage) from the browser.

### State lives in one place

`src/App.tsx` (the `FlowDo` component, ~1200 lines) owns *all* application state via `useState` — `nodes`, `edges`, `groups`, `viewport`, selection, every modal toggle, drag/resize flags, etc. There is no Redux/Zustand/Context. All children are controlled via prop drilling. When adding a feature, the state and its handlers almost always belong in `App.tsx`, passed down as props.

The canonical persisted shape is `AppState = { nodes, edges, groups, viewport }` (`src/types/index.ts`). This is the unit for IndexedDB saves, cloud saves, and JSON export/import — keep all four fields in sync when changing it.

### Two independent persistence layers

1. **IndexedDB (`src/utils/database.ts`)** — automatic local autosave. A `useEffect` in `App.tsx` debounces saves by 200ms on any change to nodes/edges/groups/viewport. Loaded once on mount (gated by `isDbReady`). Single record keyed by `STATE_KEY` in store `STORE_NAME` (see `src/constants/index.ts`).
2. **Firebase Firestore (`src/utils/firebase.ts`)** — *optional* named cloud saves, gated behind auth (anonymous or Google). Each saved flow is a `flows` document scoped by `userId`. Ownership is enforced client-side in every read/write. Note: queries deliberately avoid Firestore composite indexes — they fetch all of a user's flows by `userId` and sort/filter client-side.

Firebase is initialized defensively: if init fails, `auth`/`db` are set to `null` and every function throws a clear error rather than crashing the app. Preserve this null-guard pattern.

### AI integration (`src/utils/aiService.ts`)

Two functions call the Gemini REST API directly via `fetch` (model `gemini-2.5-flash-preview-09-2025`):
- `generateAIContent(mode, prompt, apiKey, attachment?, contextText?)` — drives all node AI actions (`explain`, `enhance`, `quiz`, `decompose`, `brainstorm`, `flow`).
- `generateChatResponse(...)` — the RAG-style chat sidebar, fed text extracted from visible nodes.

Key behaviors to respect:
- **Demo mode**: if `apiKey` is empty or `'demo'`, functions return canned `MOCK_AI_RESPONSES` from `src/constants/index.ts` after a fake delay. New AI modes should add a corresponding mock.
- The API key is the user's own Gemini key, stored in `localStorage` under `SETTINGS_KEY` (not in any env file).
- Gemini returns text that *should* be JSON; the code strips markdown fences and parses defensively, with per-mode fallbacks. `explain`/`enhance` return a structured `AIStructuredResponse` ({summary, key_points, suggested_next_steps}); `flow` returns a steps array; others return string arrays. Match these shapes when extending.

### Canvas model & interactions

- **Coordinates**: nodes/groups store *world* coordinates. `viewport = { x, y, zoom }` maps world↔screen. The transform `translate(viewport.x, viewport.y) scale(viewport.zoom)` is applied to the canvas inner div. Any pointer math must convert with `(clientX - rect.left - viewport.x) / viewport.zoom`.
- **`src/hooks/useCanvasInteractions.ts`** centralizes pan/drag/resize/connect for both mouse and touch (incl. pinch-zoom and long-press context menu). It receives all the relevant state setters from `App.tsx`. Zoom is clamped to `0.2`–`3`.
- **Dependency locking**: an edge means target depends on source. `isNodeLocked` (in `App.tsx`) marks a node locked until *all* its incoming-edge source nodes are `completed`. Wire color reflects this (`active`/`locked`/`default`).
- **Auto-layout (`src/utils/layout.ts`)**: "Magic Organize" uses Dagre (`rankdir: TB`) for connected nodes, grids isolated nodes below, then re-centers in the viewport. Dagre returns center coords; the code converts to top-left.

### File handling (`src/utils/fileHandlers.ts`)

Text/image attachments via `FileReader`; PDFs via `pdfjs-dist`. **PDF.js loads its worker from the unpkg CDN** (`pdf.worker.min.mjs`) — PDF text extraction requires internet access and will fail offline. Flow JSON export/import (`downloadFlow`/`uploadFlow`) validates the `AppState` shape on load.

## Conventions

- Functional components + hooks only. Handlers are wrapped in `useCallback` with explicit dependency arrays — keep deps accurate (the repo relies on `eslint-plugin-react-hooks`).
- IDs are generated with prefixes + `Date.now()` (e.g. `n-`, `e-`, `g-`, `gen-`, `ai-`). Follow this scheme.
- Dark theme via Tailwind CSS; shared colors live in the `COLORS` constant (`src/constants/index.ts`), not scattered hex values.
- `lucide-react` for icons; `react-hot-toast` for notifications (use the `toastSuccess`/`toastError` helpers in `App.tsx` for consistent styling).
- `vite.config.ts` excludes `lucide-react` from dep pre-bundling — leave that in place.

## Notes

- The Firebase web config in `src/utils/firebase.ts` is committed (project `flowdo-e76f0`). This is a client Firebase config, but treat security via Firestore rules, not config secrecy. The Gemini API key is never committed — it is user-supplied at runtime.
- `package.json` `name` is still the Vite starter default (`vite-react-typescript-starter`); the product name is FlowDo.
