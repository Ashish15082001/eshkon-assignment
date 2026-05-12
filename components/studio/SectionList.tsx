'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Section } from '@/lib/schema/page'
import { useAppDispatch } from '@/store'
import { reorderSections, removeSection } from '@/store/slices/draftPage'
import { selectSection } from '@/store/slices/ui'

const SECTION_LABELS: Record<Section['type'], string> = {
  hero: 'Hero',
  featureGrid: 'Feature Grid',
  testimonial: 'Testimonial',
  cta: 'CTA',
}

function SortableItem({
  section,
  isSelected,
  onSelect,
  onRemove,
}: {
  section: Section
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
        isSelected
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card hover:bg-accent'
      }`}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${SECTION_LABELS[section.type]} section`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="4" cy="6" r="1.2" />
          <circle cx="8" cy="6" r="1.2" />
          <circle cx="4" cy="10" r="1.2" />
          <circle cx="8" cy="10" r="1.2" />
        </svg>
      </button>

      <span className="flex-1 font-medium">{SECTION_LABELS[section.type]}</span>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
        aria-label={`Remove ${SECTION_LABELS[section.type]} section`}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>
    </li>
  )
}

interface SectionListProps {
  sections: Section[]
  selectedId: string | null
}

export default function SectionList({ sections, selectedId }: SectionListProps) {
  const dispatch = useAppDispatch()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeIndex = sections.findIndex((s) => s.id === active.id)
    const overIndex = sections.findIndex((s) => s.id === over.id)
    dispatch(reorderSections({ activeIndex, overIndex }))
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No sections yet. Add one below.
      </p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2" aria-label="Page sections">
          {sections.map((section) => (
            <SortableItem
              key={section.id}
              section={section}
              isSelected={selectedId === section.id}
              onSelect={() => dispatch(selectSection(section.id))}
              onRemove={() => dispatch(removeSection(section.id))}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
