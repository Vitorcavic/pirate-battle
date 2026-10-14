import { useEffect, useRef } from 'react'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import type { GameTextures } from './render/assets'
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from './sim/config'
import { GameController, type MatchSnapshot } from './GameController'

function debugText(s: MatchSnapshot): string {
  const state = s.status === 'ended' ? `ENDED (${s.endReason})` : 'PLAYING'
  return `${state}\ntime ${s.timeLeft.toFixed(1)}s   score ${s.score}\nhp ${Math.ceil(s.health)}/${s.maxHealth}`
}

export function PixiCanvas({ textures }: { textures: GameTextures }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const debugRef = useRef<HTMLPreElement>(null) // TEMP: replaced by the real HUD in Block 6

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
        game = new GameController(h.app, textures, DEFAULT_SETTINGS, {
          onSnapshot: (s) => {
            if (debugRef.current) debugRef.current.textContent = debugText(s)
          },
        })
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

  return (
    <div className="game-shell">
      <div ref={hostRef} className="pixi-host" data-testid="game-canvas-host" />
      <pre ref={debugRef} className="debug-hud" />
    </div>
  )
}