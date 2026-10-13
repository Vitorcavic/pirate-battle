import { useEffect, useRef } from 'react'
import { Sprite } from 'pixi.js'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import { shipTexture, RETINA_SCALE, type GameTextures } from './render/assets'
import { DEFAULT_CONFIG } from './sim/config'

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
        const ship = new Sprite(shipTexture(textures, 'player', 1))
        ship.anchor.set(0.5)
        ship.scale.set(RETINA_SCALE)
        ship.position.set(DEFAULT_CONFIG.arena.width / 2, DEFAULT_CONFIG.arena.height / 2)
        h.app.stage.addChild(ship)

        let t = 0
        h.app.ticker.add((tk) => {
          t += tk.deltaMS / 1000
          ship.texture = shipTexture(textures, 'player', 1 - ((t / 2) % 1))
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