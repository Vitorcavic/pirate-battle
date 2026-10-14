import type { GameConfig, IslandConfig } from './config'

export interface InputState {
  forward: boolean
  turn: -1 | 0 | 1 // -1 = left (counter-clockwise), 1 = right
  fireFront: boolean
  fireLeft: boolean
  fireRight: boolean
}

export const EMPTY_INPUT: InputState = {
  forward: false,
  turn: 0,
  fireFront: false,
  fireLeft: false,
  fireRight: false,
}

export interface ShipState {
  x: number
  y: number
  heading: number // radians, 0 = +x, grows clockwise (Pixi's y axis points down)
  health: number
  maxHealth: number
  radius: number
}

export type EnemyKind = 'chaser' | 'shooter'

export interface EnemyState extends ShipState {
  id: number
  kind: EnemyKind
  variant: number // cosmetic: which chaser skin
  dead: boolean
}

export interface Projectile {
  id: number
  owner: 'player' | 'enemy'
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  damage: number
  ttl: number // remaining lifetime, seconds
  dead: boolean
}

export interface Cooldowns {
  front: number
  left: number
  right: number
}

/** Facts the renderer/audio react to. The simulation only appends; the controller clears. */
export type SimEvent =
  | { type: 'shot'; x: number; y: number }
  | { type: 'hit'; x: number; y: number; target: 'player' | 'enemy' | 'obstacle' }
  | { type: 'enemyDestroyed'; x: number; y: number }

export type Island = IslandConfig

export interface World {
  config: GameConfig // per-match snapshot, never mutated
  time: number // active simulated seconds
  score: number
  nextId: number
  player: ShipState
  cooldowns: Cooldowns
  enemies: EnemyState[]
  projectiles: Projectile[]
  islands: Island[]
  events: SimEvent[]
}