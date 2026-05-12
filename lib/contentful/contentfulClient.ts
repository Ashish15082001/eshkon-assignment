import { createClient, type EntrySkeletonType } from 'contentful'
import { PageSchema, SectionSchema, UnknownSectionSchema } from '@/lib/schema/page'
import type { Page, AnySection } from '@/lib/schema/page'

// ---------------------------------------------------------------------------
// Contentful content-type shapes (stay inside this file — never re-export)
// ---------------------------------------------------------------------------

interface SectionFields {
  type: string
  props: Record<string, unknown>
}

interface SectionSkeleton extends EntrySkeletonType {
  contentTypeId: 'section'
  fields: SectionFields
}

interface PageSkeleton extends EntrySkeletonType {
  contentTypeId: 'page'
  fields: {
    slug: string
    title: string
    sections: SectionSkeleton[]
  }
}

// ---------------------------------------------------------------------------
// Mock data — used when Contentful credentials are not configured
// ---------------------------------------------------------------------------

const MOCK_PAGES: Pick<Page, 'slug' | 'title'>[] = [
  { slug: 'home', title: 'Home Page' },
  { slug: 'pricing', title: 'Pricing Page' },
  { slug: 'about', title: 'About Us' },
]

const MOCK_PAGE_MAP: Record<string, Page> = {
  home: {
    pageId: 'mock-home',
    slug: 'home',
    title: 'Home Page',
    sections: [
      {
        id: 'mock-hero',
        type: 'hero',
        props: { headline: 'Welcome to Page Studio', subheadline: 'Build pages visually.' },
      },
    ],
  },
  pricing: {
    pageId: 'mock-pricing',
    slug: 'pricing',
    title: 'Pricing Page',
    sections: [
      {
        id: 'mock-cta',
        type: 'cta',
        props: { headline: 'Simple pricing', label: 'Get started', url: '#' },
      },
    ],
  },
  about: {
    pageId: 'mock-about',
    slug: 'about',
    title: 'About Us',
    sections: [
      {
        id: 'mock-testimonial',
        type: 'testimonial',
        props: { quote: 'Great product!', author: 'Jane Doe' },
      },
    ],
  },
}

function hasDeliveryCredentials() {
  return Boolean(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN)
}

function hasPreviewCredentials() {
  return Boolean(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_PREVIEW_TOKEN)
}

// ---------------------------------------------------------------------------
// Client factory — separate delivery and preview clients
// ---------------------------------------------------------------------------

function makeDeliveryClient() {
  const space = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN

  if (!space || !accessToken) {
    throw new Error(
      'Missing Contentful delivery credentials. Set CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN.'
    )
  }

  return createClient({ space, accessToken })
}

function makePreviewClient() {
  const space = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_PREVIEW_TOKEN

  if (!space || !accessToken) {
    throw new Error(
      'Missing Contentful preview credentials. Set CONTENTFUL_SPACE_ID and CONTENTFUL_PREVIEW_TOKEN.'
    )
  }

  return createClient({
    space,
    accessToken,
    host: 'preview.contentful.com',
  })
}

// ---------------------------------------------------------------------------
// Public adapter — the only thing that escapes this file is Page
// ---------------------------------------------------------------------------

export async function getAllPages(preview = false): Promise<Pick<Page, 'slug' | 'title'>[]> {
  if (preview ? !hasPreviewCredentials() : !hasDeliveryCredentials()) {
    return MOCK_PAGES
  }

  const client = preview ? makePreviewClient() : makeDeliveryClient()

  const result = await client.getEntries<PageSkeleton>({
    content_type: 'page',
    select: ['fields.slug', 'fields.title'],
    limit: 200,
  })

  return result.items.map((entry) => ({
    slug: entry.fields.slug,
    title: entry.fields.title,
  }))
}

export async function getPageBySlug(slug: string, preview = false): Promise<Page | null> {
  if (preview ? !hasPreviewCredentials() : !hasDeliveryCredentials()) {
    return MOCK_PAGE_MAP[slug] ?? null
  }

  const client = preview ? makePreviewClient() : makeDeliveryClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (client as any).getEntries({
    content_type: 'page',
    'fields.slug': slug,
    include: 2,
    limit: 1,
  })

  const entry = result.items[0]
  if (!entry) return null

  const pageMeta = PageSchema.omit({ sections: true }).safeParse({
    pageId: entry.sys.id,
    slug: entry.fields.slug,
    title: entry.fields.title,
  })

  if (!pageMeta.success) {
    console.error(`[contentfulClient] Page "${slug}" failed meta validation:`, pageMeta.error.issues)
    return null
  }

  // Validate each section individually — unknown types are preserved as AnySection
  // so the renderer can show UnsupportedSection instead of 404-ing the whole page.
  const rawSections = entry.fields.sections as unknown as unknown[]
  const sections: AnySection[] = Array.isArray(rawSections)
    ? rawSections
        .filter((s): s is NonNullable<typeof s> => Boolean(s && typeof s === 'object' && 'fields' in s))
        .map((s) => {
          const entry = s as { sys: { id: string }; fields: SectionFields }
          const raw = {
            id: entry.sys.id,
            type: entry.fields.type,
            props: entry.fields.props ?? {},
          }
          const known = SectionSchema.safeParse(raw)
          if (known.success) return known.data
          const unknown = UnknownSectionSchema.safeParse(raw)
          if (unknown.success) {
            console.warn(`[contentfulClient] Unknown section type "${raw.type}" on page "${slug}" — rendering as UnsupportedSection`)
            return unknown.data
          }
          return null
        })
        .filter((s): s is AnySection => s !== null)
    : []

  return { ...pageMeta.data, sections } as Page
}
