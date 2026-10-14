import type { Application, Ticker } from 'pixi.js'
import { KeyboardInput } from './input/keyboardInput'
import type { GameTextures } from './render/assets'
import { GameRenderer } from './render/gameRenderer'
import type { UserSettings } from './sim/config'
import { Simulation } from './sim/simulation'
import type { EndReason, MatchStatus } from './sim/types'

declare global {
  interface Window {
    /** Dev-only debug hook. Proper test hooks come with the Playwright block. */
    __sim?: Simulation
  }
}

/** What the React UI is allowed to know. Plain data, published ~10x per second. */
export interface MatchSnapshot {
  status: MatchStatus
  endReason: EndReason | null
  elapsed: number
  timeLeft: number
  score: number
  health: number
  maxHealth: number
}

export interface MatchResult {
  score: number
  duration: number // effective seconds of active play
  reason: EndReason
}

export interface GameHooks {
  onSnapshot?: (snapshot: MatchSnapshot) => void
  onEnd?: (result: MatchResult) => void
}

const SNAPSHOT_INTERVAL = 0.1 // seconds

export class GameController {
  private readonly app: Application
  private readonly sim: Simulation
  private readonly input = new KeyboardInput()
  private readonly renderer: GameRenderer
  private readonly hooks: GameHooks
  private sinceSnapshot = SNAPSHOT_INTERVAL
  private endNotified = false

  constructor(app: Application, textures: GameTextures, settings: UserSettings, hooks: GameHooks = {}, seed?: number) {
    this.app = app
    this.hooks = hooks
    this.sim = new Simulation(settings, seed)
    this.renderer = new GameRenderer(app.stage, textures, this.sim.world)
  }

  start(): void {
    this.input.attach()
    this.app.ticker.add(this.tick)
    if (import.meta.env.DEV) window.__sim = this.sim
  }

  destroy(): void {
    this.app.ticker.remove(this.tick)
    this.input.detach()
    this.renderer.destroy()
    if (import.meta.env.DEV && window.__sim === this.sim) delete window.__sim
  }

  private readonly tick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS / 1000
    this.sim.advance(dt, this.input.read())
    this.renderer.render(this.sim.world, dt)
    this.sim.clearEvents()
    this.publish(dt)
  }

  private publish(dt: number): void {
    const world = this.sim.world
    const ended = world.status === 'ended'
    this.sinceSnapshot += dt
    if (!ended && this.sinceSnapshot < SNAPSHOT_INTERVAL) return
    if (ended && this.endNotified) return
    this.sinceSnapshot = 0

    this.hooks.onSnapshot?.({
      status: world.status,
      endReason: world.endReason,
      elapsed: world.time,
      timeLeft: Math.max(0, world.config.sessionDuration - world.time),
      score: world.score,
      health: world.player.health,
      maxHealth: world.player.maxHealth,
    })

    if (ended && world.endReason) {
      this.endNotified = true // exactly one result per match
      this.hooks.onEnd?.({ score: world.score, duration: world.time, reason: world.endReason })
    }
  }
}