import { expect, test } from '@playwright/test'
import { api, openMenu, SHORT, startMatch } from './helpers'

const settleFrames = (page: import('@playwright/test').Page) =>
  page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

test('main menu', async ({ page }) => {
  await openMenu(page)
  await expect(page.getByTestId('ranking-rows').locator('tr')).toHaveCount(10)
  await expect(page.getByAltText('Pirate Battle')).toBeVisible()
  await expect(page).toHaveScreenshot('menu.png', { fullPage: true })
})

test('arena in a stable state', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, {
    enemies: [
      { kind: 'chaser', x: 760, y: 150, heading: Math.PI },
      { kind: 'shooter', x: 940, y: 480, heading: Math.PI },
    ],
  })
  await api.step(page, 0)
  await settleFrames(page)
  await expect(page.getByTestId('match-screen')).toHaveScreenshot('arena.png')
})

test('result screen', async ({ page }) => {
  await startMatch(page, { settings: SHORT })
  await api.step(page, 200)
  await expect(page.getByTestId('record-status')).toHaveAttribute('data-status', 'saved')
  await expect(page).toHaveScreenshot('result.png')
})