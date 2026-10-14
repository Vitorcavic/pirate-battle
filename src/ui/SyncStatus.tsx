import { getPlayer } from '../api/identity'
import { buildMatchRecord } from '../api/records'
import type { StoredMatch } from '../store/persistence'
import { useSyncStore, type SyncItem } from '../store/syncStore'
import { formatDate } from './format'

function statusLabel(item: SyncItem): string {
  switch (item.status) {
    case 'queued':
      return 'Waiting to be sent…'
    case 'sending':
      return 'Saving…'
    case 'failed':
      return `Not saved yet: ${item.error ?? 'unknown error'}`
    case 'saved':
      return 'Saved to your history and the ranking'
  }
}

/** Record status shown on the result screen. */
export function RecordStatus({ match }: { match: StoredMatch }) {
  const item = useSyncStore((s) => s.items.find((i) => i.record.matchId === match.matchId))
  const enqueue = useSyncStore((s) => s.enqueue)
  const retry = useSyncStore((s) => s.retry)

  if (!item) {
    return (
      <span className="record-status">
        <span role="status" data-testid="record-status" data-status="missing">Not submitted</span>
        <button className="btn" onClick={() => enqueue(buildMatchRecord(match, getPlayer()))}>
          Submit
        </button>
      </span>
    )
  }
  return (
    <span className="record-status">
      <span role="status" data-testid="record-status" data-status={item.status}>
        {statusLabel(item)}
      </span>
      {item.status === 'failed' && (
        <button className="btn" onClick={() => retry(item.record.matchId)}>
          Retry
        </button>
      )}
    </span>
  )
}

/** Matches that finished but are not confirmed by the server yet. */
export function PendingMatches() {
  const items = useSyncStore((s) => s.items)
  const retry = useSyncStore((s) => s.retry)
  const pending = items.filter((i) => i.status !== 'saved')
  if (pending.length === 0) return null

  return (
    <section className="pending-box" aria-label="Matches waiting to be saved" data-testid="pending-list">
      <h3>Waiting to be saved</h3>
      <ul>
        {pending.map((item) => (
          <li key={item.record.matchId}>
            <span>
              {formatDate(item.record.endedAt)}, score {item.record.score}
            </span>
            <span className="hint" data-testid="pending-status" data-status={item.status}>
              {statusLabel(item)}
            </span>
            {item.status === 'failed' && (
              <button className="btn" onClick={() => retry(item.record.matchId)}>
                Retry
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}