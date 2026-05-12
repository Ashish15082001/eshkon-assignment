# Page Studio — Implementation Plan

## What This Assignment Is Asking

You're building a **Page Studio** — a mini CMS editor — where content team members can load a landing page from Contentful, visually edit it, preview it, and publish versioned releases.

Think of it like a simplified version of what Contentful's own "Compose" app or Sanity Studio does. Here's the full mental model:

**The data model is simple:**
- A **Page** has a `slug`, `title`, and an ordered array of **Sections**
- Each **Section** has a `type` (hero, featureGrid, testimonial, cta) and free-form `props`
- Pages live in Contentful but get edited locally in Redux before being "published" as frozen JSON snapshots

**Two main routes:**
- `/preview/[slug]` — renders the page as a real landing page (public-facing output)
- `/studio/[slug]` — the editor UI where authorised users drag/edit/reorder sections

**Seven features, in priority order:**
1. Schema-driven renderer + typed section registry (Zod + TS)
2. Contentful adapter (real data in, no CMS logic leaking out)
3. Studio editor with Redux (3 slices: `draftPage`, `ui`, `publish`)
4. RBAC — viewer/editor/publisher roles enforced server-side
5. Publish flow — deterministic SemVer diff + immutable snapshot to disk
6. Tests + CI — unit tests, Playwright smoke, axe a11y, GitHub Actions
7. WCAG 2.2 AAA — keyboard nav, focus states, heading hierarchy, reduced-motion

---

## Implementation Plan

### Phase 0 — Install dependencies & project scaffold

Install everything missing from the bare Next.js 16 starter:

```
Redux Toolkit + React-Redux
Zod
contentful (official SDK)
next-auth (for RBAC session)
shadcn/ui (init + button, dialog, badge, toast, etc.)
@dnd-kit/core (drag-to-reorder sections)
Playwright + @axe-core/playwright
Jest + @testing-library/react
```

Set up folder structure:

```
app/
  preview/[slug]/
  studio/[slug]/
  api/publish/
lib/
  contentful/       ← contentfulClient.ts adapter
  schema/           ← Zod schemas + types
  registry/         ← sectionRegistry.ts
  semver/           ← diff + version logic
  rbac/             ← roles + middleware helpers
store/
  slices/           ← draftPage.ts, ui.ts, publish.ts
  index.ts
components/
  sections/         ← Hero, FeatureGrid, Testimonial, CTA, UnsupportedSection
  studio/           ← SectionEditor, SectionList, PropsForm
  shared/           ← ErrorBoundary, FocusTrap, etc.
releases/           ← immutable snapshots (gitignored or committed)
tests/
  unit/
  e2e/
.github/workflows/  ← ci.yml
```

---

### Phase 1 — Zod schemas + Section Registry

**Files:** `lib/schema/page.ts`, `lib/registry/sectionRegistry.ts`

- Define `PageSchema` and `SectionSchema` with Zod
- `sectionRegistry.ts` maps `type → { component, defaultProps, propsSchema }`
- Removing a registry entry → TypeScript error (discriminated union enforces it)
- `UnsupportedSection` fallback component for unknown types
- `ErrorBoundary` wraps the renderer — invalid data never crashes

---

### Phase 2 — Contentful adapter

**Files:** `lib/contentful/contentfulClient.ts`

- One function: `getPageBySlug(slug, preview: boolean)`
- Transforms raw Contentful entries → validates through Zod `PageSchema`
- Draft vs published controlled by `preview` flag + `CONTENTFUL_PREVIEW_TOKEN` env var
- Zero Contentful types leak outside this file (returns `Page`, not Contentful `Entry`)

---

### Phase 3 — `/preview/[slug]` route

**Files:** `app/preview/[slug]/page.tsx`

- Server Component: calls `getPageBySlug`, passes validated `Page` to `PageRenderer`
- `PageRenderer` maps `sections[]` through `sectionRegistry` to render components
- Error boundary wraps the whole renderer
- Viewer role can access this route

