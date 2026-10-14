export type Endpoint = 'ranking' | 'history' | 'register'

export type Latency =
  | { kind: 'fixed'; ms: number }
  | { kind: 'random'; min: number; max: number } // seeded: reproducible
  | { kind: 'out-of-order'; slowMs: number; fastMs: number } // every other request is slow

export type FailureKind = 'timeout' | 'network' | 'http' | 'persist-then-timeout'

export interface FailureRule {
  kind: FailureKind
  status?: number // for 'http'
  /** Fail only the first N requests, then behave normally. Omit for "always". */
  times?: number
}

export interface ScenarioDef {
  label: string
  description: string
  hideFixtures?: boolean
  seedPlayerHistory?: boolean
  latency?: Latency
  failures?: Partial<Record<Endpoint, FailureRule>>
}

export type ScenarioId =
  | 'normal'
  | 'many-matches'
  | 'empty'
  | 'slow'
  | 'variable-latency'
  | 'out-of-order'
  | 'timeout'
  | 'network-error'
  | 'server-error'
  | 'client-error'
  | 'ranking-error'
  | 'history-error'
  | 'register-timeout-once'
  | 'register-flaky'
  | 'register-unavailable'

export const DEFAULT_SCENARIO: ScenarioId = 'normal'
export const DEFAULT_LATENCY: Latency = { kind: 'fixed', ms: 250 }

const everywhere = (rule: FailureRule): ScenarioDef['failures'] => ({ ranking: rule, history: rule, register: rule })

export const SCENARIOS: Record<ScenarioId, ScenarioDef> = {
  normal: {
    label: 'Normal',
    description: 'Ranking with fixture players. Your history starts empty and grows as you play.',
  },
  'many-matches': {
    label: 'Many matches (pagination)',
    description: 'Adds 27 demo matches to your history so Match History has several pages.',
    seedPlayerHistory: true,
  },
  empty: {
    label: 'Empty lists',
    description: 'Ranking and history are empty until you finish a match.',
    hideFixtures: true,
  },
  slow: {
    label: 'Slow network (2.5 s)',
    description: 'Every request takes 2.5 seconds.',
    latency: { kind: 'fixed', ms: 2500 },
  },
  'variable-latency': {
    label: 'Variable latency (0.1–3 s)',
    description: 'Random latency from a seeded generator, so runs are reproducible.',
    latency: { kind: 'random', min: 100, max: 3000 },
  },
  'out-of-order': {
    label: 'Out-of-order responses',
    description: 'Every other request is slow, so older responses arrive after newer ones.',
    latency: { kind: 'out-of-order', slowMs: 2800, fastMs: 200 },
  },
  timeout: {
    label: 'Timeout (no response)',
    description: 'No request is ever answered. The client gives up after its timeout.',
    failures: everywhere({ kind: 'timeout' }),
  },
  'network-error': {
    label: 'Connection failure',
    description: 'Every request fails at the network level.',
    failures: everywhere({ kind: 'network' }),
  },
  'server-error': {
    label: 'HTTP 500 everywhere',
    description: 'Every request answers 500.',
    failures: everywhere({ kind: 'http', status: 500 }),
  },
  'client-error': {
    label: 'HTTP 4xx (403 / 422)',
    description: 'Queries answer 403 and match registration answers 422. These are not retried automatically.',
    failures: {
      ranking: { kind: 'http', status: 403 },
      history: { kind: 'http', status: 403 },
      register: { kind: 'http', status: 422 },
    },
  },
  'ranking-error': {
    label: 'Ranking unavailable (500)',
    description: 'Only the ranking query fails. Match History keeps working.',
    failures: { ranking: { kind: 'http', status: 500 } },
  },
  'history-error': {
    label: 'History unavailable (500)',
    description: 'Only the history query fails. Ranking keeps working.',
    failures: { history: { kind: 'http', status: 500 } },
  },
  'register-timeout-once': {
    label: 'Timeout after registering',
    description: 'The first submission is saved by the server but never answered. The retry must not duplicate it.',
    failures: { register: { kind: 'persist-then-timeout', times: 1 } },
  },
  'register-flaky': {
    label: 'Flaky registration',
    description: 'The first two submissions fail with 503 and the third succeeds (automatic retries).',
    failures: { register: { kind: 'http', status: 503, times: 2 } },
  },
  'register-unavailable': {
    label: 'Registration unavailable (503)',
    description: 'Submissions fail until you switch scenario. Then press Retry.',
    failures: { register: { kind: 'http', status: 503 } },
  },
}

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return typeof value === 'string' && (SCENARIO_IDS as string[]).includes(value)
}