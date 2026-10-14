import { useUiStore } from '../store/uiStore'
import { formatDuration, REASON_LABEL } from './format'
import { RecordStatus } from './SyncStatus'

export function ResultScreen() {
  const match = useUiStore((s) => s.lastMatch)
  const go = useUiStore((s) => s.go)
  const startMatch = useUiStore((s) => s.startMatch)
  const acknowledge = useUiStore((s) => s.acknowledgeResult)

  if (!match) {
    return (
      <main className="screen">
        <div className="panel narrow">
          <p>No match to show.</p>
          <button className="btn btn-primary" onClick={() => go('menu')} autoFocus>Main Menu</button>
        </div>
      </main>
    )
  }

  return (
    <main className="screen">
      <section className="panel narrow" aria-labelledby="result-title">
        <h1 id="result-title">Match result</h1>
        <dl className="result-list">
          <div><dt>Score</dt><dd data-testid="result-score">{match.score}</dd></div>
          <div><dt>Time played</dt><dd data-testid="result-duration">{formatDuration(match.duration)}</dd></div>
          <div><dt>Ended because</dt><dd data-testid="result-reason">{REASON_LABEL[match.reason]}</dd></div>
          <div><dt>Match record</dt><dd><RecordStatus match={match} /></dd></div>
        </dl>
        {/* The player can always start another match, even with a record still pending */}
        <div className="row">
          <button className="btn btn-primary" autoFocus onClick={() => { acknowledge(); startMatch() }}>
            Play Again
          </button>
          <button className="btn" onClick={() => { acknowledge(); go('menu') }}>Main Menu</button>
        </div>
      </section>
    </main>
  )
}