import { useHudStore } from '../store/hudStore'
import { assetUrl } from './assetUrl'

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function Hud({ onPause, canPause }: { onPause: () => void; canPause: boolean }) {
  // Selectors return whole numbers, so React only re-renders when a visible value changes
  const score = useHudStore((s) => s.score)
  const seconds = useHudStore((s) => Math.ceil(s.timeLeft))
  const health = useHudStore((s) => Math.ceil(s.health))

  return (
    <div className="hud">
      <div className="hud-item">
        <img src={assetUrl('ui/hud/icon_score.png')} alt="" width={28} height={28} />
        <span className="hud-label">Score</span>
        <strong data-testid="hud-score">{score}</strong>
      </div>
      <div className="hud-item">
        <img src={assetUrl('ui/hud/icon_time.png')} alt="" width={28} height={28} />
        <span className="hud-label">Time</span>
        <strong data-testid="hud-time">{formatTime(seconds)}</strong>
      </div>
      <div className="hud-item">
        <img src={assetUrl('ui/hud/icon_heart.png')} alt="" width={28} height={28} />
        <span className="hud-label">Hull</span>
        <strong data-testid="hud-health">{health}</strong>
      </div>
      <button className="btn hud-pause" onClick={onPause} disabled={!canPause} aria-label="Pause game">
        <img src={assetUrl('ui/controls/icon_pause.png')} alt="" width={22} height={22} />
      </button>
    </div>
  )
}

/** Screen-reader view of the match. Announces events only (never the clock). */
export function MatchAnnouncer() {
  const score = useHudStore((s) => s.score)
  const paused = useHudStore((s) => s.paused)
  const status = useHudStore((s) => s.status)
  const reason = useHudStore((s) => s.endReason)

  let message = `Score ${score}`
  if (status === 'ended') message = `Match over: ${reason === 'death' ? 'your ship was sunk' : 'time is up'}. Final score ${score}`
  else if (paused) message = 'Game paused'

  return (
    <p className="sr-only" role="status" aria-live="polite" data-testid="match-status">
      {message}
    </p>
  )
}