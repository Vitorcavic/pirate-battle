/** Units: distances in world px, time in seconds, angles in radians. */

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
  spawnWeight: number // relative probability in the spawn distribution
}

export interface IslandConfig {
  x: number
  y: number
  radius: number
}

export interface GameConfig {
  /** User-editable (Options screen) */
  sessionDuration: number // seconds, see SESSION_DURATION_LIMITS
  enemySpawnInterval: number // seconds, see SPAWN_INTERVAL_LIMITS

  arena: { width: number; height: number; islands: IslandConfig[] }
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
  /** Fixed simulation step (seconds). */
  fixedStep: number
}

export const SESSION_DURATION_LIMITS = { min: 60, max: 180 } as const
/** Documented limits (the README must mention them). */
export const SPAWN_INTERVAL_LIMITS = { min: 0.5, max: 10 } as const

export const DEFAULT_CONFIG: GameConfig = {
  sessionDuration: 120,
  enemySpawnInterval: 2.5,

  arena: {
    width: 1280,
    height: 720,
    // Radii match the island tile grid: n = round(2r / 64) -> 88 => 3x3, 56 => 2x2
    islands: [
      { x: 640, y: 360, radius: 88 },
      { x: 260, y: 150, radius: 56 },
      { x: 1030, y: 580, radius: 56 },
    ],
  },

  player: {
    maxHealth: 100,
    moveSpeed: 180,
    turnSpeed: 2.2,
    radius: 26, // ~half of the ship width (66px retina * 0.75 scale)
    frontal: {
      cooldown: 0.35,
      damage: 10,
      projectileSpeed: 520,
      projectileLifetime: 1.2,
      projectileRadius: 5,
    },
    side: {
      cooldown: 1.2,
      damage: 8,
      projectileSpeed: 440,
      projectileLifetime: 1.0,
      projectileRadius: 5,
      projectilesPerSide: 3,
      spacing: 14, // distance between the parallel projectiles
    },
  },

  chaser: {
    maxHealth: 20,
    moveSpeed: 130,
    turnSpeed: 1.8,
    radius: 26,
    spawnWeight: 0.6,
    collisionDamage: 20,
  },

  shooter: {
    maxHealth: 30,
    moveSpeed: 90,
    turnSpeed: 1.5,
    radius: 26,
    spawnWeight: 0.4,
    attackRange: 320,
    weapon: {
      cooldown: 1.6,
      damage: 8,
      projectileSpeed: 360,
      projectileLifetime: 1.5,
      projectileRadius: 5,
    },
  },

  spawn: {
    minDistanceFromPlayer: 350,
    maxAttempts: 30,
    maxAliveEnemies: 12,
  },

  fixedStep: 1 / 60,
}

/** Only the two fields the player can change. Used for the per-match snapshot. */
export type UserSettings = Pick<GameConfig, 'sessionDuration' | 'enemySpawnInterval'>

export const DEFAULT_SETTINGS: UserSettings = {
  sessionDuration: DEFAULT_CONFIG.sessionDuration,
  enemySpawnInterval: DEFAULT_CONFIG.enemySpawnInterval,
}

/** Snapshot: a deep clone, so later edits in Options never affect a running match. */
export function buildMatchConfig(settings: UserSettings): GameConfig {
  return structuredClone({ ...DEFAULT_CONFIG, ...settings })
}