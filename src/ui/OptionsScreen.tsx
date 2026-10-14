import { useState, type FormEvent } from 'react'
import { DEFAULT_SETTINGS, SESSION_DURATION_LIMITS, SPAWN_INTERVAL_LIMITS } from '../game/sim/config'
import { validateSettings } from '../game/sim/settings'
import { useUiStore } from '../store/uiStore'

function parse(text: string): number {
  return text.trim() === '' ? Number.NaN : Number(text)
}

export function OptionsScreen() {
  const settings = useUiStore((s) => s.settings)
  const updateSettings = useUiStore((s) => s.updateSettings)
  const go = useUiStore((s) => s.go)

  const [duration, setDuration] = useState(String(settings.sessionDuration))
  const [spawn, setSpawn] = useState(String(settings.enemySpawnInterval))
  const [saved, setSaved] = useState(false)

  const draft = { sessionDuration: parse(duration), enemySpawnInterval: parse(spawn) }
  const errors = validateSettings(draft)
  const hasErrors = Object.keys(errors).length > 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (hasErrors) return
    updateSettings(draft)
    setSaved(true)
  }
  const restoreDefaults = () => {
    setDuration(String(DEFAULT_SETTINGS.sessionDuration))
    setSpawn(String(DEFAULT_SETTINGS.enemySpawnInterval))
    setSaved(false)
  }

  return (
    <main className="screen">
      <form className="panel narrow" onSubmit={submit} noValidate>
        <h1>Options</h1>

        <div className="field">
          <label htmlFor="opt-duration">Game session time (seconds)</label>
          <input
            id="opt-duration"
            type="number"
            inputMode="decimal"
            value={duration}
            onChange={(e) => { setDuration(e.target.value); setSaved(false) }}
            aria-invalid={errors.sessionDuration ? true : undefined}
            aria-describedby={errors.sessionDuration ? 'opt-duration-hint opt-duration-error' : 'opt-duration-hint'}
          />
          <p id="opt-duration-hint" className="hint">
            {SESSION_DURATION_LIMITS.min}–{SESSION_DURATION_LIMITS.max} seconds
          </p>
          {errors.sessionDuration && <p id="opt-duration-error" className="error" role="alert">{errors.sessionDuration}</p>}
        </div>

        <div className="field">
          <label htmlFor="opt-spawn">Enemy spawn time (seconds)</label>
          <input
            id="opt-spawn"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={spawn}
            onChange={(e) => { setSpawn(e.target.value); setSaved(false) }}
            aria-invalid={errors.enemySpawnInterval ? true : undefined}
            aria-describedby={errors.enemySpawnInterval ? 'opt-spawn-hint opt-spawn-error' : 'opt-spawn-hint'}
          />
          <p id="opt-spawn-hint" className="hint">
            {SPAWN_INTERVAL_LIMITS.min}–{SPAWN_INTERVAL_LIMITS.max} seconds between spawns
          </p>
          {errors.enemySpawnInterval && <p id="opt-spawn-error" className="error" role="alert">{errors.enemySpawnInterval}</p>}
        </div>

        <p role="status" className="success">{saved ? 'Options saved.' : ''}</p>

        <div className="row">
          <button type="submit" className="btn btn-primary">Save</button>
          <button type="button" className="btn" onClick={restoreDefaults}>Restore defaults</button>
          <button type="button" className="btn" onClick={() => go('menu')}>Back</button>
        </div>
      </form>
    </main>
  )
}