import { clampToArena, resolveIslands } from '../collision'
import type { InputState, World } from '../types'

export function movePlayer(world: World, input: InputState, dt: number): void {
  const { player, islands, config } = world
  player.heading += input.turn * config.player.turnSpeed * dt
  if (input.forward) {
    const step = config.player.moveSpeed * dt
    player.x += Math.cos(player.heading) * step
    player.y += Math.sin(player.heading) * step
  }
  // Order matters: islands first, then arena bounds as the final authority.
  resolveIslands(player, islands)
  clampToArena(player, config.arena)
}