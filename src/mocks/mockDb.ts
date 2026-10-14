import { isMatchRecord, type MatchRecord } from '../api/contracts'

const KEY = 'pb:mock:db:v1'

/** Confirmed records live in localStorage, so they survive a refresh (and are shared across tabs). */
export function listStoredRecords(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as unknown[]).filter(isMatchRecord) : []
  } catch {
    return []
  }
}

export function insertStoredRecord(record: MatchRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...listStoredRecords(), record]))
  } catch {
    /* quota: the mock simply forgets it */
  }
}

export function resetStoredRecords(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}