import { Assets, Texture } from 'pixi.js'

const BASE = `${import.meta.env.BASE_URL}assets/png/retina/`

export const RETINA_SCALE = 0.5

/**
 * TODO(gallery): fill the damage stages once you checked ?gallery.
 * Index 0 = healthy ... last = nearly destroyed.
 */
export const SHIP_SKINS = {
  player: ['ships/ship_1.png', 'ships/ship_7.png', 'ships/ship_13.png', 'ships/ship_19.png'],
  chaser: ['ships/dinghy_small_1.png', 'ships/dinghy_small_2.png', 'ships/dinghy_small_3.png'],
  shooter: ['ships/ship_2.png', 'ships/ship_8.png', 'ships/ship_14.png', 'ships/ship_20.png'],
} as const

const FIXED = {
  cannonball: 'ship_parts/cannon_ball.png',
  explosion1: 'effects/explosion_1.png',
  explosion2: 'effects/explosion_2.png',
  explosion3: 'effects/explosion_3.png',
  fire1: 'effects/fire_1.png',
  fire2: 'effects/fire_2.png',
  healthFrame: 'ui/hud/enemy_health_frame.png',
  healthGreen: 'ui/hud/enemy_health_fill_green.png',
  healthRed: 'ui/hud/enemy_health_fill_red.png',
  // water / island tiles: wait for the gallery answer
} as const

/** Flattens everything into one { alias: path } map. */
function buildManifest(): Record<string, string> {
  const m: Record<string, string> = { ...FIXED }
  for (const [kind, paths] of Object.entries(SHIP_SKINS)) {
    paths.forEach((p, stage) => (m[`${kind}Ship${stage}`] = p))
  }
  return m
}
const MANIFEST = buildManifest()
export type AssetKey = string
export type GameTextures = Record<AssetKey, Texture>

/** Typed helper so the renderer never builds alias strings by hand. */
export function shipTexture(t: GameTextures, kind: keyof typeof SHIP_SKINS, healthRatio: number): Texture {
  const stages = SHIP_SKINS[kind].length
  const stage = Math.min(stages - 1, Math.floor((1 - Math.max(0, healthRatio)) * stages))
  return t[`${kind}Ship${stage}`]!
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