---

### Phase 4 — Redux store + Studio editor

**Files:** `store/slices/draftPage.ts`, `store/slices/ui.ts`, `store/slices/publish.ts`

Slice responsibilities:
- `draftPage` — holds the in-memory page state; actions: `loadPage`, `addSection`, `reorderSections`, `updateSectionProp`, `removeSection`
- `ui` — tracks selected section ID, sidebar open/closed, save status
- `publish` — tracks publish state: idle/pending/success/error, current version

Draft persistence: `localStorage` via `redux-persist` or manual hydration on mount.

**Files:** `app/studio/[slug]/page.tsx`

- Two-panel layout: section list (left) + live preview (right, reads from Redux draft)
- Add section button → picks a type → appended with default props
- @dnd-kit for drag-to-reorder
- Inline prop editor for Hero text and CTA label+URL

---

### Phase 5 — RBAC

**Files:** `middleware.ts`, `lib/rbac/`

- Roles stored in session (next-auth or a simple JWT cookie)
- `middleware.ts` blocks `/studio/*` for viewer, blocks `/api/publish` for non-publisher
- UI disables editor controls for viewer (cosmetic only; server is the real gate)
- Hardcoded role map for demo: env vars or a simple `users.json`

---

### Phase 6 — Publish flow + SemVer

**Files:** `lib/semver/diff.ts`, `app/api/publish/route.ts`

SemVer diff rules (deterministic):
- **Patch** — only text/prop value changed on existing sections
- **Minor** — section added, or optional prop added
- **Major** — section removed, type changed, or required prop removed/renamed

Flow:
1. POST `/api/publish` with current `draftPage` (publisher only via middleware)
2. Load last snapshot from `releases/<slug>/latest.json`
3. Run diff → determine bump
4. If diff is empty → return 304 (idempotent)
5. Write `releases/<slug>/<version>.json` (immutable snapshot)
6. Return `{ version, changelog }` → `publish` Redux slice updates

---

### Phase 7 — Tests + GitHub Actions CI

**Unit tests** (`tests/unit/`):
- `schema.test.ts` — valid/invalid page data through Zod
- `semver.test.ts` — all diff cases (patch/minor/major/no-change)

**Playwright e2e** (`tests/e2e/`):
- Preview smoke: page renders hero section
- CTA interaction: button is clickable, navigates
- axe scan on both `/preview` and `/studio`, writes `a11y-report.json`

**CI** (`.github/workflows/ci.yml`):
- `lint → type-check → unit tests → build → playwright + axe`
- Fails on critical axe violations

---

### Phase 8 — WCAG 2.2 AAA

- All interactive elements keyboard-reachable (tab order, no focus traps except modals)
- Visible `:focus-visible` ring on all controls
- `h1 → h2 → h3` hierarchy enforced in section components
- `@media (prefers-reduced-motion: reduce)` — all transitions/animations disabled
- All form inputs in PropsForm have `<label>` + `aria-describedby` for errors
- Semantic HTML throughout (`<main>`, `<nav>`, `<section>`, `<article>`)

---

## Key Decisions & Trade-offs

| Decision | Reasoning |
|---|---|
| Releases written to filesystem JSON | Simple, git-tracked, no DB needed for this assignment |
| next-auth for RBAC | Standard, extensible, supports middleware easily |
| dnd-kit not react-beautiful-dnd | rbd is unmaintained; dnd-kit supports WCAG keyboard-DnD |
| Redux persist via localStorage | Draft survives hard reload without a backend |
| Contentful preview via env flag | Keeps adapter interface clean; no component knows about CMS |

---

## What's Missing and Why

- No real user DB — roles hardcoded or via env vars
- No collaborative editing — single-user assumed
- Releases stored on filesystem — a real app would use S3 or a DB
- No undo/redo in Redux — could be added with `redux-undo`
