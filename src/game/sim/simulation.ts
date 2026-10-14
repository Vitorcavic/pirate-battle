import { buildMatchConfig, type UserSettings } from './config'
import { createEnemy } from './entities'
import { randomSeed, Rng } from './random'
import { stepCombat } from './systems/combat'
import { updateEnemies } from './systems/enemies'
import { movePlayer } from './systems/movement'
import { stepSpawner } from './systems/spawner'
import type { EndReason, EnemyKind, EnemyState, InputState, World } from './types'

/** Clamps long frames (tab switch, breakpoint) to avoid the "spiral of death". */
const MAX_FRAME_DT = 0.1

export class Simulation {
  readonly world: World
  private accumulator = 0

  constructor(settings: UserSettings, seed: number = randomSeed()) {
    const config = buildMatchConfig(settings)
    this.world = {
      config,
      seed,
      rng: new Rng(seed),
      status: 'playing',
      endReason: null,
      time: 0,
      score: 0,
      nextId: 1,
      spawnTimer: 0,
      spawnCount: 0,
      player: {
        x: config.arena.width * 0.15,
        y: config.arena.height * 0.5,
        heading: 0,
        health: config.player.maxHealth,
        maxHealth: config.player.maxHealth,
        radius: config.player.radius,
      },
      cooldowns: { front: 0, left: 0, right: 0 },
      enemies: [],
      projectiles: [],
      islands: config.arena.islands.map((island) => ({ ...island })),
      events: [],
    }
  }

  /** Manual spawn, for tests and debugging. Regular spawns come from the spawner. */
  addEnemy(kind: EnemyKind, x: number, y: number, variant = 0): EnemyState {
    return createEnemy(this.world, kind, x, y, Math.PI, variant)
  }

  /** Feed real frame time (seconds). Runs 0..n fixed steps. */
  advance(frameDt: number, input: InputState): void {
    if (this.world.status !== 'playing') return
    this.accumulator += Math.min(frameDt, MAX_FRAME_DT)
    const fixedStep = this.world.config.fixedStep
    while (this.accumulator >= fixedStep && this.world.status === 'playing') {
      this.step(fixedStep, input)
      this.accumulator -= fixedStep
    }
  }

  /** One deterministic step. Tests can call this directly to control time. */
  step(dt: number, input: InputState): void {
    const world = this.world
    if (world.status !== 'playing') return

    movePlayer(world, input, dt)
    stepSpawner(world, dt)
    updateEnemies(world, dt)
    stepCombat(world, input, dt)
    world.time += dt

    if (world.player.health <= 0) {
      this.finish('death')
    } else if (world.time >= world.config.sessionDuration) {
      world.time = world.config.sessionDuration // effective duration never exceeds the limit
      this.finish('time')
    }
  }

  clearEvents(): void {
    this.world.events.length = 0
  }

  /** Used on resume from pause: drop leftover time so nothing "catches up". */
  resetClock(): void {
    this.accumulator = 0
  }

  private finish(reason: EndReason): void {
    this.world.status = 'ended'
    this.world.endReason = reason
    this.world.events.push({ type: 'matchEnded', reason })
  }
}