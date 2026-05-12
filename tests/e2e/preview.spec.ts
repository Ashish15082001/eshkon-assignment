import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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

  test('axe: /preview/home has no critical violations', async ({ page }) => {
    await page.goto('/preview/home')
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0)
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

  test('axe: /studio/home has no critical violations', async ({ page }) => {
    await page.goto('/studio/home')
    await expect(page.getByRole('complementary', { name: 'Studio sidebar' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0)
  })
})
