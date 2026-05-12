import type { ComponentType } from 'react'
import type { ZodTypeAny, infer as ZodInfer } from 'zod'
import {
  HeroPropsSchema,
  FeatureGridPropsSchema,
  TestimonialPropsSchema,
  CtaPropsSchema,
  type HeroProps,
  type FeatureGridProps,
  type TestimonialProps,
  type CtaProps,
} from '@/lib/schema/page'

// Lazy imports avoid pulling server-only code into the registry type layer
import Hero from '@/components/sections/Hero'
import FeatureGrid from '@/components/sections/FeatureGrid'
import Testimonial from '@/components/sections/Testimonial'
import CTA from '@/components/sections/CTA'

type RegistryEntry<TProps> = {
  component: ComponentType<TProps>
  defaultProps: TProps
  propsSchema: ZodTypeAny
}

type SectionRegistry = {
  hero: RegistryEntry<HeroProps>
  featureGrid: RegistryEntry<FeatureGridProps>
  testimonial: RegistryEntry<TestimonialProps>
  cta: RegistryEntry<CtaProps>
}

export const sectionRegistry: SectionRegistry = {
  hero: {
    component: Hero,
    defaultProps: { headline: 'Your headline here' },
    propsSchema: HeroPropsSchema,
  },
  featureGrid: {
    component: FeatureGrid,
    defaultProps: {
      title: 'Features',
      features: [{ title: 'Feature 1', description: 'Describe your feature.' }],
    },
    propsSchema: FeatureGridPropsSchema,
  },
  testimonial: {
    component: Testimonial,
    defaultProps: { quote: 'This product changed everything.', author: 'Jane Doe' },
    propsSchema: TestimonialPropsSchema,
  },
  cta: {
    component: CTA,
    defaultProps: { headline: 'Ready to get started?', label: 'Get started', url: '#' },
    propsSchema: CtaPropsSchema,
  },
}

export type RegisteredSectionType = keyof SectionRegistry

export function isRegisteredType(type: string): type is RegisteredSectionType {
  return type in sectionRegistry
}
