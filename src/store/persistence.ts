import { DEFAULT_SETTINGS, type UserSettings } from '../game/sim/config'
import { validateSettings } from '../game/sim/settings'
import type { EndReason } from '../game/sim/types'

const SETTINGS_KEY = 'pb:settings:v1'
const LAST_MATCH_KEY = 'pb:last-match:v1'

/** A finished match as stored locally. Block 7 reuses it as the record payload. */
export interface StoredMatch {
  matchId: string
  score: number
  duration: number // effective seconds of active play
  reason: EndReason
  endedAt: string // ISO date
  settings: UserSettings // configuration used in this match
  acknowledged: boolean // false until the player leaves the result screen
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null // storage blocked or corrupted JSON: fall back to defaults
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota or privacy mode: the game still works, it just won't persist */
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asSettings(value: unknown): UserSettings | null {
  if (!isRecord(value)) return null
  const { sessionDuration, enemySpawnInterval } = value
  if (typeof sessionDuration !== 'number' || typeof enemySpawnInterval !== 'number') return null
  const settings = { sessionDuration, enemySpawnInterval }
  return Object.keys(validateSettings(settings)).length === 0 ? settings : null
}

export function loadSettings(): UserSettings {
  return asSettings(readJson(SETTINGS_KEY)) ?? { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: UserSettings): void {
  writeJson(SETTINGS_KEY, settings)
}

export function loadLastMatch(): StoredMatch | null {
  const raw = readJson(LAST_MATCH_KEY)
  if (!isRecord(raw)) return null
  const settings = asSettings(raw.settings)
  const { matchId, score, duration, reason, endedAt, acknowledged } = raw
  if (
    !settings ||
    typeof matchId !== 'string' ||
    typeof score !== 'number' ||
    typeof duration !== 'number' ||
    (reason !== 'time' && reason !== 'death') ||
    typeof endedAt !== 'string' ||
    typeof acknowledged !== 'boolean'
  ) {
    return null
  }
  return { matchId, score, duration, reason, endedAt, settings, acknowledged }
}

export function saveLastMatch(match: StoredMatch): void {
  writeJson(LAST_MATCH_KEY, match)
}