import { useGameAssets } from './game/useGameAssets'
import { PixiCanvas } from './game/PixiCanvas'
import { LoadingScreen, LoadError } from './ui/LoadingScreen'
import { RotateNotice } from './ui/RotateNotice'
import './index.css'
import { AssetGallery } from './ui/AssetGallery'

export default function App() {
  const { state, retry } = useGameAssets()
  if (new URLSearchParams(location.search).has('gallery')) return <AssetGallery />
  return (
    <>
      <RotateNotice />
      {state.status === 'loading' && <LoadingScreen progress={state.progress} />}
      {state.status === 'error' && <LoadError onRetry={retry} />}
      {state.status === 'ready' && <PixiCanvas textures={state.textures} />}
    </>
  )
}