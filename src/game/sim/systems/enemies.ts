import { circlesOverlap, clampToArena, resolveIslands } from '../collision'
import { clamp, normalizeAngle } from '../math'
import type { EnemyState, Island, World } from '../types'
import { spawnProjectile } from './combat'

/** Extra clearance kept from islands while steering around them. */
const AVOID_MARGIN = 24
/** Shooters stop approaching at this fraction of their attack range. */
const SHOOTER_HOLD_RATIO = 0.75
/** Shooters only fire when aimed within this angle (radians). */
const SHOOTER_AIM_TOLERANCE = 0.2

export function updateEnemies(world: World, dt: number): void {
  const { enemies, player, islands, config } = world

  for (const enemy of enemies) {
    if (enemy.dead) continue
    enemy.cooldown = Math.max(0, enemy.cooldown - dt)
    if (enemy.kind === 'chaser') updateChaser(world, enemy, dt)
    else updateShooter(world, enemy, dt)
    resolveIslands(enemy, islands)
    clampToArena(enemy, config.arena)
  }

  separateEnemies(enemies)

  // Chaser impact: damages the player, explodes, does NOT score
  if (player.health <= 0) return
  for (const enemy of enemies) {
    if (enemy.dead || enemy.kind !== 'chaser') continue
    if (!circlesOverlap(enemy.x, enemy.y, enemy.radius, player.x, player.y, player.radius)) continue
    player.health = Math.max(0, player.health - config.chaser.collisionDamage)
    enemy.dead = true
    world.events.push({ type: 'hit', x: enemy.x, y: enemy.y, target: 'player' })
    world.events.push({ type: 'enemyDestroyed', x: enemy.x, y: enemy.y })
    if (player.health <= 0) return
  }
}

function updateChaser(world: World, enemy: EnemyState, dt: number): void {
  const { player, islands, config } = world
  const toPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x)
  const desired = avoidIslands(enemy, player.x, player.y, toPlayer, islands)
  turnToward(enemy, desired, config.chaser.turnSpeed * dt)
  advance(enemy, config.chaser.moveSpeed * dt)
}

function updateShooter(world: World, enemy: EnemyState, dt: number): void {
  const { player, islands, config } = world
  const stats = config.shooter
  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const dist = Math.hypot(dx, dy)
  const toPlayer = Math.atan2(dy, dx)

  const approaching = dist > stats.attackRange * SHOOTER_HOLD_RATIO
  const desired = approaching ? avoidIslands(enemy, player.x, player.y, toPlayer, islands) : toPlayer
  turnToward(enemy, desired, stats.turnSpeed * dt)
  if (approaching) advance(enemy, stats.moveSpeed * dt)

  const aimError = Math.abs(normalizeAngle(toPlayer - enemy.heading))
  if (player.health > 0 && dist <= stats.attackRange && aimError <= SHOOTER_AIM_TOLERANCE && enemy.cooldown <= 0) {
    const dirX = Math.cos(enemy.heading)
    const dirY = Math.sin(enemy.heading)
    const reach = enemy.radius + stats.weapon.projectileRadius
    const x = enemy.x + dirX * reach
    const y = enemy.y + dirY * reach
    spawnProjectile(world, 'enemy', x, y, dirX, dirY, stats.weapon)
    world.events.push({ type: 'shot', x, y })
    enemy.cooldown = stats.weapon.cooldown
  }
}

function turnToward(enemy: EnemyState, angle: number, maxTurn: number): void {
  const diff = normalizeAngle(angle - enemy.heading)
  enemy.heading += clamp(diff, -maxTurn, maxTurn)
}

function advance(enemy: EnemyState, distance: number): void {
  enemy.x += Math.cos(enemy.heading) * distance
  enemy.y += Math.sin(enemy.heading) * distance
}

/**
 * If an island blocks the straight path to the target, returns the tangent
 * direction that passes it; otherwise returns `desired` unchanged.
 */
function avoidIslands(
  enemy: EnemyState,
  targetX: number,
  targetY: number,
  desired: number,
  islands: Island[],
): number {
  const dirX = Math.cos(desired)
  const dirY = Math.sin(desired)
  const targetDist = Math.hypot(targetX - enemy.x, targetY - enemy.y)
  let result = desired
  let nearest = Infinity

  for (const island of islands) {
    const ix = island.x - enemy.x
    const iy = island.y - enemy.y
    const along = ix * dirX + iy * dirY
    if (along <= 0 || along > targetDist || along >= nearest) continue

    const cross = dirX * iy - dirY * ix // |i| * sin(bearing - desired)
    const clearance = island.radius + enemy.radius + AVOID_MARGIN
    if (Math.abs(cross) >= clearance) continue

    const spread = Math.asin(Math.min(1, clearance / Math.hypot(ix, iy)))
    const bearing = Math.atan2(iy, ix)
    result = cross >= 0 ? bearing - spread : bearing + spread
    nearest = along
  }
  return result
}

/** Keeps ships from stacking on top of each other. */
function separateEnemies(enemies: EnemyState[]): void {
  for (let i = 0; i < enemies.length; i++) {
    const a = enemies[i]!
    if (a.dead) continue
    for (let j = i + 1; j < enemies.length; j++) {
      const b = enemies[j]!
      if (b.dead) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const minDist = a.radius + b.radius
      const distSq = dx * dx + dy * dy
      if (distSq >= minDist * minDist) continue
      const dist = Math.sqrt(distSq) || 0.0001
      const push = (minDist - dist) / 2
      const nx = dx / dist
      const ny = dy / dist
      a.x -= nx * push
      a.y -= ny * push
      b.x += nx * push
      b.y += ny * push
    }
  }
}