import type { Page } from '@/lib/schema/page'

export type BumpType = 'none' | 'patch' | 'minor' | 'major'

export interface DiffResult {
  bump: BumpType
  changelog: string[]
}

function maxBump(a: BumpType, b: BumpType): BumpType {
  const order: BumpType[] = ['none', 'patch', 'minor', 'major']
  return order[Math.max(order.indexOf(a), order.indexOf(b))]
}

export function diffPages(previous: Page, current: Page): DiffResult {
  const changelog: string[] = []
  let bump: BumpType = 'none'

  const prevById = new Map(previous.sections.map((s) => [s.id, s]))
  const currById = new Map(current.sections.map((s) => [s.id, s]))

  // Removed sections → major
  for (const [id, section] of prevById) {
    if (!currById.has(id)) {
      bump = maxBump(bump, 'major')
      changelog.push(`Removed ${section.type} section (${id})`)
    }
  }

  // Added sections → minor
  for (const [id, section] of currById) {
    if (!prevById.has(id)) {
      bump = maxBump(bump, 'minor')
      changelog.push(`Added ${section.type} section (${id})`)
    }
  }

  // Changed sections
  for (const [id, curr] of currById) {
    const prev = prevById.get(id)
    if (!prev) continue

    // Type changed → major
    if (prev.type !== curr.type) {
      bump = maxBump(bump, 'major')
      changelog.push(`Section ${id}: type changed from ${prev.type} to ${curr.type}`)
      continue
    }

    const prevProps = prev.props as Record<string, unknown>
    const currProps = curr.props as Record<string, unknown>

    // Required prop removed → major
    for (const key of Object.keys(prevProps)) {
      if (!(key in currProps) || currProps[key] === undefined) {
        bump = maxBump(bump, 'major')
        changelog.push(`Section ${id}: required prop "${key}" removed`)
      }
    }

    // Prop value changed → patch
    for (const key of Object.keys(currProps)) {
      if (JSON.stringify(prevProps[key]) !== JSON.stringify(currProps[key])) {
        bump = maxBump(bump, 'patch')
        changelog.push(`Section ${id}: prop "${key}" updated`)
      }
    }
  }

  return { bump, changelog }
}

export function incrementVersion(current: string, bump: BumpType): string {
  if (bump === 'none') return current
  const [maj, min, pat] = current.split('.').map(Number)
  switch (bump) {
    case 'major': return `${maj + 1}.0.0`
    case 'minor': return `${maj}.${min + 1}.0`
    case 'patch': return `${maj}.${min}.${pat + 1}`
  }
}
