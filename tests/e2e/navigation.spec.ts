import { expect, test } from '@playwright/test'
import { api, centerOf, openMenu, startMatch, trackErrors } from './helpers'

test('abandoning matches records nothing and repeated navigation stays clean', async ({ page }) => {
  const errors = trackErrors(page)
  await openMenu(page, { query: 'scenario=empty' })

  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Pause game' })).toBeEnabled()
    await page.getByRole('button', { name: 'Pause game' }).click()
    await page.getByRole('button', { name: 'Main Menu' }).click()
    await expect(page.locator('canvas')).toHaveCount(0)
    await page.getByRole('button', { name: 'Options' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
  }

  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('list-empty')).toBeVisible()
  await page.reload() // an abandoned match is not resumed or recorded
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('on-screen controls work with several fingers at once', async ({ page }) => {
  await startMatch(page, { query: 'touch=1' })
  const forward = await centerOf(page.getByTestId('touch-forward'))
  const fire = await centerOf(page.getByTestId('touch-fireFront'))
  const start = (await api.state(page)).player

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...forward, id: 1 }, { ...fire, id: 2 }],
  })
  const moving = await api.step(page, 1)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  expect(moving.player.x - start.x).toBeGreaterThan(100) // moved...
  expect(moving.stats.shots).toBeGreaterThanOrEqual(2) // ...and fired, simultaneously

  const idle = await api.step(page, 0.5) // fingers are up: nothing keeps running
  expect(idle.player.x).toBeCloseTo(moving.player.x, 1)
})