import type { ReactNode } from 'react'
import { describeError } from '../api/errors'

interface Props {
  name: string // "ranking" | "match history"
  isPending: boolean
  isFetching: boolean
  isError: boolean
  error: unknown
  hasData: boolean
  isEmpty: boolean
  emptyText: string
  onRetry: () => void
  onFirstPage?: () => void
  children: ReactNode
}

export function ListShell(props: Props) {
  const { name, isPending, isFetching, isError, error, hasData, isEmpty, emptyText, onRetry, onFirstPage, children } = props

  if (isPending) {
    return (
      <p role="status" className="hint" data-testid="list-loading">
        Loading {name}…
      </p>
    )
  }
  if (isError && !hasData) {
    return (
      <div role="alert" className="error-box" data-testid="list-error">
        <p>
          Could not load the {name}. {describeError(error)}
        </p>
        <div className="row">
          <button className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
          {onFirstPage && (
            <button className="btn" onClick={onFirstPage}>
              Back to first page
            </button>
          )}
        </div>
      </div>
    )
  }
  return (
    <div aria-busy={isFetching}>
      {isError && (
        <p role="alert" className="error" data-testid="list-stale-error">
          Could not refresh the {name}: {describeError(error)} Showing the last loaded data.{' '}
          <button className="link-btn" onClick={onRetry}>
            Retry
          </button>
        </p>
      )}
      {isFetching && (
        <p className="hint" data-testid="list-updating">
          Updating…
        </p>
      )}
      {isEmpty ? (
        <p className="hint" data-testid="list-empty">
          {emptyText}
        </p>
      ) : (
        children
      )}
    </div>
  )
}