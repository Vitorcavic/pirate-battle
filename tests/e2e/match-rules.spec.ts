import { expect, test } from '@playwright/test'
import { api, SHORT, startMatch, waitForApi, withKeys } from './helpers'

test('ending by time freezes the world and shows the result', async ({ page }) => {
  await startMatch(page, { settings: SHORT })
  const ended = await api.step(page, 200)
  expect(ended.status).toBe('ended')
  expect(ended.endReason).toBe('time')
  expect(ended.time).toBe(60)

  const later = await withKeys(page, ['KeyW', 'Space'], () => api.step(page, 3))
  expect(later.time).toBe(ended.time)
  expect(later.player).toEqual(ended.player)
  expect(later.projectiles).toEqual(ended.projectiles)
  expect(later.stats.shots).toBe(ended.stats.shots)

  await expect(page.getByTestId('result-reason')).toHaveText('Time is up')
  await expect(page.getByTestId('result-duration')).toHaveText('60.0 s')
})

test('dying ends the match; Play Again restarts clean', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, {
    player: { health: 15 },
    enemies: [{ kind: 'chaser', x: 300, y: 360, heading: Math.PI }],
  })
  const ended = await api.step(page, 3)
  expect(ended.status).toBe('ended')
  expect(ended.endReason).toBe('death')
  expect(ended.player.health).toBe(0)
  expect(ended.score).toBe(0)

  const later = await withKeys(page, ['KeyW', 'Space'], () => api.step(page, 2))
  expect(later.time).toBe(ended.time)
  expect(later.player).toEqual(ended.player)

  await expect(page.getByTestId('result-reason')).toHaveText('Ship sunk')
  await page.getByRole('button', { name: 'Play Again' }).click()
  await waitForApi(page)
  const fresh = await api.state(page)
  expect(fresh.status).toBe('playing')
  expect(fresh.time).toBe(0)
  expect(fresh.score).toBe(0)
  expect(fresh.spawnCount).toBe(0)
  expect(fresh.player.health).toBe(100)
  expect(fresh.enemies).toHaveLength(0)
  expect(fresh.projectiles).toHaveLength(0)
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('the result survives a refresh until the player leaves it', async ({ page }) => {
  await startMatch(page, { settings: SHORT })
  await api.step(page, 200)
  await expect(page.getByTestId('result-reason')).toHaveText('Time is up')
  const score = await page.getByTestId('result-score').innerText()
  const duration = await page.getByTestId('result-duration').innerText()

  await page.reload()
  await expect(page.getByTestId('result-score')).toHaveText(score)
  await expect(page.getByTestId('result-duration')).toHaveText(duration)
  await expect(page.getByTestId('result-reason')).toHaveText('Time is up')

  await page.getByRole('button', { name: 'Main Menu' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})