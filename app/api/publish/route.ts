import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getToken } from 'next-auth/jwt'
import { PageSchema } from '@/lib/schema/page'
import { diffPages, incrementVersion } from '@/lib/semver/diff'
import type { Page } from '@/lib/schema/page'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-replace-in-production'

// On Vercel the project root is read-only; write to /tmp and read from both.
const RELEASES_COMMITTED = join(process.cwd(), 'releases')
const RELEASES_WRITE = process.env.VERCEL ? join('/tmp', 'releases') : RELEASES_COMMITTED

async function readLatestSnapshot(slug: string): Promise<Snapshot | null> {
  const candidates = [
    join(RELEASES_WRITE, slug, 'latest.json'),
    join(RELEASES_COMMITTED, slug, 'latest.json'),
  ]
  for (const p of candidates) {
    try {
      return JSON.parse(await readFile(p, 'utf-8')) as Snapshot
    } catch { /* try next */ }
  }
  return null
}

interface Snapshot {
  version: string
  page: Page
  changelog: string[]
  publishedAt: string
}

export async function POST(req: Request) {
  const token = await getToken({ req: req as Parameters<typeof getToken>[0]['req'], secret: SECRET })
  if (!token || token.role !== 'publisher') {
    return NextResponse.json({ error: 'Forbidden: publisher role required' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = PageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid page data', issues: parsed.error.issues }, { status: 400 })
  }

  const current = parsed.data
  const slugDir = join(RELEASES_WRITE, current.slug)
  await mkdir(slugDir, { recursive: true })

  const previous = await readLatestSnapshot(current.slug)

  if (previous) {
    const diff = diffPages(previous.page, current)

    if (diff.bump === 'none') {
      return NextResponse.json({ unchanged: true, version: previous.version })
    }

    const nextVersion = incrementVersion(previous.version, diff.bump)
    const snapshot: Snapshot = {
      version: nextVersion,
      page: current,
      changelog: diff.changelog,
      publishedAt: new Date().toISOString(),
    }

    const serialised = JSON.stringify(snapshot, null, 2)
    await writeFile(join(slugDir, `${nextVersion}.json`), serialised)
    await writeFile(join(slugDir, 'latest.json'), serialised)

    return NextResponse.json({ version: nextVersion, changelog: diff.changelog })
  }

  // First publish
  const snapshot: Snapshot = {
    version: '1.0.0',
    page: current,
    changelog: ['Initial release'],
    publishedAt: new Date().toISOString(),
  }

  const serialised = JSON.stringify(snapshot, null, 2)
  await writeFile(join(slugDir, '1.0.0.json'), serialised)
  await writeFile(join(slugDir, 'latest.json'), serialised)

  return NextResponse.json({ version: '1.0.0', changelog: ['Initial release'] })
}
