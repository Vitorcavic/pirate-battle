import type { EnemyKind, EnemyState, World } from './types'

export function createEnemy(
  world: World,
  kind: EnemyKind,
  x: number,
  y: number,
  heading: number,
  variant = 0,
): EnemyState {
  const stats = world.config[kind]
  const enemy: EnemyState = {
    id: world.nextId++,
    kind,
    variant,
    x,
    y,
    heading,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    radius: stats.radius,
    // Shooters wait one full cooldown before their first shot
    cooldown: kind === 'shooter' ? world.config.shooter.weapon.cooldown : 0,
    dead: false,
  }
  world.enemies.push(enemy)
  return enemy
}