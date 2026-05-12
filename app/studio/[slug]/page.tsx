import { notFound } from 'next/navigation'
import { getPageBySlug } from '@/lib/contentful/contentfulClient'
import StudioEditor from '@/components/studio/StudioEditor'

export default async function StudioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getPageBySlug(slug, true)

  if (!page) notFound()

  return <StudioEditor initialPage={page} />
}
