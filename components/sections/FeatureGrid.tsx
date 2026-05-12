'use client'

import type { FeatureGridProps } from '@/lib/schema/page'

export default function FeatureGrid({ title, features }: FeatureGridProps) {
  return (
    <section aria-labelledby={title ? 'feature-grid-heading' : undefined} className="py-16 px-6">
      {title && (
        <h2 id="feature-grid-heading" className="mb-10 text-center text-3xl font-bold">{title}</h2>
      )}
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto" role="list">
        {features.map((feature, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-lg border p-6">
            {feature.icon && <span aria-hidden="true" className="text-2xl">{feature.icon}</span>}
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
