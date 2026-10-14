interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span aria-live="polite" data-testid="page-indicator">
        Page {page} of {totalPages}
      </span>
      <button className="btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next
      </button>
    </nav>
  )
}