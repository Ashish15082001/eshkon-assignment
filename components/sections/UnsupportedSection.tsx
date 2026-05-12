'use client'

export default function UnsupportedSection({ type }: { type: string }) {
  return (
    <section role="region" aria-label={`Unsupported section: ${type}`} className="py-8 px-6">
      <div className="mx-auto max-w-2xl rounded-lg border border-dashed border-amber-400 bg-amber-50 p-6 text-center text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <p className="font-medium">Unknown section type: <code className="font-mono">{type}</code></p>
        <p className="mt-1 text-sm">Add this type to the section registry to render it.</p>
      </div>
    </section>
  )
}
