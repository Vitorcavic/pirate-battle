import { QueryClient } from '@tanstack/react-query'
import { isRetryable } from './errors'
import { runtimeConfig } from './runtimeConfig'

/** Exponential backoff: 1 s, 2 s, 4 s... capped at 8 s. */
export const backoff = (attempt: number): number => Math.min(runtimeConfig.retryDelayMs * 2 ** attempt, 8000)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < runtimeConfig.queryRetries && isRetryable(error),
      retryDelay: backoff,
      refetchOnWindowFocus: true,
    },
  },
})