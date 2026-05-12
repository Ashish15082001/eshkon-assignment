import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist or hasn&apos;t been published yet.
      </p>
      <Link
        href="/"
        className="text-sm underline underline-offset-4 hover:text-primary"
      >
        Back to home
      </Link>
    </main>
  )
}
