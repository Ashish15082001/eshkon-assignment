import type { ComponentType } from 'react'
import type { Page, AnySection } from '@/lib/schema/page'
import { sectionRegistry, isRegisteredType } from '@/lib/registry/sectionRegistry'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import UnsupportedSection from '@/components/sections/UnsupportedSection'

// Accepts the strict Page type from the editor AND loosely-typed pages from the
// Contentful adapter (which may include unknown section types from the CMS).
type RenderablePage = Omit<Page, 'sections'> & { sections: AnySection[] }

function SectionSlot({ section }: { section: AnySection }) {
  if (!isRegisteredType(section.type)) {
    return <UnsupportedSection type={section.type} />
  }

  const { component: Component } = sectionRegistry[section.type] as unknown as {
    component: ComponentType<Record<string, unknown>>
  }
  return (
    <ErrorBoundary>
      <Component {...(section.props as Record<string, unknown>)} />
    </ErrorBoundary>
  )
}

export default function PageRenderer({
  page,
  as: Wrapper = 'main',
}: {
  page: RenderablePage
  as?: 'main' | 'div'
}) {
  return (
    <Wrapper id={Wrapper === 'main' ? 'main-content' : undefined}>
      {page.sections.map((section) => (
        <SectionSlot key={section.id} section={section} />
      ))}
    </Wrapper>
  )
}
