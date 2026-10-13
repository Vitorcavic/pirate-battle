import { useEffect, useRef } from 'react'
import { Sprite } from 'pixi.js'
import { createPixiApp, type PixiHandle } from './render/createPixiApp'
import { shipTexture, SHIP_SCALE, type GameTextures } from './render/assets'
import { buildArena } from './render/buildArena'
import { HealthBar } from './render/healthBar'
import { DEFAULT_CONFIG, DEFAULT_SETTINGS } from './sim/config'
import { Simulation } from './sim/simulation'
import { KeyboardInput } from './input/keyboardInput'

/** Ship art points down (+y); simulation heading 0 points right (+x). */
const SPRITE_ROTATION_OFFSET = -Math.PI / 2
/** Distance from the ship center to the bar anchor (half ship length + margin). */
const BAR_OFFSET_Y = 48

export function PixiCanvas({ textures }: { textures: GameTextures }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const controller = new AbortController()
    let handle: PixiHandle | null = null
    let input: KeyboardInput | null = null

    createPixiApp(host, DEFAULT_CONFIG.arena, controller.signal)
      .then((h) => {
        if (!h) return // aborted during init (Strict Mode first mount)
        if (controller.signal.aborted) {
          h.destroy() // cleanup already ran while we were resolving
          return
        }
        handle = h

        const sim = new Simulation(DEFAULT_SETTINGS)
        input = new KeyboardInput()
        input.attach()

        h.app.stage.addChild(buildArena(textures, sim.world.config.arena))

        const ship = new Sprite(shipTexture(textures, 'player', 1))
        ship.anchor.set(0.5)
        ship.scale.set(SHIP_SCALE)
        h.app.stage.addChild(ship)

        const bar = new HealthBar(textures)
        h.app.stage.addChild(bar.view)

        const activeInput = input
        h.app.ticker.add((tk) => {
          sim.advance(tk.deltaMS / 1000, activeInput.read())

          // Render: read-only view of the simulation state
          const { player, config } = sim.world
          const ratio = player.health / config.player.maxHealth
          const texture = shipTexture(textures, 'player', ratio)
          if (ship.texture !== texture) ship.texture = texture
          ship.position.set(player.x, player.y)
          ship.rotation = player.heading + SPRITE_ROTATION_OFFSET
          bar.view.position.set(player.x, player.y - BAR_OFFSET_Y)
          bar.set(ratio)
        })
      })
      .catch((e) => console.error('Pixi init failed', e))

    return () => {
      controller.abort()
      input?.detach() // our own listeners: Pixi's destroy does not know them
      input = null
      handle?.destroy()
      handle = null
    }
  }, [textures])

  return <div ref={hostRef} className="pixi-host" data-testid="game-canvas-host" />
}