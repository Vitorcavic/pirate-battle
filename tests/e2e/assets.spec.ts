import { expect, test } from '@playwright/test'
import { openMenu } from './helpers'

test.describe('asset loading', () => {
  test.use({ serviceWorkers: 'block' }) // lets page.route see every request

  test('shows an error and recovers with Retry', async ({ page }) => {
    const pattern = '**/ship_parts/cannon_ball.png'
    await page.route(pattern, (route) => route.abort())
    await openMenu(page)
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Could not load the game assets' })).toBeVisible()

    await page.unroute(pattern)
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByTestId('match-screen')).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(1)
  })

  test('the error screen leads back to the main menu', async ({ page }) => {
    await page.route('**/ship_parts/cannon_ball.png', (route) => route.abort())
    await openMenu(page)
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Main Menu' }).click()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  })
})