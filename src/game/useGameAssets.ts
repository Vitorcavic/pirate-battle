import { useCallback, useEffect, useState } from 'react'
import { loadGameTextures, type GameTextures } from './render/assets'

type State =
  | { status: 'loading'; progress: number }
  | { status: 'ready'; textures: GameTextures }
  | { status: 'error' }

export function useGameAssets() {
  const [state, setState] = useState<State>({ status: 'loading', progress: 0 })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    loadGameTextures((p) => {
      if (!cancelled) setState({ status: 'loading', progress: p })
    })
      .then((textures) => {
        if (!cancelled) setState({ status: 'ready', textures })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', progress: 0 }) // event handler: allowed
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}