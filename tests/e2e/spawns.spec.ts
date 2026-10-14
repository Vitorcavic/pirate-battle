import { expect, test } from '@playwright/test'
import { api, startMatch } from './helpers'

test('spawns follow the interval, both types show up', async ({ page }) => {
  await startMatch(page, { spawns: true })
  const early = await api.step(page, 2.4)
  expect(early.spawnCount).toBe(0)
  const first = await api.step(page, 0.2) // t = 2.6 s
  expect(first.spawnCount).toBe(1)
  expect(first.enemies.map((e) => e.kind)).toEqual(['chaser'])
  const second = await api.step(page, 2.5) // t = 5.1 s
  expect(second.spawnCount).toBe(2)
  expect(second.enemies.some((e) => e.kind === 'shooter')).toBe(true)
})

test('the spawn interval comes from the options', async ({ page }) => {
  await startMatch(page, { spawns: true, settings: { sessionDuration: 120, enemySpawnInterval: 1 } })
  expect((await api.step(page, 0.9)).spawnCount).toBe(0)
  expect((await api.step(page, 0.2)).spawnCount).toBe(1)
  expect((await api.step(page, 1)).spawnCount).toBe(2)
})

test('new enemies appear in free water, away from the player', async ({ page }) => {
  await startMatch(page, { spawns: true })
  let s = await api.state(page)
  for (let i = 0; i < 80 && s.spawnCount === 0; i++) s = await api.step(page, 0.05)
  expect(s.spawnCount).toBe(1)
  const enemy = s.enemies[0]!
  expect(Math.hypot(enemy.x - s.player.x, enemy.y - s.player.y)).toBeGreaterThanOrEqual(340)
  for (const island of s.islands) {
    expect(Math.hypot(enemy.x - island.x, enemy.y - island.y)).toBeGreaterThanOrEqual(island.radius + enemy.radius)
  }
})

test('the same seed gives the same match, another seed does not', async ({ page }) => {
  const play = async (seed: number): Promise<string> => {
    await startMatch(page, { seed, spawns: true })
    return JSON.stringify((await api.step(page, 6)).enemies)
  }
  const a = await play(7)
  const b = await play(7)
  const c = await play(8)
  expect(a).toBe(b)
  expect(a).not.toBe(c)
})