import { useUiStore } from '../store/uiStore'

const REASON_TEXT = { time: 'Time is up', death: 'Your ship was sunk' } as const

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
          <div><dt>Time played</dt><dd data-testid="result-duration">{match.duration.toFixed(1)} s</dd></div>
          <div><dt>Ended because</dt><dd data-testid="result-reason">{REASON_TEXT[match.reason]}</dd></div>
          {/* Replaced by the real record status (pending / saved / failed + retry) in Block 7 */}
          <div><dt>Match record</dt><dd data-testid="result-record">Not submitted yet</dd></div>
        </dl>
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