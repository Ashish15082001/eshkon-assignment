'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PageSchema } from '@/lib/schema/page'
import type { Page } from '@/lib/schema/page'
import { sectionRegistry, type RegisteredSectionType } from '@/lib/registry/sectionRegistry'
import { useAppDispatch, useAppSelector } from '@/store'
import { loadPage, addSection } from '@/store/slices/draftPage'
import { selectSection } from '@/store/slices/ui'
import { publishStart, publishSuccess, publishError, resetPublish } from '@/store/slices/publish'
import { canPublish, type Role } from '@/lib/rbac/roles'
import SectionList from './SectionList'
import PropsForm from './PropsForm'
import PageRenderer from '@/components/PageRenderer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

const SECTION_TYPES = Object.keys(sectionRegistry) as RegisteredSectionType[]

function AddSectionButton({ onAdd }: { onAdd: (type: RegisteredSectionType) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        + Add section
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Section types"
          className="absolute left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-popover shadow-lg"
        >
          {SECTION_TYPES.map((type) => (
            <li key={type}>
              <button
                role="option"
                aria-selected={false}
                onClick={() => {
                  onAdd(type)
                  setOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:bg-accent capitalize"
              >
                {type === 'featureGrid' ? 'Feature Grid' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function StudioEditor({ initialPage }: { initialPage: Page }) {
  const dispatch = useAppDispatch()
  const page = useAppSelector((s) => s.draftPage.page)
  const selectedId = useAppSelector((s) => s.ui.selectedSectionId)
  const publish = useAppSelector((s) => s.publish)
  const { data: session, status: sessionStatus } = useSession()

  const role = (session?.user as { role?: string } | undefined)?.role as Role | undefined
  const isPublisher = sessionStatus === 'authenticated' && !!role && canPublish(role)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`draft:${initialPage.slug}`)
      if (raw) {
        const parsed = PageSchema.safeParse(JSON.parse(raw))
        if (parsed.success) {
          dispatch(loadPage(parsed.data))
          return
        }
        localStorage.removeItem(`draft:${initialPage.slug}`)
      }
    } catch {
      // ignore
    }
    dispatch(loadPage(initialPage))
  }, [dispatch, initialPage])

  // Persist draft to localStorage
  useEffect(() => {
    if (!page) return
    try {
      localStorage.setItem(`draft:${page.slug}`, JSON.stringify(page))
    } catch {
      // storage quota or private browsing — silently ignore
    }
  }, [page])

  function handleAddSection(type: RegisteredSectionType) {
    const entry = sectionRegistry[type]
    const id = `${type}-${Date.now()}`
    dispatch(addSection({ id, type, props: entry.defaultProps } as Parameters<typeof addSection>[0]))
    dispatch(selectSection(id))
  }

  async function handlePublish() {
    if (!page) return
    dispatch(publishStart())
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      })
      if (!res.ok) {
        const { error } = await res.json()
        dispatch(publishError(error ?? 'Publish failed'))
        return
      }
      const data = await res.json()
      if (data.unchanged) {
        dispatch(publishSuccess({ version: data.version, changelog: ['No changes since last publish'] }))
        return
      }
      dispatch(publishSuccess({ version: data.version, changelog: data.changelog }))
    } catch (err) {
      dispatch(publishError(err instanceof Error ? err.message : 'Network error'))
    }
  }

  const selectedSection = page?.sections.find((s) => s.id === selectedId) ?? null

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen" aria-busy="true">
        <p className="text-muted-foreground">Loading editor…</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left panel — section list + editor */}
      <aside
        className="w-80 flex-shrink-0 flex flex-col border-r border-border overflow-hidden"
        aria-label="Studio sidebar"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h1 className="text-sm font-semibold leading-tight">{page.title}</h1>
            <p className="text-xs text-muted-foreground">/preview/{page.slug}</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={!isPublisher || publish.status === 'pending'}
            aria-disabled={!isPublisher || publish.status === 'pending'}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {publish.status === 'pending' ? 'Publishing…' : 'Publish'}
          </button>
        </header>

        {/* Role notice for non-publishers */}
        {sessionStatus === 'authenticated' && !isPublisher && (
          <p className="mx-4 mt-2 text-xs text-muted-foreground">
            Signed in as <span className="font-medium capitalize">{role ?? 'editor'}</span> — publish requires the <span className="font-medium">publisher</span> role.
          </p>
        )}

        {/* Publish feedback */}
        {publish.status === 'success' && (
          <div
            role="status"
            aria-live="polite"
            className="mx-4 mt-3 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800"
          >
            <p className="font-semibold">Published v{publish.version}</p>
            {publish.changelog && publish.changelog.length > 0 && (
              <ul className="mt-1 space-y-0.5 list-disc list-inside text-green-700">
                {publish.changelog.map((entry, i) => <li key={i}>{entry}</li>)}
              </ul>
            )}
            <div className="mt-2 flex gap-3">
              <a
                href={`/preview/${page.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-800"
              >
                View page ↗
              </a>
              <button
                onClick={() => dispatch(resetPublish())}
                className="underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {publish.status === 'error' && (
          <div
            role="alert"
            className="mx-4 mt-3 rounded-md bg-destructive/10 border border-destructive px-3 py-2 text-xs text-destructive"
          >
            <p className="font-semibold">Publish failed</p>
            <p>{publish.error}</p>
            <button
              onClick={() => dispatch(resetPublish())}
              className="mt-1 underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section list */}
        <nav aria-label="Page sections" className="flex-1 overflow-y-auto p-4 space-y-3">
          <SectionList sections={page.sections} selectedId={selectedId} />
          <AddSectionButton onAdd={handleAddSection} />
        </nav>

        {/* Props editor */}
        {selectedSection && (
          <section
            aria-label="Section properties"
            className="border-t border-border p-4 overflow-y-auto max-h-72"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Properties
            </h2>
            <PropsForm section={selectedSection} />
          </section>
        )}
      </aside>

      {/* Right panel — live preview */}
      <main className="flex-1 overflow-y-auto bg-muted/30" aria-label="Page preview">
        <div className="min-h-full bg-background">
          <ErrorBoundary>
            <PageRenderer page={page} />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
