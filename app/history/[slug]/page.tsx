import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listVersions } from '@/lib/releases'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} — Version history` }
}

export default async function HistoryPage({ params }: { params: Params }) {
  const { slug } = await params
  const versions = await listVersions(slug)

  if (versions.length === 0) notFound()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            ← Pages
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold">{slug} — Version history</h1>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-6 py-10">
        <ol className="space-y-4" aria-label="Published versions">
          {versions.map((snap, i) => (
            <li
              key={snap.version}
              className="rounded-xl border border-border bg-card p-5 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold">v{snap.version}</span>
                  {i === 0 && (
                    <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">
                      latest
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(snap.publishedAt).toLocaleString()}
                  </span>
                </div>
                {snap.changelog.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {snap.changelog.map((entry, j) => (
                      <li key={j} className="text-sm text-muted-foreground before:content-['·'] before:mr-1.5">
                        {entry}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Link
                href={`/preview/${slug}/${snap.version}`}
                className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Preview
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
