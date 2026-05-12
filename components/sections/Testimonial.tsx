'use client'

import type { TestimonialProps } from '@/lib/schema/page'

export default function Testimonial({ quote, author, role, company, avatarUrl }: TestimonialProps) {
  const byline = [role, company].filter(Boolean).join(', ')

  return (
    <section className="py-16 px-6">
      <figure className="mx-auto max-w-2xl text-center">
        <blockquote className="text-2xl font-medium leading-relaxed">
          <p>"{quote}"</p>
        </blockquote>
        <figcaption className="mt-6 flex items-center justify-center gap-4">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={author}
              className="h-12 w-12 rounded-full object-cover"
            />
          )}
          <div className="text-left">
            <p className="font-semibold">{author}</p>
            {byline && <p className="text-sm text-muted-foreground">{byline}</p>}
          </div>
        </figcaption>
      </figure>
    </section>
  )
}
