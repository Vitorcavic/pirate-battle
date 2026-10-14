import { EMPTY_INPUT, type InputState } from '../sim/types'

export type TouchButton = 'forward' | 'left' | 'right' | 'fireFront' | 'fireLeft' | 'fireRight'

/** Held on-screen buttons. Each button tracks its own pointer, so multi-touch works. */
export class TouchInput {
  private readonly active = new Set<TouchButton>()

  press(button: TouchButton): void {
    this.active.add(button)
  }
  release(button: TouchButton): void {
    this.active.delete(button)
  }
  reset(): void {
    this.active.clear()
  }

  read(): InputState {
    const a = this.active
    const left = a.has('left')
    const right = a.has('right')
    return {
      ...EMPTY_INPUT,
      forward: a.has('forward'),
      turn: left === right ? 0 : left ? -1 : 1,
      fireFront: a.has('fireFront'),
      fireLeft: a.has('fireLeft'),
      fireRight: a.has('fireRight'),
    }
  }
}