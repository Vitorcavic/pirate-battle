import { create } from 'zustand'
import type { MatchSnapshot } from '../game/GameController'

const INITIAL: MatchSnapshot = {
  status: 'playing',
  endReason: null,
  paused: false,
  elapsed: 0,
  timeLeft: 0,
  score: 0,
  health: 0,
  maxHealth: 1,
}

/** Written by the game ~10x/second, read by the HUD through narrow selectors. */
export const useHudStore = create<MatchSnapshot>(() => INITIAL)

export function resetHud(timeLeft: number): void {
  useHudStore.setState({ ...INITIAL, timeLeft })
}