import { expect, test } from '@playwright/test'
import { api, startMatch, withKeys } from './helpers'

test('front cannon respects its cooldown', async ({ page }) => {
  await startMatch(page)
  const brief = await withKeys(page, ['Space'], () => api.step(page, 0.3))
  expect(brief.stats.shots).toBe(1) // cooldown 0.35 s blocks a second shot
  const second = await withKeys(page, ['Space'], () => api.step(page, 0.7)) // 1.0 s total
  expect(second.stats.shots).toBe(3) // at about 0, 0.35 and 0.7 s
})

test('broadside fires three parallel balls per side, with its own cooldown', async ({ page }) => {
  await startMatch(page)
  const left = await withKeys(page, ['KeyQ'], () => api.step(page, 0.05))
  expect(left.projectiles).toHaveLength(3)
  for (const p of left.projectiles) {
    expect(p.vx).toBeCloseTo(0, 0)
    expect(p.vy).toBeCloseTo(-440, 0) // heading 0, port side points up
  }
  const xs = left.projectiles.map((p) => p.x).sort((a, b) => a - b)
  expect(xs[1]! - xs[0]!).toBeCloseTo(14, 0) // spacing between parallel balls
  expect(xs[2]! - xs[1]!).toBeCloseTo(14, 0)

  const right = await withKeys(page, ['KeyE'], () => api.step(page, 0.05))
  expect(right.projectiles.some((p) => p.vy > 0)).toBe(true) // starboard points down

  await withKeys(page, ['KeyQ'], () => api.step(page, 0.9)) // still cooling down
  const cooling = await api.state(page)
  expect(cooling.stats.shots).toBe(2) // one left + one right volley only
  const again = await withKeys(page, ['KeyQ'], () => api.step(page, 0.5)) // past 1.2 s
  expect(again.stats.shots).toBe(3)
})

test('a ball damages once, is removed, and kills score exactly one point', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, { enemies: [{ kind: 'chaser', x: 500, y: 360, heading: Math.PI }] })

  await withKeys(page, ['Space'], () => api.step(page, 0.05)) // a single shot
  const after = await api.step(page, 1)
  expect(after.enemies).toHaveLength(1)
  expect(after.enemies[0]!.health).toBe(10) // 20 - one hit of 10
  expect(after.projectiles).toHaveLength(0) // removed on impact
  expect(after.stats.enemyHits).toBe(1)
  expect(after.score).toBe(0)

  await startMatch(page)
  await api.setup(page, { enemies: [{ kind: 'chaser', x: 500, y: 360, heading: Math.PI }] })
  const killed = await withKeys(page, ['Space'], () => api.step(page, 1.2))
  expect(killed.enemies).toHaveLength(0)
  expect(killed.score).toBe(1)
  expect(killed.stats.enemiesDestroyed).toBe(1)
  expect(killed.player.health).toBe(100)
  const later = await api.step(page, 2)
  expect(later.score).toBe(1) // never counted twice
})

test('islands stop cannonballs', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, { player: { x: 400, y: 360, heading: 0 } }) // central island ahead
  await withKeys(page, ['Space'], () => api.step(page, 0.05))
  const s = await api.step(page, 0.6)
  expect(s.stats.obstacleHits).toBeGreaterThanOrEqual(1)
  expect(s.projectiles).toHaveLength(0)
})

test('a Chaser rams the player, explodes, and does not score', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, { enemies: [{ kind: 'chaser', x: 300, y: 360, heading: Math.PI }] })
  const s = await api.step(page, 1.5)
  expect(s.player.health).toBe(80) // collisionDamage 20
  expect(s.enemies).toHaveLength(0)
  expect(s.score).toBe(0)
  expect(s.stats.enemiesDestroyed).toBe(1)
})

test('a Shooter closes in and fires at the player', async ({ page }) => {
  await startMatch(page)
  await api.setup(page, { enemies: [{ kind: 'shooter', x: 480, y: 500, heading: Math.PI }] })
  const s = await api.step(page, 5)
  expect(s.stats.shots).toBeGreaterThanOrEqual(2)
  expect(s.player.health).toBeLessThan(100)
  expect((100 - s.player.health) % 8).toBe(0) // only cannonballs (8 damage), never a collision
  const shooter = s.enemies[0]!
  const distance = Math.hypot(shooter.x - s.player.x, shooter.y - s.player.y)
  expect(distance).toBeGreaterThan(150)
  expect(distance).toBeLessThanOrEqual(320) // inside its attack range
})

test('enemies never overlap an island', async ({ page }) => {
  await startMatch(page)
  let s = await api.setup(page, { enemies: [{ kind: 'chaser', x: 900, y: 360, heading: Math.PI }] })
  const islands = s.islands
  for (let i = 0; i < 32; i++) {
    s = await api.step(page, 0.25)
    for (const enemy of s.enemies) {
      for (const island of islands) {
        const distance = Math.hypot(enemy.x - island.x, enemy.y - island.y)
        expect(distance).toBeGreaterThanOrEqual(island.radius + enemy.radius - 1)
      }
    }
  }
})