import type { KeyboardEvent } from 'react'

/** Keeps Tab inside the dialog while it is open. */
function trapTab(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'Tab') return
  const items = e.currentTarget.querySelectorAll<HTMLElement>('button')
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last?.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first?.focus()
  }
}

export function PauseOverlay({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="overlay">
      <div className="panel narrow" role="dialog" aria-modal="true" aria-labelledby="pause-title" onKeyDown={trapTab}>
        <h2 id="pause-title">Paused</h2>
        <p className="hint">The game is frozen. Resume when you are ready.</p>
        <div className="stack">
          <button className="btn btn-primary" onClick={onResume} autoFocus>Resume</button>
          <button className="btn" onClick={onQuit}>Main Menu</button>
        </div>
      </div>
    </div>
  )
}