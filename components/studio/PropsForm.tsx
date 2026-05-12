'use client'

import type { Section } from '@/lib/schema/page'
import { useAppDispatch } from '@/store'
import { updateSectionProps } from '@/store/slices/draftPage'

function Field({
  id,
  label,
  value,
  onChange,
  required,
  multiline,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  multiline?: boolean
}) {
  const inputId = `prop-${id}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span aria-hidden="true" className="ml-1 text-destructive">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          aria-required={required}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={required}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </div>
  )
}

interface PropsFormProps {
  section: Section
}

export default function PropsForm({ section }: PropsFormProps) {
  const dispatch = useAppDispatch()

  function set(key: string, value: string) {
    dispatch(updateSectionProps({ id: section.id, props: { [key]: value } }))
  }

  switch (section.type) {
    case 'hero':
      return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Hero section properties">
          <Field id={`${section.id}-headline`} label="Headline" value={section.props.headline} onChange={(v) => set('headline', v)} required />
          <Field id={`${section.id}-subheadline`} label="Subheadline" value={section.props.subheadline ?? ''} onChange={(v) => set('subheadline', v)} />
          <Field id={`${section.id}-ctaLabel`} label="CTA Label" value={section.props.ctaLabel ?? ''} onChange={(v) => set('ctaLabel', v)} />
          <Field id={`${section.id}-ctaUrl`} label="CTA URL" value={section.props.ctaUrl ?? ''} onChange={(v) => set('ctaUrl', v)} />
          <Field id={`${section.id}-imageUrl`} label="Image URL" value={section.props.imageUrl ?? ''} onChange={(v) => set('imageUrl', v)} />
        </form>
      )

    case 'featureGrid':
      return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Feature grid section properties">
          <Field id={`${section.id}-title`} label="Title" value={section.props.title ?? ''} onChange={(v) => set('title', v)} />
          <Field
            id={`${section.id}-features`}
            label="Features (JSON)"
            value={JSON.stringify(section.props.features, null, 2)}
            onChange={(v) => {
              try {
                const parsed = JSON.parse(v)
                dispatch(updateSectionProps({ id: section.id, props: { features: parsed } }))
              } catch {
                // suppress invalid JSON while typing
              }
            }}
            multiline
          />
        </form>
      )

    case 'testimonial':
      return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Testimonial section properties">
          <Field id={`${section.id}-quote`} label="Quote" value={section.props.quote} onChange={(v) => set('quote', v)} required multiline />
          <Field id={`${section.id}-author`} label="Author" value={section.props.author} onChange={(v) => set('author', v)} required />
          <Field id={`${section.id}-role`} label="Role" value={section.props.role ?? ''} onChange={(v) => set('role', v)} />
          <Field id={`${section.id}-company`} label="Company" value={section.props.company ?? ''} onChange={(v) => set('company', v)} />
          <Field id={`${section.id}-avatarUrl`} label="Avatar URL" value={section.props.avatarUrl ?? ''} onChange={(v) => set('avatarUrl', v)} />
        </form>
      )

    case 'cta':
      return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="CTA section properties">
          <Field id={`${section.id}-headline`} label="Headline" value={section.props.headline} onChange={(v) => set('headline', v)} required />
          <Field id={`${section.id}-label`} label="Button Label" value={section.props.label} onChange={(v) => set('label', v)} required />
          <Field id={`${section.id}-url`} label="Button URL" value={section.props.url} onChange={(v) => set('url', v)} required />
          <Field id={`${section.id}-subtext`} label="Subtext" value={section.props.subtext ?? ''} onChange={(v) => set('subtext', v)} />
        </form>
      )
  }
}
