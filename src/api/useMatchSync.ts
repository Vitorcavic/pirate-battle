import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSyncStore } from '../store/syncStore'
import type { MatchRecord } from './contracts'
import { submitMatch } from './endpoints'
import { describeError, isRetryable } from './errors'
import { backoff } from './queryClient'
import { queryKeys } from './queryKeys'

const MAX_AUTO_RETRIES = 2

export function useMatchSync(): void {
  const queryClient = useQueryClient()
  const items = useSyncStore((s) => s.items)

  const { mutate, isPending } = useMutation({
    mutationFn: (record: MatchRecord) => submitMatch(record),
    retry: (failureCount, error) => failureCount < MAX_AUTO_RETRIES && isRetryable(error),
    retryDelay: backoff,
    onSuccess: (_response, record) => {
      useSyncStore.getState().markSaved(record.matchId)
      // Both tabs must show the new match
      void queryClient.invalidateQueries({ queryKey: queryKeys.ranking })
      void queryClient.invalidateQueries({ queryKey: queryKeys.history })
    },
    onError: (error, record) => {
      useSyncStore.getState().markFailed(record.matchId, describeError(error))
    },
  })

  const nextId = items.find((i) => i.status === 'queued')?.record.matchId

  useEffect(() => {
    if (!nextId || isPending) return
    const store = useSyncStore.getState()
    if (store.items.some((i) => i.status === 'sending')) return // one at a time
    const item = store.items.find((i) => i.record.matchId === nextId)
    if (item?.status !== 'queued') return // Strict Mode / race guard
    store.markSending(nextId)
    mutate(item.record)
  }, [nextId, isPending, mutate])

  useEffect(() => {
    const onOnline = () => useSyncStore.getState().retryAll()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])
}