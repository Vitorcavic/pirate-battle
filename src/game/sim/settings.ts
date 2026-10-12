import { SESSION_DURATION_LIMITS, SPAWN_INTERVAL_LIMITS, type UserSettings } from './config'

export type SettingsErrors = Partial<Record<keyof UserSettings, string>>

export function validateSettings(s: UserSettings): SettingsErrors {
  const errors: SettingsErrors = {}
  const { min: dMin, max: dMax } = SESSION_DURATION_LIMITS
  const { min: sMin, max: sMax } = SPAWN_INTERVAL_LIMITS

  if (!Number.isFinite(s.sessionDuration) || s.sessionDuration < dMin || s.sessionDuration > dMax)
    errors.sessionDuration = `Must be between ${dMin} and ${dMax} seconds.`
  if (!Number.isFinite(s.enemySpawnInterval) || s.enemySpawnInterval < sMin || s.enemySpawnInterval > sMax)
    errors.enemySpawnInterval = `Must be between ${sMin} and ${sMax} seconds.`
  return errors
}