import { useEffect, useRef } from 'react'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import type { GameTextures } from './render/assets'
import { DEFAULT_CONFIG, type UserSettings } from './sim/config'
import { GameController, type GameHooks } from './GameController'
import type { TouchInput } from './input/touchInput'

interface Props {
  textures: GameTextures
  settings: UserSettings // snapshot taken when the match screen mounted
  hooks: GameHooks
  touch: TouchInput
  onController: (controller: GameController | null) => void
}

export function PixiCanvas({ textures, settings, hooks, touch, onController }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const abort = new AbortController()
    let handle: PixiHandle | null = null
    let game: GameController | null = null

    createPixiApp(host, DEFAULT_CONFIG.arena, abort.signal)
      .then((h) => {
        if (!h) return // aborted during init (Strict Mode first mount)
        if (abort.signal.aborted) {
          h.destroy() // cleanup already ran while we were resolving
          return
        }
        handle = h
        game = new GameController(h.app, textures, settings, { hooks, touch })
        game.start()
        onController(game)
      })
      .catch((e) => console.error('Pixi init failed', e))

    return () => {
      abort.abort()
      onController(null)
      game?.destroy() // ticker callback, listeners and sprites
      game = null
      handle?.destroy() // the Pixi app itself
      handle = null
    }
  }, [textures, settings, hooks, touch, onController])

  return <div ref={hostRef} className="pixi-host" data-testid="game-canvas-host" />
}