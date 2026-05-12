# Page Studio

A mini CMS editor built on Next.js 16 where content teams load landing pages from Contentful, edit them visually in a browser, and publish immutable versioned snapshots to disk.

---

## Getting Started

Copy the example env file and fill in your Contentful credentials:

```bash
cp env.example .env.local
```

Required variables:

| Variable | Purpose |
|---|---|
| `CONTENTFUL_SPACE_ID` | Contentful space identifier |
| `CONTENTFUL_ACCESS_TOKEN` | Delivery API token (published content) |
| `CONTENTFUL_PREVIEW_TOKEN` | Preview API token (draft content) |
| `NEXTAUTH_SECRET` | Session signing secret (any random string) |
| `NEXTAUTH_URL` | Base URL, e.g. `http://localhost:3000` |

If Contentful credentials are missing the app falls back to built-in mock pages, so the editor works offline.

```bash
npm install
npm run dev
```

---

## 1. Architecture Overview

```
app/
  page.tsx                     ← Home: lists all pages, auth-aware header
  auth/signin/page.tsx         ← Sign-in form with one-click demo account fill
  preview/[slug]/page.tsx      ← Server Component: public-facing rendered page
  studio/[slug]/page.tsx       ← Server Component: editor shell (auth-gated)
  api/publish/route.ts         ← POST endpoint: SemVer diff + snapshot write

lib/
  contentful/contentfulClient.ts  ← Only file that knows Contentful exists
  schema/page.ts                  ← Zod schemas for Page, Section, all prop types
  registry/sectionRegistry.ts     ← Maps section type → { component, defaultProps }
  semver/diff.ts                  ← Deterministic SemVer diff + version increment
  rbac/roles.ts                   ← Role definitions and permission helpers
  auth.ts                         ← NextAuth configuration + hardcoded user map

store/
  index.ts                     ← Redux store setup
  slices/draftPage.ts          ← In-memory page state
  slices/ui.ts                 ← Editor UI state
  slices/publish.ts            ← Publish lifecycle state

components/
  PageRenderer.tsx             ← Maps sections[] through registry to React components
  sections/                    ← Hero, FeatureGrid, Testimonial, CTA, UnsupportedSection
  studio/
    StudioEditor.tsx           ← Two-panel layout: section list + live preview
    SectionList.tsx            ← Drag-and-drop list (@dnd-kit)
    PropsForm.tsx              ← Type-specific prop editor form
  shared/
    ErrorBoundary.tsx          ← Catches render errors, prevents full crash
    Providers.tsx              ← Session + Redux providers
  ui/                          ← Shadcn components (button, badge, dialog, toast)

releases/                      ← Immutable JSON snapshots written at publish time
tests/
  unit/                        ← Jest: schema + semver tests
  e2e/                         ← Playwright: smoke + axe accessibility scans
middleware.ts                  ← Route guards: /studio/* and /api/publish
```

**Request flow for the studio:**

1. `middleware.ts` checks session and role — unauthenticated users are redirected to `/auth/signin`, viewers are blocked from `/studio/*`.
2. `app/studio/[slug]/page.tsx` (Server Component) calls `getPageBySlug(slug, preview: true)`, which hits the Contentful Preview API and returns a validated `Page`.
3. The page is hydrated into Redux `draftPage` on the client.
4. `StudioEditor` renders a sidebar (`SectionList`, `PropsForm`) and a live preview (`PageRenderer` reading from Redux).
5. On publish, `StudioEditor` POSTs the current draft to `/api/publish`, which diffs against the last snapshot and writes a new versioned JSON file.

---

## 2. Redux Slice Responsibilities

### `draftPage`

Holds the entire in-memory page being edited. Initialised from the Contentful server fetch on mount, then mutated by editor actions. Persisted to `localStorage` so drafts survive a hard reload.

| Action | What it does |
|---|---|
| `loadPage(page)` | Replaces the entire slice state with the given `Page` object |
| `addSection(section)` | Pushes a new `Section` (with default props from the registry) to `page.sections` |
| `reorderSections({ activeIndex, overIndex })` | Moves a section from one index to another (driven by @dnd-kit drag events) |
| `updateSectionProps({ id, props })` | Merges new prop values into the section matching `id` using `Object.assign` |
| `removeSection(id)` | Filters the section with the given `id` out of `page.sections` |

