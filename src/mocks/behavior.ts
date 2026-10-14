import { delay, HttpResponse } from 'msw'
import { runtimeConfig } from '../api/runtimeConfig'
import { bump, getScenario, mockRandom } from './scenarioStore'
import { DEFAULT_LATENCY, SCENARIOS, type Endpoint, type Latency } from './scenarios'

export type Plan =
  | { kind: 'proceed' }
  | { kind: 'hang' } // never answer
  | { kind: 'persist-then-hang' } // register, then never answer (the client times out)
  | { kind: 'respond'; response: Response }

function latencyFor(latency: Latency, endpoint: Endpoint): number {
  switch (latency.kind) {
    case 'fixed':
      return latency.ms
    case 'random':
      return mockRandom().range(latency.min, latency.max)
    case 'out-of-order':
      return bump(`order:${endpoint}`) % 2 === 0 ? latency.slowMs : latency.fastMs
  }
}

/** Decides how this request behaves in the current scenario. Waits for the simulated latency. */
export async function planRequest(endpoint: Endpoint): Promise<Plan> {
  const scenario = SCENARIOS[getScenario()]
  const ms = latencyFor(scenario.latency ?? DEFAULT_LATENCY, endpoint) * runtimeConfig.mockLatencyScale
  if (ms > 0) await delay(ms)

  const rule = scenario.failures?.[endpoint]
  if (!rule) return { kind: 'proceed' }
  const used = bump(`failure:${endpoint}`)
  if (rule.times !== undefined && used >= rule.times) return { kind: 'proceed' }

  switch (rule.kind) {
    case 'timeout':
      return { kind: 'hang' }
    case 'persist-then-timeout':
      return { kind: 'persist-then-hang' }
    case 'network':
      return { kind: 'respond', response: HttpResponse.error() }
    case 'http': {
      const status = rule.status ?? 500
      return {
        kind: 'respond',
        response: HttpResponse.json({ error: 'simulated_failure', message: `Simulated HTTP ${status} response.` }, { status }),
      }
    }
  }
}

export async function hang(): Promise<Response> {
  await delay('infinite')
  return new HttpResponse(null, { status: 504 })
}