import { createClient, type EntrySkeletonType } from 'contentful'
import { PageSchema } from '@/lib/schema/page'
import type { Page } from '@/lib/schema/page'

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
  const client = preview ? makePreviewClient() : makeDeliveryClient()

  const result = await client.getEntries<PageSkeleton>({
    content_type: 'page',
    'fields.slug': slug,
    include: 2,
    limit: 1,
  })

  const entry = result.items[0]
  if (!entry) return null

  const raw = {
    slug: entry.fields.slug,
    title: entry.fields.title,
    sections: Array.isArray(entry.fields.sections)
      ? entry.fields.sections
          .filter((s): s is NonNullable<typeof s> => Boolean(s && 'fields' in s))
          .map((s) => ({
            id: s.sys.id,
            type: (s as unknown as { fields: SectionFields }).fields.type,
            props: (s as unknown as { fields: SectionFields }).fields.props ?? {},
          }))
      : [],
  }

  const parsed = PageSchema.safeParse(raw)

  if (!parsed.success) {
    console.error(
      `[contentfulClient] Page "${slug}" failed schema validation:`,
      parsed.error.issues
    )
    return null
  }

  return parsed.data
}
