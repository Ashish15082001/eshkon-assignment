import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { Page } from '@/lib/schema/page'

export interface Snapshot {
  version: string
  page: Page
  changelog: string[]
  publishedAt: string
}

const RELEASES_TMP = join('/tmp', 'releases')
const RELEASES_COMMITTED = join(process.cwd(), 'releases')

export async function listVersions(slug: string): Promise<Snapshot[]> {
  const seen = new Set<string>()
  const snapshots: Snapshot[] = []

  for (const dir of [join(RELEASES_TMP, slug), join(RELEASES_COMMITTED, slug)]) {
    try {
      const files = await readdir(dir)
      for (const file of files) {
        if (file === 'latest.json') continue
        const version = file.replace('.json', '')
        if (seen.has(version)) continue
        seen.add(version)
        try {
          snapshots.push(JSON.parse(await readFile(join(dir, file), 'utf-8')) as Snapshot)
        } catch { /* corrupt file — skip */ }
      }
    } catch { /* directory missing — skip */ }
  }

  return snapshots.sort((a, b) => {
    const [aMaj, aMin, aPat] = a.version.split('.').map(Number)
    const [bMaj, bMin, bPat] = b.version.split('.').map(Number)
    return bMaj - aMaj || bMin - aMin || bPat - aPat
  })
}

export async function getSnapshot(slug: string, version: string): Promise<Snapshot | null> {
  for (const dir of [join(RELEASES_TMP, slug), join(RELEASES_COMMITTED, slug)]) {
    try {
      return JSON.parse(await readFile(join(dir, `${version}.json`), 'utf-8')) as Snapshot
    } catch { /* not found — try next */ }
  }
  return null
}
