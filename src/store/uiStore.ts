import { create } from 'zustand'
import type { UserSettings } from '../game/sim/config'
import { loadLastMatch, loadSettings, saveLastMatch, saveSettings, type StoredMatch } from './persistence'

export type Screen = 'menu' | 'options' | 'match' | 'result'
export type MenuTab = 'ranking' | 'history'

/** Lets the final frame (explosion, 0:00) breathe before the result appears. */
const RESULT_DELAY_MS = 800
let resultTimer: number | undefined

interface UiState {
  screen: Screen
  menuTab: MenuTab
  settings: UserSettings
  lastMatch: StoredMatch | null
  matchNonce: number // bumped on every new match so the match screen remounts clean
  go: (screen: Screen) => void
  setMenuTab: (tab: MenuTab) => void
  startMatch: () => void
  updateSettings: (settings: UserSettings) => void
  recordMatch: (match: StoredMatch) => void
  acknowledgeResult: () => void
}

const initialLastMatch = loadLastMatch()

export const useUiStore = create<UiState>((set, get) => ({
  // Reloading on an unseen result brings the result back
  screen: initialLastMatch && !initialLastMatch.acknowledged ? 'result' : 'menu',
  menuTab: 'ranking',
  settings: loadSettings(),
  lastMatch: initialLastMatch,
  matchNonce: 0,

  go: (screen) => {
    window.clearTimeout(resultTimer)
    set({ screen })
  },
  setMenuTab: (menuTab) => set({ menuTab }),
  startMatch: () => {
    window.clearTimeout(resultTimer)
    set((s) => ({ screen: 'match', matchNonce: s.matchNonce + 1 }))
  },
  updateSettings: (settings) => {
    saveSettings(settings)
    set({ settings })
  },
  recordMatch: (match) => {
    saveLastMatch(match) // persisted immediately: a reload during the delay still shows it
    set({ lastMatch: match })
    window.clearTimeout(resultTimer)
    resultTimer = window.setTimeout(() => {
      if (get().screen === 'match') set({ screen: 'result' })
    }, RESULT_DELAY_MS)
  },
  acknowledgeResult: () => {
    const match = get().lastMatch
    if (!match || match.acknowledged) return
    const seen = { ...match, acknowledged: true }
    saveLastMatch(seen)
    set({ lastMatch: seen })
  },
}))