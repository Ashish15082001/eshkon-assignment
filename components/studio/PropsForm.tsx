'use client'

import { useState } from 'react'
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
  multiline?: boolean | 'json'
}) {
  const [touched, setTouched] = useState(false)
  const inputId = `prop-${id}`
  const errorId = `prop-${id}-error`
  const hasError = required && touched && value.trim() === ''

  const sharedProps = {
    id: inputId,
    value,
    'aria-required': required,
    'aria-describedby': hasError ? errorId : undefined,
    'aria-invalid': hasError || undefined,
    onBlur: () => setTouched(true),
    className: `rounded-md border px-3 py-2 text-sm bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      hasError ? 'border-destructive' : 'border-input'
    }`,
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span aria-hidden="true" className="ml-1 text-destructive">*</span>}
      </label>

      {multiline ? (
        <textarea {...sharedProps} rows={multiline === 'json' ? 10 : 3} onChange={(e) => onChange(e.target.value)} className={`${sharedProps.className} resize-y font-mono text-xs`} />
      ) : (
        <input {...sharedProps} type="text" onChange={(e) => onChange(e.target.value)} />
      )}

      {hasError && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {label} is required.
        </p>
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

    case 'featureGrid': {
      const features: { title: string; description: string; icon?: string }[] =
        Array.isArray(section.props.features) ? section.props.features : []

      function setFeatures(next: typeof features) {
        dispatch(updateSectionProps({ id: section.id, props: { features: next } }))
      }

      return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Feature grid section properties">
          <Field id={`${section.id}-title`} label="Title" value={section.props.title ?? ''} onChange={(v) => set('title', v)} />

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Features</legend>

            {features.map((feat, i) => (
              <div key={i} className="rounded-md border border-input p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Feature {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setFeatures(features.filter((_, idx) => idx !== i))}
                    className="text-xs text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={`Remove feature ${i + 1}`}
                  >
                    Remove
                  </button>
                </div>
                <Field
                  id={`${section.id}-feat-${i}-title`}
                  label="Title"
                  value={feat.title}
                  onChange={(v) => setFeatures(features.map((f, idx) => idx === i ? { ...f, title: v } : f))}
                  required
                />
                <Field
                  id={`${section.id}-feat-${i}-description`}
                  label="Description"
                  value={feat.description}
                  onChange={(v) => setFeatures(features.map((f, idx) => idx === i ? { ...f, description: v } : f))}
                  required
                  multiline
                />
                <Field
                  id={`${section.id}-feat-${i}-icon`}
                  label="Icon (optional)"
                  value={feat.icon ?? ''}
                  onChange={(v) => setFeatures(features.map((f, idx) => idx === i ? { ...f, icon: v || undefined } : f))}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setFeatures([...features, { title: '', description: '' }])}
              className="w-full rounded-md border border-dashed border-input py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              + Add feature
            </button>
          </fieldset>
        </form>
      )
    }

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
