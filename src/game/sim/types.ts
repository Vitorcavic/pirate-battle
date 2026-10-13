import type { GameConfig, IslandConfig } from './config'

export interface InputState {
    forward: boolean
    turn: -1 | 0 | 1
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
  radius: number
}

export type Island = IslandConfig

export interface World {
  config: GameConfig // per-match snapshot, never mutated
  time: number // active simulated seconds
  player: ShipState
  islands: Island[]
}