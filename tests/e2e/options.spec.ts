import { expect, test } from '@playwright/test'
import { openMenu } from './helpers'

test('options: validation, saving and persistence after a refresh', async ({ page }) => {
  await openMenu(page)
  await page.getByRole('button', { name: 'Options' }).click()
  const duration = page.getByLabel('Game session time')
  const spawn = page.getByLabel('Enemy spawn time')

  for (const bad of ['59', '181', '']) {
    await duration.fill(bad)
    await expect(page.getByText('Must be between 60 and 180 seconds.')).toBeVisible()
  }
  await duration.fill('90')
  await spawn.fill('0.1')
  await expect(page.getByText('Must be between 0.5 and 10 seconds.')).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Options saved.')).toHaveCount(0) // invalid input is never saved

  await spawn.fill('3')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Options saved.')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByLabel('Game session time')).toHaveValue('90')
  await expect(page.getByLabel('Enemy spawn time')).toHaveValue('3')

  // The saved options are what the next match uses
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect(page.getByTestId('hud-time')).toHaveText('1:30')
})