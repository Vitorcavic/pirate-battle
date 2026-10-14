import type { GameController } from './GameController'
import { createEnemy } from './sim/entities'
import type { EndReason, EnemyKind, MatchStatus, SimEvent } from './sim/types'

export interface TestStats {
  shots: number // one per volley: a broadside of 3 balls counts once
  enemyHits: number
  playerHits: number // includes a Chaser impact
  obstacleHits: number
  enemiesDestroyed: number
}

export interface TestState {
  status: MatchStatus
  endReason: EndReason | null
  paused: boolean
  time: number
  score: number
  spawnCount: number
  seed: number
  player: { x: number; y: number; heading: number; health: number; radius: number }
  cooldowns: { front: number; left: number; right: number }
  enemies: { id: number; kind: EnemyKind; x: number; y: number; heading: number; health: number; radius: number }[]
  projectiles: { id: number; owner: 'player' | 'enemy'; x: number; y: number; vx: number; vy: number }[]
  islands: { x: number; y: number; radius: number }[]
  stats: TestStats
}

/** Scenario setup only: placement and spawner switch. Rules are untouched. */
export interface TestScenario {
  spawns?: boolean // false keeps the spawner idle
  player?: { x?: number; y?: number; heading?: number; health?: number }
  enemies?: { kind: EnemyKind; x: number; y: number; heading?: number }[]
}

export interface TestApi {
  getState(): TestState
  /** Advances the real simulation (with the real input) by `seconds`, in fixed steps. */
  step(seconds: number): TestState
  setup(scenario: TestScenario): TestState
}

declare global {
  interface Window {
    __pb?: TestApi
  }
}

export function installTestApi(game: GameController): () => void {
  const stats: TestStats = { shots: 0, enemyHits: 0, playerHits: 0, obstacleHits: 0, enemiesDestroyed: 0 }

  const count = (events: SimEvent[]): void => {
    for (const event of events) {
      if (event.type === 'shot') stats.shots++
      else if (event.type === 'enemyDestroyed') stats.enemiesDestroyed++
      else if (event.type === 'hit') {
        if (event.target === 'enemy') stats.enemyHits++
        else if (event.target === 'player') stats.playerHits++
        else stats.obstacleHits++
      }
    }
  }

  const read = (): TestState => {
    const world = game.getWorld()
    const { player } = world
    return {
      status: world.status,
      endReason: world.endReason,
      paused: game.isPaused(),
      time: world.time,
      score: world.score,
      spawnCount: world.spawnCount,
      seed: world.seed,
      player: { x: player.x, y: player.y, heading: player.heading, health: player.health, radius: player.radius },
      cooldowns: { ...world.cooldowns },
      enemies: world.enemies.map((e) => ({
        id: e.id, kind: e.kind, x: e.x, y: e.y, heading: e.heading, health: e.health, radius: e.radius,
      })),
      projectiles: world.projectiles.map((p) => ({
        id: p.id, owner: p.owner, x: p.x, y: p.y, vx: p.vx, vy: p.vy,
      })),
      islands: world.islands.map((i) => ({ ...i })),
      stats: { ...stats },
    }
  }

  const api: TestApi = {
    getState: read,
    step(seconds) {
      count(game.stepManual(seconds))
      return read()
    },
    setup(scenario) {
      const world = game.getWorld()
      if (scenario.spawns === false) world.config.spawn.maxAliveEnemies = 0 // match snapshot only
      if (scenario.player) Object.assign(world.player, scenario.player)
      for (const enemy of scenario.enemies ?? []) {
        createEnemy(world, enemy.kind, enemy.x, enemy.y, enemy.heading ?? Math.PI)
      }
      return read()
    },
  }

  window.__pb = api
  return () => {
    if (window.__pb === api) delete window.__pb
  }
}