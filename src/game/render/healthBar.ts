import { Container, Graphics, Sprite } from 'pixi.js'
import { HEALTH_BAR_SCALE, type GameTextures } from './assets'

/** Retina px. From ui_sheet.json layout.fill_rect (1x: 24,12,112,15) x2. */
const FILL_RECT = { x: 48, y: 24, w: 224, h: 30 } as const
const FRAME_W = 320
const FRAME_H = 80
/** Below this ratio the bar switches to red. Purely visual. */
const LOW_HEALTH_RATIO = 0.35

export class HealthBar {
  /** Add this to the stage. Its origin is the bottom-center of the bar. */
  readonly view = new Container()
  private readonly fills = new Container()
  private readonly green: Sprite
  private readonly red: Sprite
  private readonly clip: Graphics
  private ratio = -1

  constructor(textures: GameTextures) {
    const frame = new Sprite(textures.healthFrame!)
    this.green = new Sprite(textures.healthGreen!)
    this.red = new Sprite(textures.healthRed!)
    this.fills.addChild(this.green, this.red)

    // The clip rect is scaled on X only, anchored on the left edge.
    this.clip = new Graphics().rect(0, 0, FILL_RECT.w, FILL_RECT.h).fill(0xffffff)
    this.clip.position.set(FILL_RECT.x, FILL_RECT.y)
    this.fills.mask = this.clip

    this.view.addChild(frame, this.fills, this.clip)
    this.view.pivot.set(FRAME_W / 2, FRAME_H)
    this.view.scale.set(HEALTH_BAR_SCALE)
    this.set(1)
  }

  /** Cheap to call every frame: it only touches Pixi when the value changes. */
  set(ratio: number): void {
    const r = Math.min(1, Math.max(0, ratio))
    if (r === this.ratio) return
    this.ratio = r
    this.fills.visible = r > 0
    this.clip.scale.x = Math.max(r, 0.0001) // avoid a singular matrix at 0
    const low = r <= LOW_HEALTH_RATIO
    this.green.visible = !low
    this.red.visible = low
  }

  destroy(): void {
    // Shared textures stay in the Assets cache: children only, never textures.
    this.view.destroy({ children: true })
  }
}