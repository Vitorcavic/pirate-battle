import { circlesOverlap } from '../collision'
import type { WeaponConfig } from '../config'
import type { EnemyState, InputState, Island, Projectile, World } from '../types'

export function stepCombat(world: World, input: InputState, dt: number): void {
  tickCooldowns(world, dt)
  firePlayerWeapons(world, input)
  moveProjectiles(world, dt)
  resolveProjectileHits(world)
  removeDead(world.projectiles)
  removeDead(world.enemies)
}

function tickCooldowns(world: World, dt: number): void {
  const cd = world.cooldowns
  cd.front = Math.max(0, cd.front - dt)
  cd.left = Math.max(0, cd.left - dt)
  cd.right = Math.max(0, cd.right - dt)
}

function spawnProjectile(
  world: World,
  owner: Projectile['owner'],
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  weapon: WeaponConfig,
): void {
  world.projectiles.push({
    id: world.nextId++,
    owner,
    x,
    y,
    vx: dirX * weapon.projectileSpeed,
    vy: dirY * weapon.projectileSpeed,
    radius: weapon.projectileRadius,
    damage: weapon.damage,
    ttl: weapon.projectileLifetime,
    dead: false,
  })
}

function firePlayerWeapons(world: World, input: InputState): void {
  const { player, cooldowns, config } = world

  if (input.fireFront && cooldowns.front <= 0) {
    const w = config.player.frontal
    const dx = Math.cos(player.heading)
    const dy = Math.sin(player.heading)
    const reach = player.radius + w.projectileRadius
    spawnProjectile(world, 'player', player.x + dx * reach, player.y + dy * reach, dx, dy, w)
    world.events.push({ type: 'shot', x: player.x + dx * reach, y: player.y + dy * reach })
    cooldowns.front = w.cooldown
  }

  if (input.fireLeft && cooldowns.left <= 0) {
    fireBroadside(world, -1)
    cooldowns.left = config.player.side.cooldown
  }
  if (input.fireRight && cooldowns.right <= 0) {
    fireBroadside(world, 1)
    cooldowns.right = config.player.side.cooldown
  }
}

/** side: -1 = left (port), 1 = right (starboard). Three parallel shots along the hull. */
function fireBroadside(world: World, side: -1 | 1): void {
  const { player, config } = world
  const w = config.player.side
  const forwardX = Math.cos(player.heading)
  const forwardY = Math.sin(player.heading)
  const dirX = Math.cos(player.heading + (side * Math.PI) / 2)
  const dirY = Math.sin(player.heading + (side * Math.PI) / 2)
  const baseX = player.x + dirX * player.radius
  const baseY = player.y + dirY * player.radius

  for (let i = 0; i < w.projectilesPerSide; i++) {
    const along = (i - (w.projectilesPerSide - 1) / 2) * w.spacing
    spawnProjectile(world, 'player', baseX + forwardX * along, baseY + forwardY * along, dirX, dirY, w)
  }
  world.events.push({ type: 'shot', x: baseX, y: baseY })
}

function moveProjectiles(world: World, dt: number): void {
  for (const p of world.projectiles) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.ttl -= dt
    if (p.ttl <= 0) p.dead = true
  }
}

function hitsIsland(p: Projectile, islands: Island[]): boolean {
  for (const island of islands) {
    if (circlesOverlap(p.x, p.y, p.radius, island.x, island.y, island.radius)) return true
  }
  return false
}

function resolveProjectileHits(world: World): void {
  const { arena } = world.config
  const { player, enemies, islands, events } = world

  for (const p of world.projectiles) {
    if (p.dead) continue

    // Left the arena
    if (p.x < -p.radius || p.y < -p.radius || p.x > arena.width + p.radius || p.y > arena.height + p.radius) {
      p.dead = true
      continue
    }

    // Blocked by an island
    if (hitsIsland(p, islands)) {
      p.dead = true
      events.push({ type: 'hit', x: p.x, y: p.y, target: 'obstacle' })
      continue
    }

    if (p.owner === 'player') {
      for (const enemy of enemies) {
        if (enemy.dead || !circlesOverlap(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) continue
        hitEnemy(world, enemy, p)
        break // one projectile damages one target, once
      }
    } else if (player.health > 0 && circlesOverlap(p.x, p.y, p.radius, player.x, player.y, player.radius)) {
      p.dead = true
      player.health = Math.max(0, player.health - p.damage)
      events.push({ type: 'hit', x: p.x, y: p.y, target: 'player' })
    }
  }
}

function hitEnemy(world: World, enemy: EnemyState, p: Projectile): void {
  p.dead = true // same step: it can never apply damage again
  enemy.health = Math.max(0, enemy.health - p.damage)
  world.events.push({ type: 'hit', x: p.x, y: p.y, target: 'enemy' })
  if (enemy.health === 0) {
    enemy.dead = true
    world.score += 1
    world.events.push({ type: 'enemyDestroyed', x: enemy.x, y: enemy.y })
  }
}

/** In-place compaction: no new array per step. */
function removeDead<T extends { dead: boolean }>(items: T[]): void {
  let kept = 0
  for (const item of items) {
    if (!item.dead) items[kept++] = item
  }
  items.length = kept
}