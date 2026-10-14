import { useEffect, useRef } from 'react'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import type { GameTextures } from './render/assets'
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from './sim/config'
import { GameController } from './GameController'

export function PixiCanvas({ textures }: { textures: GameTextures }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const controller = new AbortController()
    let handle: PixiHandle | null = null
    let game: GameController | null = null

    createPixiApp(host, DEFAULT_CONFIG.arena, controller.signal)
      .then((h) => {
        if (!h) return // aborted during init (Strict Mode first mount)
        if (controller.signal.aborted) {
          h.destroy() // cleanup already ran while we were resolving
          return
        }
        handle = h
        game = new GameController(h.app, textures, DEFAULT_SETTINGS)
        game.start()
      })
      .catch((e) => console.error('Pixi init failed', e))

    return () => {
      controller.abort()
      game?.destroy() // our ticker callback, key listeners and sprites
      game = null
      handle?.destroy() // the Pixi app itself
      handle = null
    }
  }, [textures])

  return <div ref={hostRef} className="pixi-host" data-testid="game-canvas-host" />
}