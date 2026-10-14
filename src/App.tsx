import { MainMenu } from './ui/MainMenu'
import { MatchScreen } from './ui/MatchScreen'
import { OptionsScreen } from './ui/OptionsScreen'
import { ResultScreen } from './ui/ResultScreen'
import { RotateNotice } from './ui/RotateNotice'
import { AssetGallery } from './ui/AssetGallery'
import { useUiStore } from './store/uiStore'
import './index.css'

export default function App() {
  const screen = useUiStore((s) => s.screen)
  const matchNonce = useUiStore((s) => s.matchNonce)

  if (new URLSearchParams(window.location.search).has('gallery')) return <AssetGallery />

  return (
    <>
      <RotateNotice />
      {screen === 'menu' && <MainMenu />}
      {screen === 'options' && <OptionsScreen />}
      {screen === 'match' && <MatchScreen key={matchNonce} />}
      {screen === 'result' && <ResultScreen />}
    </>
  )
}