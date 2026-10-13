import { useState } from 'react'
import { ISLAND_TILES, islandPart, TILE_SIZE, type IslandPart } from '../game/render/assets'

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
      <IslandEditor />
      <h2>Ships</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{ships.map((p) => <Item key={p} path={p} />)}</div>
      <h2>Tiles</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{tiles.map((p) => <Item key={p} path={p} />)}</div>
    </div>
  )
}

type TileMap = Record<IslandPart, number>
const PARTS: IslandPart[] = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br']

function IslandPreview({ n, map }: { n: number; map: TileMap }) {
  const cells = []
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const num = map[islandPart(r, c, n)]
      cells.push(
        <img key={`${r}-${c}`} src={`${R}tiles/tile_${num}.png`} width={TILE_SIZE} height={TILE_SIZE}
             alt={`tile ${num}`} style={{ display: 'block' }} />,
      )
    }
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${n}, ${TILE_SIZE}px)`, width: n * TILE_SIZE,
      background: `url(${R}tiles/tile_73.png) 0 0 / ${TILE_SIZE}px ${TILE_SIZE}px`,
    }}>{cells}</div>
  )
}

function IslandEditor() {
  const [map, setMap] = useState<TileMap>({ ...ISLAND_TILES })
  return (
    <>
      <h2>Island editor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 90px)', gap: 8, marginBottom: 12 }}>
        {PARTS.map((p) => (
          <label key={p} style={{ fontSize: 12 }}>
            {p}
            <input
              type="number" min={1} max={96} value={map[p]}
              onChange={(e) => {
                const v = Math.min(96, Math.max(1, Number(e.target.value) || 1))
                setMap((m) => ({ ...m, [p]: v }))
              }}
              style={{ width: '100%' }}
            />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <IslandPreview n={2} map={map} />
        <IslandPreview n={3} map={map} />
        <IslandPreview n={4} map={map} />
      </div>
      <pre>{JSON.stringify(map)}</pre>
    </>
  )
}