import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']

function saveAxeReport(url: string, results: AxeResults) {
  const dir = join(process.cwd(), 'tests/e2e/results')
  mkdirSync(dir, { recursive: true })
  const safeName = url.replace(/\//g, '-').replace(/^-+|-+$/g, '')
  writeFileSync(
    join(dir, `axe-${safeName}.json`),
    JSON.stringify(
      {
        url,
        timestamp: new Date().toISOString(),
        violations: results.violations,
        passCount: results.passes.length,
        incompleteCount: results.incomplete.length,
      },
      null,
      2
    )
  )
}

test.describe('Home page', () => {
  test('renders page list heading', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'Pages' })).toBeVisible()
  })

  test('axe: / has no critical or serious violations', async ({ page }) => {
    await page.goto('/')
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze()

    saveAxeReport('/', results)

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0)
  })
})

test.describe('Sign-in page', () => {
  test('renders sign-in form', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('axe: /auth/signin has no critical or serious violations', async ({ page }) => {
    await page.goto('/auth/signin')
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze()

    saveAxeReport('/auth/signin', results)

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0)
  })
})

test.describe('Preview route', () => {
  test('renders hero section on /preview/home', async ({ page }) => {
    await page.goto('/preview/home')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shows 404 for unknown slug', async ({ page }) => {
    const res = await page.goto('/preview/does-not-exist-xyz')
    expect(res?.status()).toBe(404)
  })

  test('CTA button is present and has accessible role', async ({ page }) => {
    await page.goto('/preview/pricing')
    const link = page.getByRole('link')
    await expect(link.first()).toBeVisible()
  })

  test('axe: /preview/home has no critical or serious violations', async ({ page }) => {
    await page.goto('/preview/home')
    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze()

    saveAxeReport('/preview/home', results)

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0)
  })
})

test.describe('Studio route (unauthenticated)', () => {
  test('redirects unauthenticated user to signin', async ({ page }) => {
    await page.goto('/studio/home')
    await expect(page).toHaveURL(/\/api\/auth\/signin/)
  })
})

test.describe('Studio route (authenticated editor)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/auth/signin')
    await page.fill('input[name="email"]', 'editor@example.com')
    await page.fill('input[name="password"]', 'editor123')
    await page.click('button[type="submit"]')
    // Wait until redirected away from signin
    await page.waitForURL((url) => !url.pathname.includes('/signin'), { timeout: 10_000 })
  })

  test('loads studio editor for /studio/home', async ({ page }) => {
    await page.goto('/studio/home')
    await expect(page.getByRole('complementary', { name: 'Studio sidebar' })).toBeVisible()
  })

  test('can add a section', async ({ page }) => {
    await page.goto('/studio/home')
    await page.getByRole('button', { name: /add section/i }).click()
    await page.getByRole('option', { name: /hero/i }).click()
    await expect(page.getByRole('listitem').filter({ hasText: 'Hero' })).toBeVisible()
  })

  test('axe: /studio/home has no critical or serious violations', async ({ page }) => {
    await page.goto('/studio/home')
    await expect(page.getByRole('complementary', { name: 'Studio sidebar' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(AXE_TAGS)
      .analyze()

    saveAxeReport('/studio/home', results)

    const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    expect(blocking, JSON.stringify(blocking, null, 2)).toHaveLength(0)
  })
})
