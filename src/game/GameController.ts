import type { Application, Ticker } from 'pixi.js'
import { KeyboardInput } from './input/keyboardInput'
import type { GameTextures } from './render/assets'
import { GameRenderer } from './render/gameRenderer'
import type { UserSettings } from './sim/config'
import { Simulation } from './sim/simulation'

declare global {
  interface Window {
    /** Dev-only debug hook. Proper test hooks come with the Playwright block. */
    __sim?: Simulation
  }
}

export class GameController {
  private readonly app: Application
  private readonly sim: Simulation
  private readonly input = new KeyboardInput()
  private readonly renderer: GameRenderer

  constructor(app: Application, textures: GameTextures, settings: UserSettings) {
    this.app = app
    this.sim = new Simulation(settings)
    this.renderer = new GameRenderer(app.stage, textures, this.sim.world)
  }

  start(): void {
    this.spawnDebugTargets()
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
  }

  /** TEMP (removed in Block 5): stationary targets so damage can be tested. */
  private spawnDebugTargets(): void {
    this.sim.addEnemy('chaser', 420, 360)
    this.sim.addEnemy('shooter', 900, 200)
    this.sim.addEnemy('shooter', 900, 520)
  }
}