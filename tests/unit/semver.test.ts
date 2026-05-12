import { diffPages, incrementVersion } from '@/lib/semver/diff'
import type { Page } from '@/lib/schema/page'

const base: Page = {
  pageId: 'page-test',
  slug: 'test',
  title: 'Test',
  sections: [{ id: 's1', type: 'hero', props: { headline: 'Hello' } }],
}

describe('diffPages', () => {
  it('returns none when pages are identical', () => {
    const { bump } = diffPages(base, base)
    expect(bump).toBe('none')
  })

  it('returns patch when a prop value changes', () => {
    const modified: Page = {
      ...base,
      sections: [{ id: 's1', type: 'hero', props: { headline: 'New headline' } }],
    }
    const { bump, changelog } = diffPages(base, modified)
    expect(bump).toBe('patch')
    expect(changelog.some((c) => c.includes('headline'))).toBe(true)
  })

  it('returns minor when a section is added', () => {
    const modified: Page = {
      ...base,
      sections: [
        ...base.sections,
        { id: 's2', type: 'cta', props: { headline: 'Go', label: 'Go', url: '#' } },
      ],
    }
    const { bump, changelog } = diffPages(base, modified)
    expect(bump).toBe('minor')
    expect(changelog.some((c) => c.includes('Added'))).toBe(true)
  })

  it('returns major when a section is removed', () => {
    const modified: Page = { ...base, sections: [] }
    const { bump, changelog } = diffPages(base, modified)
    expect(bump).toBe('major')
    expect(changelog.some((c) => c.includes('Removed'))).toBe(true)
  })

  it('returns major when section type changes', () => {
    const modified: Page = {
      ...base,
      sections: [{ id: 's1', type: 'cta', props: { headline: 'Go', label: 'Go', url: '#' } }],
    }
    const { bump } = diffPages(base, modified)
    expect(bump).toBe('major')
  })

  it('major beats minor when both occur', () => {
    const modified: Page = {
      ...base,
      sections: [
        { id: 's2', type: 'cta', props: { headline: 'New', label: 'Go', url: '#' } },
      ],
    }
    const { bump } = diffPages(base, modified)
    expect(bump).toBe('major')
  })
})

describe('incrementVersion', () => {
  it('bumps patch correctly', () => expect(incrementVersion('1.2.3', 'patch')).toBe('1.2.4'))
  it('bumps minor correctly', () => expect(incrementVersion('1.2.3', 'minor')).toBe('1.3.0'))
  it('bumps major correctly', () => expect(incrementVersion('1.2.3', 'major')).toBe('2.0.0'))
  it('returns same version for none', () => expect(incrementVersion('1.2.3', 'none')).toBe('1.2.3'))
})
