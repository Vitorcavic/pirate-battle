import { useState } from 'react'
import { useHistoryQuery } from '../api/hooks'
import { getPlayer } from '../api/identity'
import { formatDate, formatDuration, REASON_LABEL } from './format'
import { ListShell } from './ListShell'
import { Pagination } from './Pagination'
import { PendingMatches } from './SyncStatus'

export function HistoryTab() {
  const [page, setPage] = useState(1)
  const player = getPlayer()
  const query = useHistoryQuery(player.id, page)
  const data = query.data

  return (
    <div data-testid="history-panel">
      <PendingMatches />
      <ListShell
        name="match history"
        isPending={query.isPending}
        isFetching={query.isFetching}
        isError={query.isError}
        error={query.error}
        hasData={data !== undefined}
        isEmpty={data?.total === 0}
        emptyText="You have not completed any match yet. Hit Play!"
        onRetry={() => void query.refetch()}
        onFirstPage={page > 1 ? () => setPage(1) : undefined}
      >
        {data && (
          <>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Match history table">
              <table className="data-table">
                <caption className="sr-only">Your matches, most recent first</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col" className="num">Score</th>
                    <th scope="col" className="num">Duration</th>
                    <th scope="col">Ended because</th>
                  </tr>
                </thead>
                <tbody data-testid="history-rows">
                  {data.items.map((record) => (
                    <tr key={record.matchId}>
                      <th scope="row">{formatDate(record.endedAt)}</th>
                      <td className="num">{record.score}</td>
                      <td className="num">{formatDuration(record.duration)}</td>
                      <td>{REASON_LABEL[record.reason]}</td>
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