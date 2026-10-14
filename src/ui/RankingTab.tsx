import { useState } from 'react'
import { useRankingQuery } from '../api/hooks'
import { getPlayer } from '../api/identity'
import { useUiStore } from '../store/uiStore'
import { formatDate, formatDuration } from './format'
import { ListShell } from './ListShell'
import { Pagination } from './Pagination'

export function RankingTab() {
  const settings = useUiStore((s) => s.settings)
  const [page, setPage] = useState(1)
  const player = getPlayer()
  const query = useRankingQuery(settings, page)
  const data = query.data

  return (
    <div data-testid="ranking-panel">
      <p className="hint">
        Only matches played with the same options are compared: {settings.sessionDuration} s session,{' '}
        {settings.enemySpawnInterval} s spawn interval.
      </p>
      <ListShell
        name="ranking"
        isPending={query.isPending}
        isFetching={query.isFetching}
        isError={query.isError}
        error={query.error}
        hasData={data !== undefined}
        isEmpty={data?.total === 0}
        emptyText="No matches have been recorded for these options yet."
        onRetry={() => void query.refetch()}
        onFirstPage={page > 1 ? () => setPage(1) : undefined}
      >
        {data && (
          <>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Ranking table">
              <table className="data-table">
                <caption className="sr-only">Ranking, best score first</caption>
                <thead>
                  <tr>
                    <th scope="col" className="num">#</th>
                    <th scope="col">Player</th>
                    <th scope="col" className="num">Score</th>
                    <th scope="col" className="num">Time</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody data-testid="ranking-rows">
                  {data.items.map((entry) => (
                    <tr key={entry.matchId} className={entry.playerId === player.id ? 'me' : undefined}>
                      <td className="num">{entry.rank}</td>
                      <th scope="row">
                        {entry.playerName}
                        {entry.playerId === player.id ? ' (you)' : ''}
                      </th>
                      <td className="num">{entry.score}</td>
                      <td className="num">{formatDuration(entry.duration)}</td>
                      <td>{formatDate(entry.endedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </ListShell>
    </div>
  )
}