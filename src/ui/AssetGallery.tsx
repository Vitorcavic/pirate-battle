import { useState } from 'react'

const R = `${import.meta.env.BASE_URL}assets/png/retina/`
const ships = [
  ...Array.from({ length: 24 }, (_, i) => `ships/ship_${i + 1}.png`),
  ...[1, 2, 3].map((i) => `ships/dinghy_small_${i}.png`),
  ...[1, 2, 3].map((i) => `ships/dinghy_large_${i}.png`),
]
const tiles = Array.from({ length: 96 }, (_, i) => `tiles/tile_${i + 1}.png`)

function Item({ path }: { path: string }) {
  const [size, setSize] = useState('')
  return (
    <figure style={{ margin: 0, textAlign: 'center', fontSize: 11 }}>
      <img
        src={R + path}
        alt={path}
        style={{ maxWidth: 90, maxHeight: 90, background: '#0b3d5c' }}
        onLoad={(e) => setSize(`${e.currentTarget.naturalWidth}×${e.currentTarget.naturalHeight}`)}
      />
      <figcaption>{path.split('/')[1]?.replace('.png', '')}<br />{size}</figcaption>
    </figure>
  )
}

export function AssetGallery() {
  return (
    <div style={{ padding: 12, height: '100%', overflow: 'auto', boxSizing: 'border-box' }}>
      <h2>Ships</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{ships.map((p) => <Item key={p} path={p} />)}</div>
      <h2>Tiles</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{tiles.map((p) => <Item key={p} path={p} />)}</div>
    </div>
  )
}