function param(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name)
  } catch {
    return null
  }
}

function num(value: string | null | undefined, fallback: number, min = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) && n >= min ? n : fallback
}

const env = import.meta.env as Record<string, string | undefined>

/** Build-time env vars (VITE_*) with URL overrides, so tests can control timing. */
export const runtimeConfig = {
  apiBaseUrl: env.VITE_API_BASE_URL ?? '/api',
  /** Set VITE_ENABLE_MOCKS=false to talk to a real backend. */
  mocksEnabled: env.VITE_ENABLE_MOCKS !== 'false',
  apiTimeoutMs: num(param('apiTimeout') ?? env.VITE_API_TIMEOUT_MS, 5000, 1),
  queryRetries: Math.floor(num(param('retries'), 2)),
  retryDelayMs: num(param('retryDelay'), 1000),
  mockLatencyScale: num(param('latencyScale'), 1),
  mockSeed: Math.floor(num(param('mockSeed'), 20260101)),
  initialScenario: param('scenario'),
} as const