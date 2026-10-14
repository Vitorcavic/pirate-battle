function params(): URLSearchParams {
  try {
    return new URLSearchParams(window.location.search)
  } catch {
    return new URLSearchParams()
  }
}

/** Test instrumentation is opt-in per page load: ?e2e=1 */
export const isTestMode = (): boolean => params().has('e2e')

/** With ?manual=1 the simulation only advances through __pb.step(). */
export const testManualClock = (): boolean => isTestMode() && params().has('manual')

export function testSeed(): number | undefined {
  if (!isTestMode()) return undefined
  const raw = params().get('seed')
  const value = Number(raw)
  return raw !== null && raw !== '' && Number.isFinite(value) ? value : undefined
}