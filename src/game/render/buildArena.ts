import { Container, Sprite, TilingSprite } from 'pixi.js'
import { islandPart, RETINA_SCALE, TILE_SIZE, type GameTextures } from './assets'
import type { GameConfig } from '../sim/config'

/** Static layer: water background + island tiles. Built once per match. */
export function buildArena(textures: GameTextures, arena: GameConfig['arena']): Container {
  const layer = new Container()

  const water = new TilingSprite({ texture: textures.water!, width: arena.width, height: arena.height })
  water.tileScale.set(RETINA_SCALE) // 128px retina tile -> 64px logical
  layer.addChild(water)

  for (const isl of arena.islands) {
    // Grid size follows the collision radius: r=56 -> 2x2, r=88 -> 3x3
    const n = Math.max(2, Math.round((2 * isl.radius) / TILE_SIZE))
    const size = n * TILE_SIZE
    const originX = isl.x - size / 2
    const originY = isl.y - size / 2
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const tile = new Sprite(textures[`island_${islandPart(row, col, n)}`]!)
        tile.scale.set(RETINA_SCALE)
        tile.position.set(originX + col * TILE_SIZE, originY + row * TILE_SIZE)
        layer.addChild(tile)
      }
    }
  }
  return layer
}