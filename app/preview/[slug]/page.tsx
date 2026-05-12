import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/contentful/contentfulClient'
import PageRenderer from '@/components/PageRenderer'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  return { title: page?.title ?? slug }
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <ErrorBoundary>
      <PageRenderer page={page} />
    </ErrorBoundary>
  )
}
