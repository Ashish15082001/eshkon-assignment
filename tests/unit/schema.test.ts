import { PageSchema, SectionSchema } from '@/lib/schema/page'

describe('SectionSchema', () => {
  it('accepts a valid hero section', () => {
    expect(
      SectionSchema.safeParse({ id: '1', type: 'hero', props: { headline: 'Hello' } }).success
    ).toBe(true)
  })

  it('rejects hero section missing required headline', () => {
    expect(
      SectionSchema.safeParse({ id: '1', type: 'hero', props: {} }).success
    ).toBe(false)
  })

  it('accepts a valid cta section', () => {
    expect(
      SectionSchema.safeParse({ id: '2', type: 'cta', props: { headline: 'Get started', label: 'Start', url: '/start' } }).success
    ).toBe(true)
  })

  it('rejects cta section missing url', () => {
    expect(
      SectionSchema.safeParse({ id: '2', type: 'cta', props: { headline: 'Go', label: 'Go' } }).success
    ).toBe(false)
  })

  it('accepts a valid testimonial section', () => {
    expect(
      SectionSchema.safeParse({ id: '3', type: 'testimonial', props: { quote: 'Great!', author: 'Jane' } }).success
    ).toBe(true)
  })

  it('accepts a valid featureGrid section', () => {
    expect(
      SectionSchema.safeParse({
        id: '4',
        type: 'featureGrid',
        props: { features: [{ title: 'Feat', description: 'Desc' }] },
      }).success
    ).toBe(true)
  })

  it('rejects featureGrid section with feature missing required title', () => {
    expect(
      SectionSchema.safeParse({
        id: '4',
        type: 'featureGrid',
        props: { features: [{ description: 'Desc' }] },
      }).success
    ).toBe(false)
  })

  it('rejects testimonial section missing required quote', () => {
    expect(
      SectionSchema.safeParse({ id: '3', type: 'testimonial', props: { author: 'Jane' } }).success
    ).toBe(false)
  })

  it('rejects testimonial section missing required author', () => {
    expect(
      SectionSchema.safeParse({ id: '3', type: 'testimonial', props: { quote: 'Great!' } }).success
    ).toBe(false)
  })

  it('rejects unknown section type', () => {
    expect(
      SectionSchema.safeParse({ id: '5', type: 'unknown', props: {} }).success
    ).toBe(false)
  })
})

describe('PageSchema', () => {
  it('accepts a valid page', () => {
    expect(
      PageSchema.safeParse({
        pageId: 'page-1',
        slug: 'home',
        title: 'Home',
        sections: [{ id: '1', type: 'hero', props: { headline: 'Hi' } }],
      }).success
    ).toBe(true)
  })

  it('accepts a page with no sections', () => {
    expect(
      PageSchema.safeParse({ pageId: 'page-2', slug: 'empty', title: 'Empty', sections: [] }).success
    ).toBe(true)
  })

  it('rejects a page missing slug', () => {
    expect(
      PageSchema.safeParse({ pageId: 'page-3', title: 'No slug', sections: [] }).success
    ).toBe(false)
  })

  it('rejects a page missing pageId', () => {
    expect(
      PageSchema.safeParse({ slug: 'home', title: 'Home', sections: [] }).success
    ).toBe(false)
  })
})
