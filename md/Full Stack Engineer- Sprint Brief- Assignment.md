**Engineering Sprint Brief**

**Objective**

Build a Page Studio that allows authorised users to:  
	1\.	Load a page definition from Contentful  
	2\.	Edit it via a lightweight studio (WYSIWYG-lite)  
	3\.	Preview it as a rendered landing page  
	4\.	Publish it as an immutable, versioned release  
	5\.	Enforce quality via tests, accessibility checks, and CI

Prioritise architecture, correctness, and automation. Let tailwind and shadcn dictate UI polish.

**Constraints**:  
	•	Next.js (App Router) \+ TypeScript  
	•	Redux Toolkit (editor \+ publish flow state)  
	•	Contentful (real integration required)  
	•	Tailwind \+ shadcn/ui  
	•	GitHub Actions for CI  
	•	Playwright \+ axe for e2e \+ accessibility  
	•	WCAG 2.2 AAA–oriented implementation  
	•	Deployment workflow for Vercel

**A Page consists of ordered sections\[\].**

Page {  
  pageId: string  
  slug: string  
  title: string  
  sections: Section\[\]  
}

Section {  
  id: string  
  type: 'hero' | 'featureGrid' | 'testimonial' | 'cta'  
  props: Record\<string, unknown\>  
}

⸻

**1\) Schema-driven renderer \+ registry**

Goal  
Render a landing page from a validated schema using a typed registry.

Must  
	•	Zod schema validation  
	•	Single sectionRegistry.ts  
	•	/preview/\[slug\] route  
	•	Unknown section → UnsupportedSection  
	•	Invalid schema → error boundary (no crash)

Done when  
	•	Removing a registry entry breaks TS or renders fallback  
	•	Invalid Contentful data does not crash the app

⸻

**2\) Contentful integration**

Goal  
Load page \+ section data from Contentful.

Must  
	•	Real Contentful client  
	•	Explicit adapter (contentfulClient.ts)  
	•	Support draft vs published content  
	•	No Contentful logic leaking into UI/components

Done when  
	•	Preview page renders data from Contentful  
	•	Switching environments or preview mode is isolated to adapter

⸻

**3\) Studio editor (WYSIWYG-lite) \+ Redux**

Goal  
Edit page structure and props with state managed in Redux.

Must  
	•	/studio/\[slug\] route  
	•	Redux slices:  
	•	draftPage  
	•	ui  
	•	publish  
	•	Add section, reorder sections  
	•	Edit limited props:  
	•	Hero text  
	•	CTA label \+ URL  
	•	Draft persists (reload safe)

Done when  
	•	Preview reflects Redux draft state  
	•	No direct mutation outside Redux

⸻

**4\) RBAC (route \+ action enforcement)**

Roles  
	•	viewer → preview only  
	•	editor → edit draft  
	•	publisher → publish

Must  
	•	Server-side enforcement (middleware / server actions)  
	•	Publish endpoint protected  
	•	UI reflects permissions (but UI ≠ security)

Done when  
	•	Viewer cannot access /studio  
	•	Non-publisher cannot publish even via direct request

⸻

**5\) Publish flow \+ automated SemVer**

Goal  
Freeze a draft into a versioned, immutable release.

SemVer rules (fixed)  
	•	Patch → text/prop change  
	•	Minor → add section / optional prop  
	•	Major → remove section / change type / break required prop

Must  
	•	Deterministic diff logic  
	•	Immutable snapshot saved (releases/\<slug\>/\<version\>.json)  
	•	Idempotent publish (same draft ≠ new version)

Done when  
	•	Publish produces version \+ snapshot \+ changelog summary

**6\) Quality gates: tests, a11y, CI**

Must  
	•	Unit tests:  
	•	schema validation  
	•	SemVer diff logic  
	•	Playwright smoke:  
	•	preview renders  
	•	CTA interaction  
	•	axe run via Playwright  
	•	a11y-report.json artefact  
	•	CI fails on any critical axe violations

Done when  
	•	GitHub Actions runs green on main  
	•	Axe report is generated and enforced

**7\) WCAG 2.2 AAA-oriented implementation**

Hard requirements  
	•	Full keyboard operability (Studio \+ Preview)  
	•	Visible focus states  
	•	Logical heading hierarchy  
	•	prefers-reduced-motion respected  
	•	Forms fully labelled \+ accessible errors

Done when  
	•	Axe passes defined thresholds  
	•	Accessibility evidence is documented

Submission requirements

Code  
	•	GitHub repository  
	•	Working app  
	•	CI workflows present and runnable

**README**  
	1\.	Architecture overview  
	2\.	Redux slice responsibilities  
	3\.	Contentful model \+ adapter explanation  
	4\.	Publish \+ SemVer logic  
	5\.	Accessibility evidence  
	6\.	What is incomplete and why

**Key Deliverables**

**1\. Live Application (Vercel)**

\* /preview/\[slug\] renders pages from Contentful via schema-driven renderer  
\* /studio/\[slug\] supports editing via Redux (add, reorder, edit props)  
\* RBAC enforced (viewer, editor, publisher)  
\* Publish flow generates versioned, immutable releases  
\* Handles invalid schema and unsupported sections without crashing

**2\. GitHub Repository**

\* Next.js (App Router) \+ TypeScript implementation  
\* Section registry with Zod validation  
\* Contentful integration via adapter  
\* Redux Toolkit slices: draftPage, ui, publish  
\* Publish logic with deterministic SemVer \+ snapshots  
\* GitHub Actions CI setup  
\* Playwright \+ axe tests included  
\* Setup and run instructions

**3\. Short Write-up (Max \~2 Pages)**

\* Problem framing  
\* Key decisions and trade-offs  
\* Assumptions  
\* What is not included and why  
\* Architecture overview  
\* Redux slice responsibilities  
\* Contentful model and adapter  
\* Publish and SemVer logic  
\* Accessibility approach

**4\. Screen Recording (5–10 Minutes)**

\* Approach overview  
\* Studio and preview flow  
\* Component/registry structure  
\* State handling (Redux)  
\* Role-based access  
\* Publish flow and versioning