import { useEffect, useRef } from 'react'
import { Sprite } from 'pixi.js'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import { shipTexture, SHIP_SCALE, type GameTextures } from './render/assets'
import { DEFAULT_CONFIG } from './sim/config'
import { buildArena } from './render/buildArena'
import { HealthBar } from './render/healthBar'

const SECONDS_PER_STAGE = 2 // TEMP smoke test only

export function PixiCanvas({ textures }: { textures: GameTextures }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const controller = new AbortController()
    let handle: PixiHandle | null = null

    createPixiApp(host, DEFAULT_CONFIG.arena, controller.signal)
      .then((h) => {
        handle = h
        if (!h) return // aborted during init (Strict Mode first mount)

        // TEMP smoke test: replaced by the real renderer in the next blocks
        h.app.stage.addChild(buildArena(textures, DEFAULT_CONFIG.arena))
        const ship = new Sprite(shipTexture(textures, 'player', 1))
        ship.anchor.set(0.5)
        ship.scale.set(SHIP_SCALE)
        ship.position.set(DEFAULT_CONFIG.arena.width / 2, DEFAULT_CONFIG.arena.height / 2)
        h.app.stage.addChild(ship)

        const bar = new HealthBar(textures)
        bar.view.position.set(ship.x, ship.y - 48)
        h.app.stage.addChild(bar.view)

        let t = 0
        h.app.ticker.add((tk) => {
          t += tk.deltaMS / 1000
          const ratio = 1 - ((t / (SECONDS_PER_STAGE * 4)) % 1)
          ship.texture = shipTexture(textures, 'player', ratio)
          bar.set(ratio)
          ship.rotation += 0.01 * tk.deltaTime
        })
      })
      .catch((e) => console.error('Pixi init failed', e))

    return () => {
      controller.abort()
      handle?.destroy()
      handle = null
    }
  }, [textures])

  return <div ref={hostRef} className="pixi-host" data-testid="game-canvas-host" />
}