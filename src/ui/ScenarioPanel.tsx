import { useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { resetMockServer } from '../mocks/control'
import { getScenario, setScenario, subscribeScenario } from '../mocks/scenarioStore'
import { isScenarioId, SCENARIO_IDS, SCENARIOS } from '../mocks/scenarios'
import { useSyncStore } from '../store/syncStore'

export function ScenarioPanel() {
  const queryClient = useQueryClient()
  const scenario = useSyncExternalStore(subscribeScenario, getScenario)

  const onChange = (value: string) => {
    if (!isScenarioId(value)) return
    setScenario(value)
    void queryClient.invalidateQueries() // visible lists reload under the new scenario
  }

  const onReset = () => {
    resetMockServer() // default scenario + stored matches removed
    useSyncStore.getState().clear() // pending and saved submissions
    void queryClient.resetQueries()
  }

  return (
    <details className="panel scenario-panel" data-testid="scenario-panel">
      <summary>Network simulator (mock API)</summary>
      <div className="field">
        <label htmlFor="scenario-select">Scenario</label>
        <select
          id="scenario-select"
          value={scenario}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby="scenario-description"
        >
          {SCENARIO_IDS.map((id) => (
            <option key={id} value={id}>
              {SCENARIOS[id].label}
            </option>
          ))}
        </select>
        <p id="scenario-description" className="hint">
          {SCENARIOS[scenario].description}
        </p>
      </div>
      <div className="row">
        <button className="btn" onClick={onReset} data-testid="reset-mocks">
          Reset mock data
        </button>
      </div>
    </details>
  )
}