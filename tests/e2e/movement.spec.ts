import { expect, test } from '@playwright/test'
import { api, startMatch, withKeys } from './helpers'

test('moves forward, rotates and does both at once', async ({ page }) => {
  await startMatch(page)
  const start = (await api.state(page)).player

  const forward = await withKeys(page, ['KeyW'], () => api.step(page, 1))
  expect(forward.player.x - start.x).toBeCloseTo(180, 0) // moveSpeed 180 px/s
  expect(forward.player.y).toBeCloseTo(start.y, 0)

  const right = await withKeys(page, ['KeyD'], () => api.step(page, 0.5))
  expect(right.player.heading - forward.player.heading).toBeCloseTo(1.1, 1) // turnSpeed 2.2 rad/s
  expect(right.player.x).toBeCloseTo(forward.player.x, 1) // turning alone does not move

  const left = await withKeys(page, ['KeyA'], () => api.step(page, 0.5))
  expect(left.player.heading).toBeLessThan(right.player.heading)

  const both = await withKeys(page, ['KeyW', 'KeyD', 'Space'], () => api.step(page, 1))
  expect(Math.hypot(both.player.x - left.player.x, both.player.y - left.player.y)).toBeGreaterThan(100)
  expect(both.player.heading).toBeGreaterThan(left.player.heading)
  expect(both.stats.shots).toBeGreaterThan(0) // moving, turning and firing together
})

test('stays inside the arena', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, { player: { x: 192, y: 360, heading: Math.PI } }) // facing the left edge
  let s = await withKeys(page, ['KeyW'], () => api.step(page, 2))
  expect(s.player.x).toBeCloseTo(s.player.radius, 1)

  await api.setup(page, { player: { x: 100, y: 360, heading: -Math.PI / 2 } }) // facing the top edge
  s = await withKeys(page, ['KeyW'], () => api.step(page, 2.5))
  expect(s.player.y).toBeCloseTo(s.player.radius, 1)
})

test('cannot cross an island', async ({ page }) => {
  await startMatch(page)
  let s = await api.setup(page, { player: { x: 500, y: 360, heading: 0 } }) // straight at the central island
  const island = s.islands[0]!
  const minDistance = island.radius + s.player.radius - 1
  await page.keyboard.down('KeyW')
  for (let i = 0; i < 20; i++) {
    s = await api.step(page, 0.1)
    expect(Math.hypot(s.player.x - island.x, s.player.y - island.y)).toBeGreaterThanOrEqual(minDistance)
  }
  await page.keyboard.up('KeyW')
  expect(s.player.x).toBeLessThan(island.x) // still on the near side
})