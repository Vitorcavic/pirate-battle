import axios from 'axios'
import { runtimeConfig } from './runtimeConfig'
import { toApiError } from './errors'

export const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: runtimeConfig.apiTimeoutMs,
  headers: { Accept: 'application/json' },
})

// Every failure leaves here as an ApiError, so callers never inspect Axios internals.
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isCancel(error)) return Promise.reject(error) // cancelled by TanStack Query
  return Promise.reject(toApiError(error))
})