### `ui`

Tracks transient editor state that doesn't need to persist across reloads.

| Action | What it does |
|---|---|
| `selectSection(id \| null)` | Sets `selectedSectionId` — controls which section's props are shown in the form |
| `toggleSidebar()` | Flips `sidebarOpen` boolean |
| `setSaveStatus(status)` | Sets `'idle' \| 'saving' \| 'saved' \| 'error'` — drives the save indicator in the header |

### `publish`

Tracks the lifecycle of a publish request from the moment the button is clicked to the API response.

| Action | What it does |
|---|---|
| `publishStart()` | Sets status to `'pending'`, clears any previous error |
| `publishSuccess({ version, changelog })` | Sets status to `'success'`, stores the new version string and changelog array |
| `publishError(message)` | Sets status to `'error'`, stores the error message string |
| `resetPublish()` | Returns status to `'idle'` |

The `publish` slice state drives the success banner (showing new version + changelog) and the error message shown beneath the publish button.

---

## 3. Contentful Model + Adapter

### Contentful content model

Each **Page** entry in Contentful has:

| Field | Type | Notes |
|---|---|---|
| `slug` | Short text | URL identifier, e.g. `Home` |
| `title` | Short text | Page display title |
| `sections` | Array of references | Ordered list of Section entries |

Each **Section** entry has:

| Field | Type | Notes |
|---|---|---|
| `type` | Short text | One of `hero`, `featureGrid`, `testimonial`, `cta` |
| `props` | JSON | Free-form props consumed by the matching component |

### Adapter: `lib/contentful/contentfulClient.ts`

This is the **only file in the codebase that imports from the `contentful` SDK**. Everything outside it works with plain `Page` and `Section` TypeScript types — no Contentful `Entry` or `Asset` types ever leak out.

**`getAllPages(preview?: boolean): Promise<Pick<Page, 'slug' | 'title'>[]>`**

Returns a lightweight list of all pages (slug + title only) for the home screen. Uses the delivery client by default; switches to the preview client when `preview: true`.

**`getPageBySlug(slug: string, preview?: boolean): Promise<Page | null>`**

Fetches a single page and all its linked section entries. The raw Contentful response is transformed to a plain object and validated against `PageSchema` (Zod). If Zod validation fails the error is logged and `null` is returned — the caller never sees a partial or malformed page.

**Transform logic:**

```
raw Entry
  → extract sys.id as section.id
  → extract fields.type as section.type
  → extract fields.props as section.props
  → filter out nulls
  → PageSchema.safeParse(...)
  → return Page | null
```

**Fallback behaviour:** If `CONTENTFUL_SPACE_ID` or the relevant API token is absent, both functions fall back to a hardcoded `MOCK_PAGES` map so the app runs without credentials in development.

**Env vars used:**

| Variable | Used by |
|---|---|
| `CONTENTFUL_SPACE_ID` | Both clients |
| `CONTENTFUL_ACCESS_TOKEN` | Delivery client (published content) |
| `CONTENTFUL_PREVIEW_TOKEN` | Preview client (draft content) |

---

## 4. Publish + SemVer Logic

### Diff rules (`lib/semver/diff.ts`)

`diffPages(previous, current)` compares the two `Page` objects and returns a bump level plus a human-readable changelog array.

| Change | Bump | Reasoning |
|---|---|---|
| Section removed | **major** | Breaks any consumer expecting that section |
| Section type changed | **major** | Structural breaking change |
| Section added | **minor** | Backwards-compatible new content |
| Prop value changed | **patch** | Content update, no structural change |
| No difference | **none** | Idempotent — nothing to write |

Rules are evaluated in priority order: a single removal forces a major bump even if other sections were also added.

### Publish flow (`app/api/publish/route.ts`)

```
POST /api/publish  { page: Page }
```

1. `middleware.ts` has already verified the caller has the `publisher` role; the route itself rejects any non-publisher session as a defence-in-depth check.
2. The request body is validated against `PageSchema`.
3. The directory `releases/{slug}/` is created if it doesn't exist.
4. `releases/{slug}/latest.json` is read to get the previous snapshot.
5. **First publish** (no previous snapshot): version is set to `1.0.0`, changelog is `['Initial release']`.
6. **Subsequent publish**: `diffPages(previous.page, current)` is called.
   - Bump is `none` → return `{ unchanged: true, version }` (no file written).
   - Otherwise: `incrementVersion(previous.version, bump)` produces the next version.
