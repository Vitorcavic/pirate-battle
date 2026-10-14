import type { TouchButton, TouchInput } from '../game/input/touchInput'
import { assetUrl } from './assetUrl'

const MOVE: { id: TouchButton; label: string; icon: string }[] = [
  { id: 'left', label: 'Turn left', icon: 'icon_turn_left' },
  { id: 'right', label: 'Turn right', icon: 'icon_turn_right' },
  { id: 'forward', label: 'Move forward', icon: 'icon_forward' },
]
const FIRE: { id: TouchButton; label: string; icon: string }[] = [
  { id: 'fireLeft', label: 'Fire left', icon: 'icon_fire_left' },
  { id: 'fireFront', label: 'Fire front', icon: 'icon_fire_front' },
  { id: 'fireRight', label: 'Fire right', icon: 'icon_fire_right' },
]

function HoldButton({ id, label, icon, touch }: { id: TouchButton; label: string; icon: string; touch: TouchInput }) {
  return (
    <button
      type="button"
      className="touch-btn"
      aria-label={label}
      data-testid={`touch-${id}`}
      tabIndex={-1} // keyboard players use keys; these are for touch
      style={{ backgroundImage: `url(${assetUrl('ui/controls/button_round_normal.png')})` }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        touch.press(id)
      }}
      onPointerUp={() => touch.release(id)}
      onPointerCancel={() => touch.release(id)}
      onLostPointerCapture={() => touch.release(id)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img src={assetUrl(`ui/controls/${icon}.png`)} alt="" width={30} height={30} draggable={false} />
    </button>
  )
}

export function TouchControls({ touch }: { touch: TouchInput }) {
  // `?touch` forces them on a desktop browser (handy for manual testing)
  const forced = new URLSearchParams(window.location.search).has('touch')
  return (
    <div className={forced ? 'touch-controls forced' : 'touch-controls'}>
      <div className="touch-group">
        {MOVE.map((b) => <HoldButton key={b.id} {...b} touch={touch} />)}
      </div>
      <div className="touch-group">
        {FIRE.map((b) => <HoldButton key={b.id} {...b} touch={touch} />)}
      </div>
    </div>
  )
}