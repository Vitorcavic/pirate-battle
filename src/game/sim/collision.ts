import type { Island, ShipState } from './types'

/** Pushes a circle out of every island it overlaps. Mutates `ship`. */
export function resolveIslands(ship: ShipState, islands: Island[]): void {
  for (const isl of islands) {
    const dx = ship.x - isl.x
    const dy = ship.y - isl.y
    const minDist = ship.radius + isl.radius
    const distSq = dx * dx + dy * dy
    if (distSq >= minDist * minDist) continue
    const dist = Math.sqrt(distSq) || 0.0001 // avoid /0 when centers coincide
    const push = minDist - dist
    ship.x += (dx / dist) * push
    ship.y += (dy / dist) * push
  }
}

/** Keeps the whole circle inside the arena. Mutates `ship`. */
export function clampToArena(ship: ShipState, arena: { width: number; height: number }): void {
  ship.x = Math.min(Math.max(ship.x, ship.radius), arena.width - ship.radius)
  ship.y = Math.min(Math.max(ship.y, ship.radius), arena.height - ship.radius)
}

export function circlesOverlap(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number,
): boolean {
  const dx = ax - bx
  const dy = ay - by
  const r = ar + br
  return dx * dx + dy * dy <= r * r
}