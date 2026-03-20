# CLAUDE.md — BomberQuest Codebase Guide

This file documents the codebase structure, conventions, and workflows for AI assistants working on BomberQuest.

---

## Project Overview

**BomberQuest** is a browser-based idle RPG with Bomberman-style mechanics. Players collect heroes via a gacha system, run them through procedurally generated maps in a Treasure Hunt mode, and fight enemies/bosses in a Story Mode. The game features cloud saves via Supabase and is deployed on Cloudflare Pages.

**Language of gameplay content:** French (UI text, guides, in-game strings).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript 5.8 |
| Bundler | Vite 5 with SWC plugin |
| Routing | React Router DOM 6 |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix UI) |
| Animation | Framer Motion |
| Server state | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| Backend/Auth | Supabase (PostgreSQL + OAuth) |
| Testing | Vitest + Testing Library |
| Deployment | Cloudflare Pages |

---

## Repository Structure

```
bomberquest/
├── src/
│   ├── pages/              # Route-level page components
│   │   ├── Landing.tsx     # Home page (/)
│   │   ├── Auth.tsx        # Login/Signup (/auth)
│   │   ├── Index.tsx       # Main game hub (/game) — largest file
│   │   ├── GuidesIndex.tsx # Guide list (/guides)
│   │   ├── GuidePage.tsx   # Individual guide (/guides/:slug)
│   │   ├── ResetPassword.tsx
│   │   └── NotFound.tsx
│   ├── components/         # Reusable UI components
│   ├── game/               # Game engine and all game logic
│   │   ├── engine.ts       # Map generation, pathfinding, game tick
│   │   ├── types.ts        # All TypeScript types and constants
│   │   ├── summoning.ts    # Gacha system with pity counters
│   │   ├── enemyAI.ts      # Enemy/Boss AI logic and patterns
│   │   ├── saveSystem.ts   # localStorage + Supabase persistence
│   │   ├── sfx.ts          # Web Audio API chiptune sound effects
│   │   ├── storyData.ts    # Story mode stage/region definitions
│   │   ├── storyTypes.ts   # Story mode type definitions
│   │   ├── questSystem.ts  # Daily quests generation and tracking
│   │   ├── upgradeSystem.ts# Hero leveling and ascension
│   │   ├── heroRenderer.ts # Canvas sprite rendering for heroes
│   │   └── enemyRenderer.ts# Canvas sprite rendering for enemies
│   ├── contexts/
│   │   └── AuthContext.tsx # Supabase auth context (signUp, signIn, signOut)
│   ├── hooks/
│   │   ├── useCloudSave.ts # Hybrid save: Supabase + localStorage
│   │   └── use-toast.ts    # Toast notifications (Sonner)
│   ├── integrations/
│   │   └── supabase/       # Supabase client and generated types
│   ├── data/
│   │   └── guides.ts       # Static guide content (Markdown-based)
│   ├── lib/
│   │   └── utils.ts        # Tailwind class merging utility (cn())
│   ├── test/
│   │   ├── setup.ts        # Vitest + jsdom setup
│   │   └── example.test.ts # Example test file
│   ├── App.tsx             # Root component with router
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles + CSS variables
├── public/
│   └── _redirects          # Cloudflare Pages SPA routing fallback
├── supabase/               # Supabase config and migrations
├── index.html              # HTML shell
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── eslint.config.js
└── components.json         # shadcn/ui config
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server on http://localhost:8080 (HMR enabled)
npm run dev

# Type-check and lint
npm run lint

# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Production build → dist/
npm run build

# Preview production build locally
npm run preview
```

> **Note:** bun is also supported (`bun.lock` is present), but npm is the primary package manager.

---

## Environment Variables

Create a `.env` file at the root with these required variables:

```env
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anonymous-key>
```

The integration client at `src/integrations/supabase/client.ts` also accepts `VITE_SUPABASE_PUBLISHABLE_KEY` as a fallback for `VITE_SUPABASE_ANON_KEY`.

---

## TypeScript Configuration

- **Strict mode is disabled** (`noImplicitAny: false`, `strictNullChecks: false`)
- Path alias `@/*` maps to `./src/*`
- Target: ES2020+, module: ESNext
- Do not enable strict mode without thorough review — many files rely on implicit `any` and loose null handling.

---

## Code Conventions

### Naming

| Pattern | Usage |
|---|---|
| `PascalCase` | React components, TypeScript types/interfaces |
| `camelCase` | Variables, functions, hook return values |
| `UPPER_SNAKE_CASE` | Constants (e.g., `RARITY_CONFIG`, `MAP_CONFIGS`) |
| `use` prefix | Custom hooks (`useCloudSave`, `use-toast`) |
| `draw` prefix | Canvas rendering functions (`drawHero`, `drawTile`) |
| `spawn` prefix | Entity factory functions (`spawnEnemy`, `spawnBoss`) |
| `tick` prefix | Per-frame update functions (`tickGame`, `tickBoss`) |

### Component Style

- Functional components only — no class components.
- State managed with `useState`, `useRef`, `useCallback`, `useContext`.
- Server/async state managed with TanStack React Query.
- Forms use React Hook Form with Zod schemas.
- Use the `cn()` utility from `src/lib/utils.ts` for conditional Tailwind classes.

### Game Code Style

