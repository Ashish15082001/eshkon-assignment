import { NextResponse } from 'next/server'
import { writeFile, readFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getToken } from 'next-auth/jwt'
import { PageSchema } from '@/lib/schema/page'
import { diffPages, incrementVersion } from '@/lib/semver/diff'
import type { Page } from '@/lib/schema/page'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-replace-in-production'
const RELEASES_DIR = join(process.cwd(), 'releases')

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
  const slugDir = join(RELEASES_DIR, current.slug)
  await mkdir(slugDir, { recursive: true })

  const latestPath = join(slugDir, 'latest.json')
  let previous: Snapshot | null = null

  try {
    const raw = await readFile(latestPath, 'utf-8')
    previous = JSON.parse(raw) as Snapshot
  } catch {
    // no prior release
  }

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

    await writeFile(join(slugDir, `${nextVersion}.json`), JSON.stringify(snapshot, null, 2))
    await writeFile(latestPath, JSON.stringify(snapshot, null, 2))

    return NextResponse.json({ version: nextVersion, changelog: diff.changelog })
  }

  // First publish
  const snapshot: Snapshot = {
    version: '1.0.0',
    page: current,
    changelog: ['Initial release'],
    publishedAt: new Date().toISOString(),
  }

  await writeFile(join(slugDir, '1.0.0.json'), JSON.stringify(snapshot, null, 2))
  await writeFile(latestPath, JSON.stringify(snapshot, null, 2))

  return NextResponse.json({ version: '1.0.0', changelog: ['Initial release'] })
}
