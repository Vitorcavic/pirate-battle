import type { Application, Ticker } from 'pixi.js'
import { KeyboardInput } from './input/keyboardInput'
import { TouchInput } from './input/touchInput'
import type { GameTextures } from './render/assets'
import { GameRenderer } from './render/gameRenderer'
import type { UserSettings } from './sim/config'
import { Simulation } from './sim/simulation'
import type { EndReason, InputState, MatchStatus, SimEvent, World } from './sim/types'
import { installTestApi } from './testHooks'
import { isTestMode, testManualClock, testSeed } from './testMode'

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
  paused: boolean
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

export interface GameOptions {
  hooks?: GameHooks
  touch?: TouchInput
  seed?: number
}

const SNAPSHOT_INTERVAL = 0.1 // seconds
const PAUSE_KEYS = new Set(['Escape', 'KeyP'])
/** Same condition as the CSS rotate notice. */
const PORTRAIT_QUERY = '(orientation: portrait) and (max-width: 900px)'

export class GameController {
  private readonly app: Application
  private readonly sim: Simulation
  private readonly keyboard = new KeyboardInput()
  private readonly touch: TouchInput
  private readonly renderer: GameRenderer
  private readonly hooks: GameHooks
  private readonly portrait = window.matchMedia(PORTRAIT_QUERY)
  private paused = false
  private readonly manualClock = testManualClock()
  private removeTestApi: (() => void) | null = null
  private sinceSnapshot = SNAPSHOT_INTERVAL
  private endNotified = false

  constructor(app: Application, textures: GameTextures, settings: UserSettings, options: GameOptions = {}) {
    this.app = app
    this.hooks = options.hooks ?? {}
    this.touch = options.touch ?? new TouchInput()
    this.sim = new Simulation(settings, options.seed ?? testSeed())
    this.renderer = new GameRenderer(app.stage, textures, this.sim.world)
  }

  start(): void {
    this.keyboard.attach()
    window.addEventListener('keydown', this.onPauseKey)
    window.addEventListener('blur', this.autoPause)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.portrait.addEventListener('change', this.onOrientation)
    this.app.ticker.add(this.tick)
    if (import.meta.env.DEV) window.__sim = this.sim
    if (isTestMode()) this.removeTestApi = installTestApi(this)
  }

  destroy(): void {
    this.app.ticker.remove(this.tick)
    window.removeEventListener('keydown', this.onPauseKey)
    window.removeEventListener('blur', this.autoPause)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.portrait.removeEventListener('change', this.onOrientation)
    this.keyboard.detach()
    this.touch.reset()
    this.renderer.destroy()
    this.removeTestApi?.()
    this.removeTestApi = null
    if (import.meta.env.DEV && window.__sim === this.sim) delete window.__sim
  }

  /** Freezes the simulation and releases the keyboard. Safe to call repeatedly. */
  pause(): void {
    if (this.paused || this.sim.world.status !== 'playing') return
    this.paused = true
    this.keyboard.detach() // also drops held keys: nothing accumulates while paused
    this.touch.reset()
    this.emitSnapshot()
  }

  /** Only called from an explicit player action (the Resume button). */
  resume(): void {
    if (!this.paused || this.sim.world.status !== 'playing') return
    this.paused = false
    this.sim.resetClock() // no catch-up for the paused period
    this.keyboard.attach()
    this.emitSnapshot()
  }

  getWorld(): World {
    return this.sim.world
  }

  isPaused(): boolean {
    return this.paused
  }

  /** Test instrumentation: runs the real fixed-step simulation, with the real keyboard/touch input. */
  stepManual(seconds: number): SimEvent[] {
    if (this.paused) return []
    const world = this.sim.world
    const fixedStep = world.config.fixedStep
    const steps = Math.max(0, Math.round(seconds / fixedStep))
    for (let i = 0; i < steps && world.status === 'playing'; i++) {
      this.sim.step(fixedStep, this.readInput())
    }
    const events = [...world.events]
    this.renderer.render(world, seconds)
    this.sim.clearEvents()
    this.sinceSnapshot = SNAPSHOT_INTERVAL // force a snapshot so the HUD matches
    this.publish(seconds)
    return events
  }

  private readonly onPauseKey = (e: KeyboardEvent): void => {
    if (PAUSE_KEYS.has(e.code) && !e.repeat) this.pause()
  }
  private readonly autoPause = (): void => this.pause()
  private readonly onVisibility = (): void => {
    if (document.hidden) this.pause()
  }
  private readonly onOrientation = (e: MediaQueryListEvent): void => {
    if (e.matches) this.pause()
  }

  private readInput(): InputState {
    const k = this.keyboard.read()
    const t = this.touch.read()
    return {
      forward: k.forward || t.forward,
      turn: Math.sign(k.turn + t.turn) as -1 | 0 | 1,
      fireFront: k.fireFront || t.fireFront,
      fireLeft: k.fireLeft || t.fireLeft,
      fireRight: k.fireRight || t.fireRight,
    }
  }

  private readonly tick = (ticker: Ticker): void => {
    if (this.paused) return // simulation, cooldowns and timer all stay frozen
    if (this.manualClock) {
      // Test mode: time only moves through stepManual(). Frames just redraw the current state.
      this.renderer.render(this.sim.world, 0)
      return
    }
    const dt = ticker.deltaMS / 1000
    this.sim.advance(dt, this.readInput())
    this.renderer.render(this.sim.world, dt)
    this.sim.clearEvents()
    this.publish(dt)
  }

  private publish(dt: number): void {
    const world = this.sim.world
    if (world.status === 'ended') {
      if (this.endNotified || !world.endReason) return
      this.endNotified = true // exactly one result per match
      this.keyboard.detach()
      this.touch.reset()
      this.emitSnapshot()
      this.hooks.onEnd?.({ score: world.score, duration: world.time, reason: world.endReason })
      return
    }
    this.sinceSnapshot += dt
    if (this.sinceSnapshot < SNAPSHOT_INTERVAL) return
    this.sinceSnapshot = 0
    this.emitSnapshot()
  }

  private emitSnapshot(): void {
    const world = this.sim.world
    this.hooks.onSnapshot?.({
      status: world.status,
      endReason: world.endReason,
      paused: this.paused,
      elapsed: world.time,
      timeLeft: Math.max(0, world.config.sessionDuration - world.time),
      score: world.score,
      health: world.player.health,
      maxHealth: world.player.maxHealth,
    })
  }
}