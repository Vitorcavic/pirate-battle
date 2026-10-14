import type { KeyboardEvent } from 'react'
import { useUiStore, type MenuTab } from '../store/uiStore'
import { assetUrl } from './assetUrl'
import { HistoryTab } from './HistoryTab'
import { RankingTab } from './RankingTab'
import { ScenarioPanel } from './ScenarioPanel'

const CONTROLS: [string, string][] = [
  ['Move forward', 'W / ↑'],
  ['Turn left / right', 'A D / ← →'],
  ['Fire front', 'Space'],
  ['Fire left broadside', 'Q'],
  ['Fire right broadside', 'E'],
  ['Pause', 'Esc / P'],
]

const TABS: { id: MenuTab; label: string }[] = [
  { id: 'ranking', label: 'Ranking' },
  { id: 'history', label: 'Match History' },
]

export function MainMenu() {
  const go = useUiStore((s) => s.go)
  const startMatch = useUiStore((s) => s.startMatch)
  const tab = useUiStore((s) => s.menuTab)
  const setTab = useUiStore((s) => s.setMenuTab)

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    const next = tab === 'ranking' ? 'history' : 'ranking'
    setTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <main className="screen">
      <img className="title-img" src={assetUrl('ui/menu/title_pirate_battle.png')} alt="Pirate Battle" />
      <div className="menu-grid">
        <section className="panel" aria-labelledby="play-heading">
          <h2 id="play-heading">Play</h2>
          <div className="stack">
            <button className="btn btn-primary" onClick={startMatch} autoFocus>Play</button>
            <button className="btn" onClick={() => go('options')}>Options</button>
          </div>
          <h3>Controls</h3>
          <dl className="controls-list">
            {CONTROLS.map(([action, keys]) => (
              <div key={action}>
                <dt>{action}</dt>
                <dd>{keys}</dd>
              </div>
            ))}
          </dl>
          <p className="hint">On touch screens, use the on-screen buttons during a match.</p>
        </section>

        <section className="panel" aria-label="Leaderboards">
          <div role="tablist" aria-label="Leaderboards" className="tabs" onKeyDown={onTabKey}>
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel">
            {tab === 'ranking' ? <RankingTab /> : <HistoryTab />}
          </div>
        </section>
      </div>
      <ScenarioPanel />
    </main>
  )
}