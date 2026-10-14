import axios from 'axios'
import { isObject } from './contracts'

export type ApiErrorKind = 'timeout' | 'network' | 'http'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  /** Worth trying again (network, timeout, 408, 429, 5xx). Other 4xx are not. */
  readonly retryable: boolean

  constructor(kind: ApiErrorKind, message: string, status: number | null, retryable: boolean) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.retryable = retryable
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The request timed out.', null, true)
    }
    if (error.response) {
      const { status, data } = error.response
      const message =
        isObject(data) && typeof data.message === 'string' ? data.message : `The server answered with status ${status}.`
      return new ApiError('http', message, status, status >= 500 || status === 408 || status === 429)
    }
    return new ApiError('network', 'Could not reach the server.', null, true)
  }
  return new ApiError('network', error instanceof Error ? error.message : 'Unknown error.', null, false)
}

export const isRetryable = (error: unknown): boolean => toApiError(error).retryable
export const describeError = (error: unknown): string => toApiError(error).message