- Game logic lives exclusively in `src/game/` — keep it framework-agnostic (no React imports in game modules except where absolutely needed).
- Entity updates follow a functional pattern: each `tick*` function takes current state and returns updated state.
- Canvas rendering functions draw directly to a `CanvasRenderingContext2D` context — no retained objects.

---

## Architecture Overview

### Game Loop

The main game loop is RAF-based and lives in `src/pages/Index.tsx`. Each frame calls `tickGame()` from `engine.ts`, which:

1. Advances bomb timers
2. Processes explosions and chain reactions
3. Runs A\* pathfinding for hero movement
4. Updates hero stamina and cooldowns
5. Applies skills and passive effects
6. Handles chest collection

For Story Mode, `tickEnemies()` and `tickBoss()` from `enemyAI.ts` run in parallel.

### Persistence (Dual Storage)

- **localStorage**: always-on offline persistence via `saveSystem.ts`
- **Supabase**: cloud sync via `useCloudSave.ts` hook, debounced by 3 seconds
  - `player_saves` table: player stats, currency, progress
  - `player_heroes` table: hero roster and upgrade state
- On load: Supabase data takes precedence over localStorage when user is authenticated

### Gacha System

Pity counters are tracked per rarity tier (rare, super-rare, epic, legend) in player save data. Guarantee thresholds: rare at 10, super-rare at 30, epic at 50, legend at 200 pulls. Logic in `summoning.ts`.

### Map Generation

Procedural Bomberman-style maps are generated by `generateMap()` in `engine.ts`. Block density and chest count vary per map tier. Heroes always start from corner positions.

### Rendering

Game grid is rendered on an HTML5 `<canvas>` element with 40px tiles. Sprites for heroes and enemies are drawn procedurally in `heroRenderer.ts` and `enemyRenderer.ts` respectively.

### Story Mode

Five regions (Prairie → Forêt → Mines → Château → Volcan → Citadelle), each with 5 stages and a boss. Enemy types: slime, goblin, skeleton, orc, demon. Boss AI uses pattern states (charge, summon, invincibility, bomb-rain).

---

## UI Conventions

- **Design system:** shadcn/ui components from `src/components/ui/`. Do not add raw Radix imports — always use the shadcn wrappers.
- **Theme:** Dark mode by default, using CSS variables in `index.css`. Game-specific colors (e.g., `--game-neon-red`, rarity tier colors) are defined there.
- **Font:** "Press Start 2P" for pixel-art game text; Inter for UI/prose.
- **Icons:** Lucide React exclusively.
- **Toasts:** Use the `useToast()` hook (Sonner-based). Do not use `alert()` or `console.log` for user feedback.
- **Animations:** Use Framer Motion for transitions; use Tailwind animation classes for simple CSS animations.

---

## Testing

- Tests live in `src/test/` and co-located `*.test.ts(x)` files.
- Test environment: jsdom (DOM available in all tests).
- Run with `npm run test` (single run) or `npm run test:watch`.
- Use Testing Library queries (`getByRole`, `getByText`, etc.) for component tests — avoid `querySelector`.

---

## Supabase & Auth

- Auth context is in `src/contexts/AuthContext.tsx`. Use the `useAuth()` hook to access user state and auth methods.
- Email/password and Google OAuth are supported.
- The Supabase client is a singleton in `src/integrations/supabase/client.ts`.
- Database schema is managed via migrations in `supabase/`.

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `src/game/engine.ts` | Map gen, A* pathfinding, main `tickGame()` loop |
| `src/game/types.ts` | All entity types, rarity configs, map configs |
| `src/game/summoning.ts` | Gacha roll + pity logic |
| `src/game/enemyAI.ts` | Enemy/boss AI and pattern attacks |
| `src/game/upgradeSystem.ts` | Hero leveling and ascension |
| `src/game/questSystem.ts` | Daily quest generation and progress |
| `src/game/saveSystem.ts` | localStorage persistence helpers |
| `src/pages/Index.tsx` | Main game UI (RAF loop, all game state) |
| `src/contexts/AuthContext.tsx` | Auth state and methods |
| `src/hooks/useCloudSave.ts` | Supabase cloud sync |
| `src/integrations/supabase/client.ts` | Supabase client singleton |
| `src/lib/utils.ts` | `cn()` Tailwind utility |
| `src/data/guides.ts` | Static guide content |

---

## Common Pitfalls

1. **Don't enable TypeScript strict mode** without auditing every file — too many implicit `any` usages exist.
2. **Game logic in `src/game/` should stay pure** — avoid importing React or DOM APIs there unless adding to `heroRenderer.ts`/`enemyRenderer.ts`/`sfx.ts`.
3. **Canvas tile size is 40px** — hardcoded across engine and renderers. If changing, update all occurrences.
4. **Cloud saves are debounced** — don't call the save function on every frame; call it after meaningful state changes.
5. **Pity counters must be persisted** with hero saves — losing them breaks gacha fairness guarantees.
6. **Story mode uses separate hero instances** from the main roster — don't conflate the two.
7. **French strings** — all in-game user-facing text is in French. Keep new UI strings consistent with the language.
8. **Supabase env vars** — the key variable may be named `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` depending on context (both are checked in the client).

---

## Deployment

- Platform: **Cloudflare Pages**
- Build command: `npm run build`
- Output directory: `dist`
- `public/_redirects` ensures SPA routing works (all paths → `index.html`)
- Environment variables must be set in Cloudflare Pages dashboard
