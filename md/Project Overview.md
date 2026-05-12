# Page Studio — Project Overview

**Page Studio** is a mini CMS editor built on Next.js, similar to Contentful Compose or Sanity Studio. Content team members load landing pages stored in Contentful, edit them visually in a browser UI, and publish versioned snapshots to disk.

## Data Model

- A **Page** has a slug, title, and an ordered list of **Sections**
- Sections have a type (`hero`, `featureGrid`, `testimonial`, `cta`) and free-form props
- Edited locally in Redux memory, then "published" as frozen JSON files

## Two Main Routes

- `/preview/[slug]` — public-facing rendered landing page (read-only output)
- `/studio/[slug]` — the editor UI for dragging, reordering, and editing sections

## Key Features

1. **Schema-driven rendering** — Zod validates all page data; a section registry maps types to React components
2. **Contentful adapter** — fetches real CMS data but keeps all Contentful types isolated in one file
3. **Redux store** — three slices manage draft edits, UI state, and publish status; draft persists via `localStorage`
4. **RBAC** — viewer/editor/publisher roles enforced at the middleware level (Next.js `middleware.ts`)
5. **Publish flow** — deterministic SemVer bumping (patch/minor/major) based on what changed, writes immutable snapshots to `releases/<slug>/<version>.json`
6. **Tests + CI** — Jest unit tests, Playwright e2e, axe a11y scans, GitHub Actions pipeline
7. **WCAG 2.2 AAA** — full keyboard nav, reduced-motion support, proper heading hierarchy, semantic HTML