7. The snapshot `{ version, page, changelog, publishedAt }` is written to:
   - `releases/{slug}/{version}.json` — immutable historical archive
   - `releases/{slug}/latest.json` — overwritten on every publish
8. Response `{ version, changelog }` is dispatched to the `publish` Redux slice on the client.

---

## 5. Accessibility Evidence

### ARIA

| Pattern | Where used |
|---|---|
| `aria-labelledby` | Hero, FeatureGrid, CTA sections — headings label their `<section>` |
| `aria-label` | Studio sidebar, section nav, PropsForm, drag handles |
| `aria-expanded` / `aria-haspopup="listbox"` | Add Section dropdown button |
| `role="listbox"` / `role="option"` | Add Section type picker |
| `aria-pressed` | SectionList items (selected state) |
| `aria-required` / `aria-invalid` | PropsForm inputs with Zod validation errors |
| `aria-describedby` | PropsForm inputs linked to their error message elements |
| `role="alert"` | PropsForm validation errors, publish error, ErrorBoundary |
| `role="status"` + `aria-live="polite"` | Publish success banner |
| `aria-hidden="true"` | Decorative SVG icons and emoji |
| `aria-label="Drag to reorder"` | @dnd-kit drag handle buttons |

### Focus management

All interactive elements use `focus-visible:ring-2 focus-visible:ring-ring` (Tailwind). Links in Hero and CTA additionally use `focus-visible:outline` with an offset so the ring clears the element boundary. No `outline: none` without a replacement.

### Keyboard navigation

@dnd-kit is configured with both `PointerSensor` and `KeyboardSensor`, so sections can be reordered with arrow keys as well as mouse drag.

### Reduced motion

`app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Heading hierarchy

| Level | Used in |
|---|---|
| `<h1>` | Hero headline, Home page title, Sign-in page title |
| `<h2>` | FeatureGrid title, CTA headline |
| `<h3>` | FeatureGrid individual feature items |

No levels are skipped.

### Semantic HTML

`<main>`, `<aside>`, `<header>`, `<nav>`, `<section>`, `<form>`, `<figure>` / `<figcaption>` (Testimonial), `<table>` with `<thead>` / `<tbody>` (Home page). Interactive elements are `<button>` — no click handlers on `<div>`.

### CI enforcement

Playwright e2e tests run `@axe-core/playwright` on both `/preview` and `/studio` routes and write `a11y-report.json`. The GitHub Actions workflow fails the build on any critical axe violation.

---

## 6. What Is Incomplete and Why

| Area | What's missing | Why / Trade-off |
|---|---|---|
| Draft hydration | `localStorage` is written on every edit but never read back on page load — a hard reload loses the draft | Avoided `redux-persist` to keep the dependency count low; a one-line `useEffect` in `StudioEditor` would fix it |
| `localStorage` error feedback | `setItem` errors (quota exceeded, private browsing) are silently caught | No user-visible warning when the draft can't be saved |
| `app/layout.tsx` metadata | Title and description are still the `create-next-app` placeholders | Metadata should be dynamic per page or at least rebranded |
| PropsForm validation | The form accepts any JSON for FeatureGrid `features` and doesn't enforce the per-section Zod prop schemas | Only the publish API validates at a hard boundary; the editor gives no field-level type errors |
| `NEXTAUTH_SECRET` in env.example | Missing from the example file; the code falls back to the string `'dev-secret-replace-in-production'` | Works in development, but deployers won't know it's required without reading the source |
| Role DB | Roles are hardcoded in `lib/auth.ts` as a static user map | Intentional for this assignment scope; a real deployment would need a DB or an IdP with claims |
| Collaborative editing | Single-user assumed; two editors on the same page will silently overwrite each other | Out of scope; would require OT/CRDT or a lock mechanism |
| Undo / redo | No history in Redux | `redux-undo` could wrap the `draftPage` slice; excluded to keep the store simple |
| Selector memoization | `useAppSelector` calls are inline without `useMemo` | Not a correctness issue at this page scale, but would cause extra re-renders in a larger tree |
| i18n | All UI strings are hardcoded English | Out of scope for this assignment |
