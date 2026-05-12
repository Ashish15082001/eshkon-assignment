import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllPages } from '@/lib/contentful/contentfulClient'
import { canEdit } from '@/lib/rbac/roles'
import type { Role } from '@/lib/rbac/roles'

export default async function Home() {
  const [pages, session] = await Promise.all([getAllPages(), getServerSession(authOptions)])

  const role = (session?.user as { role?: string } | null)?.role as Role | undefined
  const isEditor = role ? canEdit(role) : false

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div>
            <span className="text-lg font-semibold tracking-tight">Page Studio</span>
            {session?.user && (
              <span className="ml-3 text-xs text-muted-foreground">
                Signed in as <strong>{session.user.email}</strong>
                {role && (
                  <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 font-medium capitalize">
                    {role}
                  </span>
                )}
              </span>
            )}
          </div>
          <nav aria-label="Account">
            {session ? (
              <Link
                href="/api/auth/signout"
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign out
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero line */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="mt-1 text-muted-foreground">
            {isEditor
              ? 'Preview or open a page in the Studio editor.'
              : 'Browse published pages. Sign in as editor or publisher to make changes.'}
          </p>
        </div>

        {/* Sign-in nudge for unauthenticated visitors */}
        {!session && (
          <div className="mb-8 rounded-lg border border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Want to edit pages? Sign in with an editor or publisher account.
            </p>
            <Link
              href="/api/auth/signin"
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* Page cards */}
        {pages.length === 0 ? (
          <p className="text-muted-foreground">No pages found.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {pages.map((page) => (
              <li
                key={page.slug}
                className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4 shadow-sm"
              >
                <div className="flex-1">
                  <h2 className="font-semibold">{page.title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground font-mono">/{page.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/preview/${page.slug}`}
                    className="flex-1 rounded-md border border-border px-3 py-1.5 text-center text-sm hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Preview
                  </Link>
                  {isEditor && (
                    <Link
                      href={`/studio/${page.slug}`}
                      className="flex-1 rounded-md bg-primary px-3 py-1.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
