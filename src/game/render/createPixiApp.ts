import { Application } from 'pixi.js'

export interface PixiHandle {
  app: Application
  destroy: () => void
  /** Converts a client (screen) point to world coordinates. */
  clientToWorld: (clientX: number, clientY: number) => { x: number; y: number }
}

/**
 * Creates and mounts a Pixi app. Returns null if `signal` was aborted while
 * the async init was running (React Strict Mode mounts/unmounts twice).
 */
export async function createPixiApp(
  host: HTMLElement,
  world: { width: number; height: number },
  signal: AbortSignal,
): Promise<PixiHandle | null> {
  const app = new Application()
  await app.init({
    width: world.width,
    height: world.height,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true, // keeps the CSS size = logical size
    antialias: true,
    background: '#0b3d5c',
  })

  if (signal.aborted) {
    app.destroy(true, { children: true })
    return null
  }

  const canvas = app.canvas
  canvas.style.display = 'block'
  canvas.style.touchAction = 'none' // no scroll/zoom gestures over the arena
  host.appendChild(canvas)

  const fit = () => {
    const { clientWidth: w, clientHeight: h } = host
    const scale = Math.min(w / world.width, h / world.height)
    canvas.style.width = `${Math.floor(world.width * scale)}px`
    canvas.style.height = `${Math.floor(world.height * scale)}px`
  }
  fit()
  const observer = new ResizeObserver(fit)
  observer.observe(host)

  return {
    app,
    clientToWorld: (cx, cy) => {
      const r = canvas.getBoundingClientRect()
      return { x: ((cx - r.left) / r.width) * world.width, y: ((cy - r.top) / r.height) * world.height }
    },
    destroy: () => {
      observer.disconnect()
      canvas.remove()
      app.destroy(true, { children: true }) // does NOT destroy shared textures (see below)
    },
  }
}