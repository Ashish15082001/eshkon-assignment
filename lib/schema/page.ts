import { z } from 'zod'

export const HeroPropsSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaUrl: z.string().optional(),
  imageUrl: z.string().optional(),
})

export const FeatureGridPropsSchema = z.object({
  title: z.string().optional(),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
    })
  ),
})

export const TestimonialPropsSchema = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().optional(),
})

export const CtaPropsSchema = z.object({
  headline: z.string(),
  label: z.string(),
  url: z.string(),
  subtext: z.string().optional(),
})

export const SectionSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string(), type: z.literal('hero'), props: HeroPropsSchema }),
  z.object({ id: z.string(), type: z.literal('featureGrid'), props: FeatureGridPropsSchema }),
  z.object({ id: z.string(), type: z.literal('testimonial'), props: TestimonialPropsSchema }),
  z.object({ id: z.string(), type: z.literal('cta'), props: CtaPropsSchema }),
])

// Catch-all for section types not yet in the registry.
// Used only in the Contentful adapter — never mixed into SectionSchema to preserve
// discriminated-union narrowing in the editor (PropsForm, draftPage slice).
export const UnknownSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
})

export const PageSchema = z.object({
  pageId: z.string(),
  slug: z.string(),
  title: z.string(),
  sections: z.array(SectionSchema),
})

export type HeroProps = z.infer<typeof HeroPropsSchema>
export type FeatureGridProps = z.infer<typeof FeatureGridPropsSchema>
export type TestimonialProps = z.infer<typeof TestimonialPropsSchema>
export type CtaProps = z.infer<typeof CtaPropsSchema>
export type Section = z.infer<typeof SectionSchema>
export type UnknownSection = z.infer<typeof UnknownSectionSchema>
// AnySection is what the renderer works with — known typed sections + unknown pass-throughs
export type AnySection = Section | UnknownSection
export type Page = z.infer<typeof PageSchema>
