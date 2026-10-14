import { expect, test } from '@playwright/test'
import { api, startMatch } from './helpers'

test('manual pause freezes everything; resume needs a click and replays no input', async ({ page }) => {
  await startMatch(page, { manual: false })
  await expect.poll(async () => (await api.state(page)).time).toBeGreaterThan(0.3)

  await page.keyboard.press('Escape')
  const dialog = page.getByRole('dialog', { name: 'Paused' })
  await expect(dialog).toBeVisible()
  const frozen = await api.state(page)

  // Held inputs during the pause must be ignored
  await page.keyboard.down('KeyW')
  await page.keyboard.down('KeyE')
  await page.waitForTimeout(1000)
  const still = await api.state(page)
  expect(still.time).toBe(frozen.time)
  expect(still.player.x).toBe(frozen.player.x)
  expect(still.projectiles).toHaveLength(0)

  await dialog.getByRole('button', { name: 'Resume' }).click()
  await page.waitForTimeout(500)
  const resumed = await api.state(page)
  await page.keyboard.up('KeyW')
  await page.keyboard.up('KeyE')
  expect(resumed.time).toBeGreaterThan(frozen.time)
  expect(resumed.time - frozen.time).toBeLessThan(0.9) // the paused second was not counted
  expect(resumed.player.x).toBeCloseTo(frozen.player.x, 1) // no movement from the pause
  expect(resumed.projectiles).toHaveLength(0) // no shots from the pause
})

test('losing focus or hiding the tab pauses automatically', async ({ page }) => {
  await startMatch(page, { manual: false })
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()

  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  const dialog = page.getByRole('dialog', { name: 'Paused' })
  await expect(dialog).toBeVisible()
  const frozen = await api.state(page)
  await page.waitForTimeout(800)
  expect((await api.state(page)).time).toBe(frozen.time)
  await dialog.getByRole('button', { name: 'Resume' }).click()
  await expect(dialog).toBeHidden()

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(dialog).toBeVisible()
})

test('the HUD pause button pauses, and Main Menu abandons the match', async ({ page }) => {
  await startMatch(page, { manual: false })
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()
  await page.getByRole('button', { name: 'Pause game' }).click()
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible()
  await page.getByRole('button', { name: 'Main Menu' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('game keys are only captured during an active match', async ({ page }) => {
  const spacePrevented = () =>
    page.evaluate(() => {
      const event = new KeyboardEvent('keydown', { code: 'Space', cancelable: true, bubbles: true })
      window.dispatchEvent(event)
      return event.defaultPrevented
    })

  await startMatch(page, { manual: false })
  expect(await spacePrevented()).toBe(true) // playing
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible()
  expect(await spacePrevented()).toBe(false) // paused
  await page.getByRole('button', { name: 'Main Menu' }).click()
  expect(await spacePrevented()).toBe(false) // menu
})