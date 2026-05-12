'use client'

import type { CtaProps } from '@/lib/schema/page'

export default function CTA({ headline, label, url, subtext }: CtaProps) {
  return (
    <section aria-labelledby="cta-heading" className="py-16 px-6 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-4">
        <h2 id="cta-heading" className="text-3xl font-bold">{headline}</h2>
        {subtext && <p className="text-primary-foreground/80">{subtext}</p>}
        <a
          href={url}
          className="mt-2 inline-flex items-center rounded-md bg-background px-6 py-3 text-sm font-semibold text-foreground shadow hover:bg-background/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
        >
          {label}
        </a>
      </div>
    </section>
  )
}
