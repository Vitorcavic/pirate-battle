import { create } from 'zustand'
import { isMatchRecord, isObject, type MatchRecord } from '../api/contracts'

const KEY = 'pb:sync:v1'

export type SyncStatus = 'queued' | 'sending' | 'failed' | 'saved'

export interface SyncItem {
  record: MatchRecord
  status: SyncStatus
  attempts: number
  error: string | null
}

function load(): SyncItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    const items: SyncItem[] = []
    for (const entry of parsed as unknown[]) {
      if (!isObject(entry)) continue
      const record = entry.record
      if (!isMatchRecord(record)) continue
      items.push({
        record,
        // After a refresh nothing is in flight: everything unconfirmed is sent again
        status: entry.status === 'saved' ? 'saved' : 'queued',
        attempts: typeof entry.attempts === 'number' ? entry.attempts : 0,
        error: null,
      })
    }
    return items
  } catch {
    return []
  }
}

function save(items: SyncItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* quota or privacy mode */
  }
}

interface SyncState {
  items: SyncItem[]
  enqueue: (record: MatchRecord) => void
  markSending: (matchId: string) => void
  markSaved: (matchId: string) => void
  markFailed: (matchId: string, error: string) => void
  retry: (matchId: string) => void
  retryAll: () => void
  clear: () => void
}

function patch(items: SyncItem[], matchId: string, change: (item: SyncItem) => SyncItem): SyncItem[] {
  return items.map((item) => (item.record.matchId === matchId ? change(item) : item))
}

export const useSyncStore = create<SyncState>((set) => ({
  items: load(),

  // Idempotent: the same matchId is never queued twice
  enqueue: (record) =>
    set((s) => {
      if (s.items.some((i) => i.record.matchId === record.matchId)) return s
      const unconfirmed = s.items.filter((i) => i.status !== 'saved')
      return { items: [...unconfirmed, { record, status: 'queued', attempts: 0, error: null }] }
    }),

  markSending: (matchId) =>
    set((s) => ({
      items: patch(s.items, matchId, (i) => ({ ...i, status: 'sending', attempts: i.attempts + 1, error: null })),
    })),
  markSaved: (matchId) =>
    set((s) => ({ items: patch(s.items, matchId, (i) => ({ ...i, status: 'saved', error: null })) })),
  markFailed: (matchId, error) =>
    set((s) => ({ items: patch(s.items, matchId, (i) => ({ ...i, status: 'failed', error })) })),

  // Only a failed item can be retried: repeated clicks do nothing
  retry: (matchId) =>
    set((s) => ({
      items: patch(s.items, matchId, (i) => (i.status === 'failed' ? { ...i, status: 'queued', error: null } : i)),
    })),
  retryAll: () =>
    set((s) => ({
      items: s.items.map((i) => (i.status === 'failed' ? { ...i, status: 'queued', error: null } : i)),
    })),
  clear: () => set({ items: [] }),
}))

useSyncStore.subscribe((state) => save(state.items))