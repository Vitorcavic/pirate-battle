export function LoadingScreen({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100)
  return (
    <div className="center-screen" role="status" aria-live="polite">
      <p>Loading assets… {pct}%</p>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Asset loading progress"
        className="bar"
      >
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function LoadError({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="center-screen" role="alert">
      <p>Could not load the game assets.</p>
      <div className="row">
        <button className="btn btn-primary" onClick={onRetry} autoFocus>Retry</button>
        <button className="btn" onClick={onBack}>Main Menu</button>
      </div>
    </div>
  )
}