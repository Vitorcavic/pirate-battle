import { Container, Sprite } from 'pixi.js'
import {
  CHASER_SKINS,
  EXPLOSION_SCALE,
  PROJECTILE_SCALE,
  SHIP_SCALE,
  shipTexture,
  type GameTextures,
  type ShipSkin,
} from './assets'
import { buildArena } from './buildArena'
import { Effects } from './effects'
import { HealthBar } from './healthBar'
import type { EnemyState, ShipState, World } from '../sim/types'

/** Ship art points down (+y); simulation heading 0 points right (+x). */
const SPRITE_ROTATION_OFFSET = -Math.PI / 2
/** Distance from the ship center to the bar anchor (half ship length + margin). */
const BAR_OFFSET_Y = 48

interface ShipView {
  sprite: Sprite
  bar: HealthBar
  skin: ShipSkin
  frame: number
}

interface ProjectileView {
  sprite: Sprite
  frame: number
}

export class GameRenderer {
  private readonly root = new Container()
  private readonly shipLayer = new Container()
  private readonly projectileLayer = new Container()
  private readonly barLayer = new Container()
  private readonly effects = new Effects()
  private readonly textures: GameTextures
  private readonly playerView: ShipView
  private readonly enemyViews = new Map<number, ShipView>()
  private readonly projectileViews = new Map<number, ProjectileView>()
  private readonly spritePool: Sprite[] = []
  private frame = 0

  constructor(stage: Container, textures: GameTextures, world: World) {
    this.textures = textures
    this.root.addChild(
      buildArena(textures, world.config.arena),
      this.shipLayer,
      this.projectileLayer,
      this.effects.view,
      this.barLayer,
    )
    stage.addChild(this.root)
    this.playerView = this.createShipView('player')
  }

  /** Read-only view of the simulation. `dt` is real frame time, used only for effects. */
  render(world: World, dt: number): void {
    this.frame++
    this.syncShip(this.playerView, world.player)
    this.syncEnemies(world.enemies)
    this.syncProjectiles(world)
    this.handleEvents(world)
    this.effects.update(dt)
  }

  destroy(): void {
    // Children only: shared textures stay in the Assets cache.
    this.root.destroy({ children: true })
    this.enemyViews.clear()
    this.projectileViews.clear()
    this.spritePool.length = 0
  }

  private createShipView(skin: ShipSkin): ShipView {
    const sprite = new Sprite(shipTexture(this.textures, skin, 1))
    sprite.anchor.set(0.5)
    sprite.scale.set(SHIP_SCALE)
    const bar = new HealthBar(this.textures)
    this.shipLayer.addChild(sprite)
    this.barLayer.addChild(bar.view)
    return { sprite, bar, skin, frame: 0 }
  }

  private disposeShipView(view: ShipView): void {
    view.sprite.destroy()
    view.bar.destroy()
  }

  private syncShip(view: ShipView, ship: ShipState): void {
    const ratio = ship.health / ship.maxHealth
    const texture = shipTexture(this.textures, view.skin, ratio)
    if (view.sprite.texture !== texture) view.sprite.texture = texture
    view.sprite.position.set(ship.x, ship.y)
    view.sprite.rotation = ship.heading + SPRITE_ROTATION_OFFSET
    view.bar.view.position.set(ship.x, ship.y - BAR_OFFSET_Y)
    view.bar.set(ratio)
  }

  private skinFor(enemy: EnemyState): ShipSkin {
    return enemy.kind === 'shooter' ? 'shooter' : CHASER_SKINS[enemy.variant % CHASER_SKINS.length]!
  }

  private syncEnemies(enemies: EnemyState[]): void {
    for (const enemy of enemies) {
      let view = this.enemyViews.get(enemy.id)
      if (!view) {
        view = this.createShipView(this.skinFor(enemy))
        this.enemyViews.set(enemy.id, view)
      }
      view.frame = this.frame
      this.syncShip(view, enemy)
    }
    // Anything not seen this frame has left the simulation
    for (const [id, view] of this.enemyViews) {
      if (view.frame === this.frame) continue
      this.disposeShipView(view)
      this.enemyViews.delete(id)
    }
  }

  private createProjectileSprite(): Sprite {
    const sprite = new Sprite(this.textures.cannonball!)
    sprite.anchor.set(0.5)
    sprite.scale.set(PROJECTILE_SCALE)
    this.projectileLayer.addChild(sprite)
    return sprite
  }

  private syncProjectiles(world: World): void {
    for (const p of world.projectiles) {
      let view = this.projectileViews.get(p.id)
      if (!view) {
        const sprite = this.spritePool.pop() ?? this.createProjectileSprite()
        sprite.visible = true
        view = { sprite, frame: 0 }
        this.projectileViews.set(p.id, view)
      }
      view.frame = this.frame
      view.sprite.position.set(p.x, p.y)
    }
    for (const [id, view] of this.projectileViews) {
      if (view.frame === this.frame) continue
      view.sprite.visible = false // back to the pool instead of destroying
      this.spritePool.push(view.sprite)
      this.projectileViews.delete(id)
    }
  }

  private handleEvents(world: World): void {
    const small = this.textures.explosion3!
    const big = this.textures.explosion1!
    for (const ev of world.events) {
      switch (ev.type) {
        case 'shot':
          this.effects.spawn(small, ev.x, ev.y, 0.15, 0.3 * EXPLOSION_SCALE, 0.7 * EXPLOSION_SCALE)
          break
        case 'hit':
          this.effects.spawn(small, ev.x, ev.y, 0.25, 0.5 * EXPLOSION_SCALE, 1.0 * EXPLOSION_SCALE)
          break
        case 'enemyDestroyed':
          this.effects.spawn(big, ev.x, ev.y, 0.5, 0.6 * EXPLOSION_SCALE, 1.4 * EXPLOSION_SCALE)
          break
        case 'matchEnded':
          if (ev.reason === 'death') {
            this.playerView.sprite.visible = false
            this.playerView.bar.view.visible = false
            this.effects.spawn(big, world.player.x, world.player.y, 0.7, 0.8 * EXPLOSION_SCALE, 1.8 * EXPLOSION_SCALE)
          }
          break
      }
    }
  }
}