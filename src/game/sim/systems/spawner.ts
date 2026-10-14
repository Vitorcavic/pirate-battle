import { createEnemy } from '../entities'
import type { EnemyKind, World } from '../types'

const ISLAND_SPAWN_MARGIN = 12
const ENEMY_SPAWN_GAP = 4
const CHASER_VARIANTS = 4

export function stepSpawner(world: World, dt: number): void {
  const interval = world.config.enemySpawnInterval
  world.spawnTimer += dt
  if (world.spawnTimer < interval) return

  // Blocked (too many ships or no free spot): stay "ready" and retry next step
  if (world.enemies.length >= world.config.spawn.maxAliveEnemies) {
    world.spawnTimer = interval
    return
  }
  const kind = pickKind(world)
  const point = findSpawnPoint(world, world.config[kind].radius)
  if (!point) {
    world.spawnTimer = interval
    return
  }

  const heading = Math.atan2(world.player.y - point.y, world.player.x - point.x)
  createEnemy(world, kind, point.x, point.y, heading, world.rng.int(CHASER_VARIANTS))
  world.spawnCount++
  world.spawnTimer -= interval
}

/** The first two spawns are fixed (chaser, shooter) so both types always show up. */
function pickKind(world: World): EnemyKind {
  if (world.spawnCount === 0) return 'chaser'
  if (world.spawnCount === 1) return 'shooter'
  const { chaser, shooter } = world.config
  const total = chaser.spawnWeight + shooter.spawnWeight
  return world.rng.next() * total < chaser.spawnWeight ? 'chaser' : 'shooter'
}

function findSpawnPoint(world: World, radius: number): { x: number; y: number } | null {
  const { arena, spawn } = world.config
  const { player, islands, enemies, rng } = world
  const margin = radius + 8

  for (let attempt = 0; attempt < spawn.maxAttempts; attempt++) {
    const x = rng.range(margin, arena.width - margin)
    const y = rng.range(margin, arena.height - margin)

    if (Math.hypot(x - player.x, y - player.y) < spawn.minDistanceFromPlayer) continue
    if (islands.some((i) => Math.hypot(x - i.x, y - i.y) < i.radius + radius + ISLAND_SPAWN_MARGIN)) continue
    if (enemies.some((e) => Math.hypot(x - e.x, y - e.y) < e.radius + radius + ENEMY_SPAWN_GAP)) continue
    return { x, y }
  }
  return null
}