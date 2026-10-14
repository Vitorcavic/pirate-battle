import { buildMatchConfig, type UserSettings } from './config'
import { movePlayer } from './systems/movement'
import { stepCombat } from './systems/combat'
import type { EnemyKind, EnemyState, InputState, World } from './types'

/** Clamps long frames (tab switch, breakpoint) to avoid the "spiral of death". */
const MAX_FRAME_DT = 0.1

export class Simulation {
  readonly world: World
  private accumulator = 0

  constructor(settings: UserSettings) {
    const config = buildMatchConfig(settings)
    this.world = {
      config,
      time: 0,
      score: 0,
      nextId: 1,
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

  addEnemy(kind: EnemyKind, x: number, y: number, variant = 0): EnemyState {
    const stats = this.world.config[kind]
    const enemy: EnemyState = {
      id: this.world.nextId++,
      kind,
      variant,
      x,
      y,
      heading: Math.PI,
      health: stats.maxHealth,
      maxHealth: stats.maxHealth,
      radius: stats.radius,
      dead: false,
    }
    this.world.enemies.push(enemy)
    return enemy
  }

  /** Feed real frame time (seconds). Runs 0..n fixed steps. */
  advance(frameDt: number, input: InputState): void {
    this.accumulator += Math.min(frameDt, MAX_FRAME_DT)
    const fixedStep = this.world.config.fixedStep
    while (this.accumulator >= fixedStep) {
      this.step(fixedStep, input)
      this.accumulator -= fixedStep
    }
  }

  /** One deterministic step. Tests can call this directly to control time. */
  step(dt: number, input: InputState): void {
    movePlayer(this.world, input, dt)
    stepCombat(this.world, input, dt)
    this.world.time += dt
  }

  clearEvents(): void {
    this.world.events.length = 0
  }

  /** Used on resume from pause: drop leftover time so nothing "catches up". */
  resetClock(): void {
    this.accumulator = 0
  }
}