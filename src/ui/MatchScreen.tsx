import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameController, type GameHooks } from '../game/GameController'
import { TouchInput } from '../game/input/touchInput'
import { PixiCanvas } from '../game/PixiCanvas'
import { useGameAssets } from '../game/useGameAssets'
import { resetHud, useHudStore } from '../store/hudStore'
import { useUiStore } from '../store/uiStore'
import { Hud, MatchAnnouncer } from './Hud'
import { LoadError, LoadingScreen } from './LoadingScreen'
import { PauseOverlay } from './PauseOverlay'
import { TouchControls } from './TouchControls'

export function MatchScreen() {
  const { state, retry } = useGameAssets()
  // Snapshot of the options and a fresh id for this match (the screen remounts per match)
  const [settings] = useState(() => useUiStore.getState().settings)
  const [matchId] = useState(() => crypto.randomUUID())
  const [touch] = useState(() => new TouchInput())
  const [game, setGame] = useState<GameController | null>(null)
  const paused = useHudStore((s) => s.paused)
  const go = useUiStore((s) => s.go)

  useEffect(() => {
    resetHud(settings.sessionDuration)
  }, [settings])

  const hooks = useMemo<GameHooks>(
    () => ({
      onSnapshot: (snapshot) => useHudStore.setState(snapshot),
      onEnd: (result) => {
        useUiStore.getState().recordMatch({
          matchId,
          score: result.score,
          duration: result.duration,
          reason: result.reason,
          endedAt: new Date().toISOString(),
          settings,
          acknowledged: false,
        })
      },
    }),
    [matchId, settings],
  )
  const onController = useCallback((controller: GameController | null) => setGame(controller), [])

  if (state.status === 'loading') return <LoadingScreen progress={state.progress} />
  if (state.status === 'error') return <LoadError onRetry={retry} onBack={() => go('menu')} />

  return (
    <div className="game-shell" data-testid="match-screen">
      <PixiCanvas
        textures={state.textures}
        settings={settings}
        hooks={hooks}
        touch={touch}
        onController={onController}
      />
      <Hud onPause={() => game?.pause()} canPause={game !== null} />
      <TouchControls touch={touch} />
      <MatchAnnouncer />
      {paused && <PauseOverlay onResume={() => game?.resume()} onQuit={() => go('menu')} />}
    </div>
  )
}