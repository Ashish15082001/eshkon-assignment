import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSnapshot } from '@/lib/releases'
import PageRenderer from '@/components/PageRenderer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string; version: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, version } = await params
  return { title: `${slug} — v${version}` }
}

export default async function VersionedPreviewPage({ params }: { params: Params }) {
  const { slug, version } = await params
  const snapshot = await getSnapshot(slug, version)

  if (!snapshot) notFound()

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Link
            href={`/history/${slug}`}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            ← History
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{snapshot.page.title}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono">v{snapshot.version}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(snapshot.publishedAt).toLocaleString()}
        </span>
      </div>

      <ErrorBoundary>
        <PageRenderer page={snapshot.page} />
      </ErrorBoundary>
    </div>
  )
}
