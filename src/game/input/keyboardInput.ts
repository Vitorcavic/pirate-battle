import { EMPTY_INPUT, type InputState } from '../sim/types'

const GAME_KEYS = new Set([
  'KeyW', 'ArrowUp', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'Space', 'KeyQ', 'KeyE',
])

export class KeyboardInput {
  private readonly down = new Set<string>()

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (!GAME_KEYS.has(e.code)) return
    e.preventDefault() // only while attached, i.e. during gameplay
    this.down.add(e.code)
  }
  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.down.delete(e.code)
  }
  private readonly onBlur = () => {
    this.down.clear() // no stuck keys after losing focus
  }

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.down.clear()
  }

  read(): InputState {
    const d = this.down
    const left = d.has('KeyA') || d.has('ArrowLeft')
    const right = d.has('KeyD') || d.has('ArrowRight')
    return {
      ...EMPTY_INPUT,
      forward: d.has('KeyW') || d.has('ArrowUp'),
      turn: left === right ? 0 : left ? -1 : 1,
      fireFront: d.has('Space'),
      fireLeft: d.has('KeyQ'),
      fireRight: d.has('KeyE'),
    }
  }
}