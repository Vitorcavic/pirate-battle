import { Container, Sprite, type Texture } from 'pixi.js'

const MAX_EFFECTS = 64 // hard cap so a burst can never grow without bound

interface Fx {
  sprite: Sprite
  age: number
  duration: number
  fromScale: number
  toScale: number
}

export class Effects {
  readonly view = new Container()
  private active: Fx[] = []

  spawn(texture: Texture, x: number, y: number, duration: number, fromScale: number, toScale: number): void {
    if (this.active.length >= MAX_EFFECTS) return
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.position.set(x, y)
    sprite.scale.set(fromScale)
    this.view.addChild(sprite)
    this.active.push({ sprite, age: 0, duration, fromScale, toScale })
  }

  update(dt: number): void {
    let kept = 0
    for (const fx of this.active) {
      fx.age += dt
      const k = fx.age / fx.duration
      if (k >= 1) {
        fx.sprite.destroy() // the shared texture is not destroyed
        continue
      }
      fx.sprite.alpha = 1 - k
      fx.sprite.scale.set(fx.fromScale + (fx.toScale - fx.fromScale) * k)
      this.active[kept++] = fx
    }
    this.active.length = kept
  }
}