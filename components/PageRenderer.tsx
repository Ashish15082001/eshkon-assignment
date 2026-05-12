import type { ComponentType } from 'react'
import type { Page, Section } from '@/lib/schema/page'
import { sectionRegistry } from '@/lib/registry/sectionRegistry'
import ErrorBoundary from '@/components/shared/ErrorBoundary'

function SectionSlot({ section }: { section: Section }) {
  // Double cast via unknown: Zod validates data at the adapter boundary; registry keys match Section types 1-to-1
  const { component: Component } = sectionRegistry[section.type] as unknown as {
    component: ComponentType<Record<string, unknown>>
  }
  return (
    <ErrorBoundary>
      <Component {...(section.props as Record<string, unknown>)} />
    </ErrorBoundary>
  )
}

export default function PageRenderer({ page }: { page: Page }) {
  return (
    <main>
      {page.sections.map((section) => (
        <SectionSlot key={section.id} section={section} />
      ))}
    </main>
  )
}
