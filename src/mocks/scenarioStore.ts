import { runtimeConfig } from '../api/runtimeConfig'
import { Rng } from '../game/sim/random'
import { DEFAULT_SCENARIO, isScenarioId, type ScenarioId } from './scenarios'

const KEY = 'pb:mock:scenario:v1'
const listeners = new Set<() => void>()
const counters = new Map<string, number>()
let rng = new Rng(runtimeConfig.mockSeed)

function persist(id: ScenarioId): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
}

function readInitial(): ScenarioId {
  if (isScenarioId(runtimeConfig.initialScenario)) {
    persist(runtimeConfig.initialScenario) // ?scenario=... wins and sticks across reloads
    return runtimeConfig.initialScenario
  }
  try {
    const stored = localStorage.getItem(KEY)
    if (isScenarioId(stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_SCENARIO
}

let current: ScenarioId = readInitial()

export const getScenario = (): ScenarioId => current

export function subscribeScenario(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setScenario(id: ScenarioId): void {
  current = id
  persist(id)
  counters.clear() // "first N requests" rules start over
  rng = new Rng(runtimeConfig.mockSeed)
  listeners.forEach((listener) => listener())
}

export const resetScenario = (): void => setScenario(DEFAULT_SCENARIO)

/** Returns the previous value and increments it. */
export function bump(key: string): number {
  const value = counters.get(key) ?? 0
  counters.set(key, value + 1)
  return value
}

export const mockRandom = (): Rng => rng