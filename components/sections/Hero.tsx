'use client'

import type { HeroProps } from '@/lib/schema/page'

export default function Hero({ headline, subheadline, ctaLabel, ctaUrl, imageUrl }: HeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="relative flex flex-col items-center gap-6 py-24 px-6 text-center">
      {imageUrl && (
        <img src={imageUrl} alt="" role="presentation" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <div className="relative z-10 flex flex-col items-center gap-4 max-w-3xl">
        <h1 id="hero-heading" className="text-5xl font-bold tracking-tight">{headline}</h1>
        {subheadline && <p className="text-xl text-muted-foreground">{subheadline}</p>}
        {ctaLabel && ctaUrl && (
          <a
            href={ctaUrl}
            className="mt-2 inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  )
}
