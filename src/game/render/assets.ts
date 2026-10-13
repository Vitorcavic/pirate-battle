import { Assets, Texture } from 'pixi.js'

const BASE = `${import.meta.env.BASE_URL}assets/png/retina/`

/** Retina PNG (2x) -> logical px. */
export const RETINA_SCALE = 0.5
/** Ships are drawn larger than 1x so they stay readable on small screens. */
export const SHIP_SCALE = RETINA_SCALE * 1.5
/** Cannonball: 10px retina -> 10px logical diameter, matches projectileRadius = 5. */
export const PROJECTILE_SCALE = 1
/** Explosion: 74px retina -> ~74px logical, roughly the size of a ship. */
export const EXPLOSION_SCALE = 1
/** Enemy health bar: 320px retina -> 64px logical wide, sits just above the ship. */
export const HEALTH_BAR_SCALE = 0.2
/** Logical tile size (128px retina / 2). */
export const TILE_SIZE = 64

/** Ship sheet: 6 colors x 4 damage stages. Stage n is at n, n+6, n+12, n+18. */
const stagesOf = (n: number) => [0, 6, 12, 18].map((offset) => `ships/ship_${n + offset}.png`)

/** Index 0 = healthy ... last = nearly destroyed. */
export const SHIP_SKINS = {
  player: stagesOf(1),
  shooter: stagesOf(2),
  chaser0: stagesOf(3),
  chaser1: stagesOf(4),
  chaser2: stagesOf(5),
  chaser3: stagesOf(6),
} as const
export type ShipSkin = keyof typeof SHIP_SKINS
export const CHASER_SKINS: ShipSkin[] = ['chaser0', 'chaser1', 'chaser2', 'chaser3']

/** Tile numbers for the island autotile. VERIFY with the ?gallery island preview. */
export const ISLAND_TILES = {
  tl: 1, t: 2, tr: 3,
  l: 17, c: 18, r: 19,
  bl: 33, b: 34, br: 35,
} as const
export type IslandPart = keyof typeof ISLAND_TILES

/** Which tile goes at (row, col) of an n x n island. */
export function islandPart(row: number, col: number, n: number): IslandPart {
  const v = row === 0 ? 't' : row === n - 1 ? 'b' : 'm'
  const h = col === 0 ? 'l' : col === n - 1 ? 'r' : 'm'
  if (v === 'm' && h === 'm') return 'c'
  if (v === 'm') return h as IslandPart
  if (h === 'm') return v as IslandPart
  return `${v}${h}` as IslandPart
}

const FIXED = {
  water: 'tiles/tile_73.png',
  cannonball: 'ship_parts/cannon_ball.png',
  explosion1: 'effects/explosion_1.png',
  explosion2: 'effects/explosion_2.png',
  explosion3: 'effects/explosion_3.png',
  fire1: 'effects/fire_1.png',
  fire2: 'effects/fire_2.png',
  healthFrame: 'ui/hud/enemy_health_frame.png',
  healthGreen: 'ui/hud/enemy_health_fill_green.png',
  healthRed: 'ui/hud/enemy_health_fill_red.png',
} as const

const shipKey = (skin: ShipSkin, stage: number) => `${skin}:${stage}`

/** Flattens everything into one { alias: path } map. */
function buildManifest(): Record<string, string> {
  const manifest: Record<string, string> = { ...FIXED }
  for (const [skin, paths] of Object.entries(SHIP_SKINS)) {
    paths.forEach((path, stage) => {
      manifest[shipKey(skin as ShipSkin, stage)] = path
    })
  }
  for (const [part, n] of Object.entries(ISLAND_TILES)) {
    manifest[`island_${part}`] = `tiles/tile_${n}.png`
  }
  return manifest
}
const MANIFEST = buildManifest()

export type GameTextures = Record<string, Texture>

/** Health ratio (0..1) -> damage stage texture. With 4 stages: >75%, >50%, >25%, below. */
export function shipTexture(t: GameTextures, skin: ShipSkin, healthRatio: number): Texture {
  const stages = SHIP_SKINS[skin].length
  const stage = Math.min(stages - 1, Math.floor((1 - Math.max(0, healthRatio)) * stages))
  return t[shipKey(skin, stage)]!
}

export class AssetLoadError extends Error {
  public readonly original: unknown

  constructor(original: unknown) {
    super('Failed to load game assets.')
    this.name = 'AssetLoadError'
    this.original = original
  }
}

let cached: GameTextures | null = null

/** Loads every texture once. Safe to call again after a failure (retry). */
export async function loadGameTextures(onProgress?: (ratio: number) => void): Promise<GameTextures> {
  if (cached) {
    onProgress?.(1)
    return cached
  }
  const keys = Object.keys(MANIFEST)
  for (const key of keys) {
    if (!Assets.resolver.hasKey(key)) Assets.add({ alias: key, src: BASE + MANIFEST[key] })
  }
  try {
    const loaded = (await Assets.load(keys, onProgress)) as GameTextures
    for (const key of keys) {
      if (!(loaded[key] instanceof Texture)) throw new Error(`Invalid texture: ${key}`)
    }
    cached = loaded
    return loaded
  } catch (err) {
    await Assets.unload(keys).catch(() => {}) // so Retry really refetches
    throw new AssetLoadError(err)
  }
}