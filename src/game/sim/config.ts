export interface WeaponConfig {
  cooldown: number
  damage: number
  projectileSpeed: number
  projectileLifetime: number
  projectileRadius: number
}

export interface EnemyTypeConfig {
  maxHealth: number
  moveSpeed: number
  turnSpeed: number
  radius: number
  spawnWeight: number
}

export interface GameConfig {
  /** User-editable (Options screen) */
  sessionDuration: number // seconds, 60..180
  enemySpawnInterval: number // seconds, see SPAWN_INTERVAL_LIMITS

  arena: { width: number; height: number }
  player: {
    maxHealth: number
    moveSpeed: number
    turnSpeed: number
    radius: number
    frontal: WeaponConfig
    side: WeaponConfig & { projectilesPerSide: number; spacing: number }
  }
  chaser: EnemyTypeConfig & { collisionDamage: number }
  shooter: EnemyTypeConfig & {
    attackRange: number
    weapon: WeaponConfig
  }
  spawn: {
    minDistanceFromPlayer: number
    maxAttempts: number
    maxAliveEnemies: number
  }
  /** Fixed simulation step (seconds). Rendering interpolates or just reads latest. */
  fixedStep: number
}

export const SESSION_DURATION_LIMITS = { min: 60, max: 180 } as const
// Documented limits (README must mention them)
export const SPAWN_INTERVAL_LIMITS = { min: 0.5, max: 10 } as const

export const DEFAULT_CONFIG: GameConfig = {
  sessionDuration: 120,
  enemySpawnInterval: 2.5,
  arena: { width: 1280, height: 720 },
  player: {
    maxHealth: 100,
    moveSpeed: 180,
    turnSpeed: 2.2,
    radius: 22,
    frontal: { cooldown: 0.35, damage: 10, projectileSpeed: 520, projectileLifetime: 1.2, projectileRadius: 5 },
    side: { cooldown: 1.2, damage: 8, projectileSpeed: 440, projectileLifetime: 1.0, projectileRadius: 5, projectilesPerSide: 3, spacing: 14 },
  },
  chaser: { maxHealth: 20, moveSpeed: 130, turnSpeed: 1.8, radius: 20, spawnWeight: 0.6, collisionDamage: 20 },
  shooter: {
    maxHealth: 30, moveSpeed: 90, turnSpeed: 1.5, radius: 22, spawnWeight: 0.4,
    attackRange: 320,
    weapon: { cooldown: 1.6, damage: 8, projectileSpeed: 360, projectileLifetime: 1.5, projectileRadius: 5 },
  },
  spawn: { minDistanceFromPlayer: 350, maxAttempts: 30, maxAliveEnemies: 12 },
  fixedStep: 1 / 60,
}

/** Only the two fields the player can change. Used for the per-match snapshot. */
export type UserSettings = Pick<GameConfig, 'sessionDuration' | 'enemySpawnInterval'>

export function buildMatchConfig(settings: UserSettings): GameConfig {
  // Snapshot: deep-clone so later edits in Options never affect a running match.
  return structuredClone({ ...DEFAULT_CONFIG, ...settings })
}