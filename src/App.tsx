import { useMatchSync } from './api/useMatchSync'
import { AssetGallery } from './ui/AssetGallery'
import { MainMenu } from './ui/MainMenu'
import { MatchScreen } from './ui/MatchScreen'
import { OptionsScreen } from './ui/OptionsScreen'
import { ResultScreen } from './ui/ResultScreen'
import { RotateNotice } from './ui/RotateNotice'
import { useUiStore } from './store/uiStore'
import './index.css'

/** Keeps the submission queue running on every screen. Renders nothing. */
function MatchSyncer() {
  useMatchSync()
  return null
}

export default function App() {
  const screen = useUiStore((s) => s.screen)
  const matchNonce = useUiStore((s) => s.matchNonce)

  if (new URLSearchParams(window.location.search).has('gallery')) return <AssetGallery />

  return (
    <>
      <MatchSyncer />
      <RotateNotice />
      {screen === 'menu' && <MainMenu />}
      {screen === 'options' && <OptionsScreen />}
      {screen === 'match' && <MatchScreen key={matchNonce} />}
      {screen === 'result' && <ResultScreen />}
    </>
  )
}