import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import Link from 'next/link'
import { getPageBySlug } from '@/lib/contentful/contentfulClient'
import PageRenderer from '@/components/PageRenderer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import type { Page } from '@/lib/schema/page'

// Always re-render — never serve a stale cached version after a publish.
export const dynamic = 'force-dynamic'

// Read the latest published snapshot; fall back to Contentful if none exists.
async function getPublishedPage(slug: string): Promise<Page | null> {
  const candidates = [
    join('/tmp', 'releases', slug, 'latest.json'),       // written by publish on Vercel
    join(process.cwd(), 'releases', slug, 'latest.json'), // committed baseline
  ]
  for (const p of candidates) {
    try {
      const snapshot = JSON.parse(await readFile(p, 'utf-8'))
      return snapshot.page as Page
    } catch { /* not found, try next */ }
  }
  return getPageBySlug(slug)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  return { title: page?.title ?? slug }
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPublishedPage(slug)

  if (!page) {
    notFound()
  }

  return (
    <div>
      <div className="border-b border-border bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            ← Pages
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{page.title}</span>
        </div>
        <Link
          href={`/history/${slug}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Version history
        </Link>
      </div>
      <ErrorBoundary>
        <PageRenderer page={page} />
      </ErrorBoundary>
    </div>
  )
}
