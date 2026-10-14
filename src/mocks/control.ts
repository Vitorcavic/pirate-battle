import { resetStoredRecords } from './mockDb'
import { resetScenario } from './scenarioStore'

/** Back to the initial server state: default scenario and no stored matches. */
export function resetMockServer(): void {
  resetScenario()
  resetStoredRecords()
}