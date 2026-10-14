import { apiClient } from './client'
import {
  isPage,
  type MatchRecord,
  type Page,
  type RankingEntry,
  type RankingParams,
  type SubmitMatchResponse,
} from './contracts'
import { ApiError } from './errors'

/** A 200 with the wrong shape (e.g. an HTML fallback page) must become an error, not a crash. */
function assertPage<T>(data: unknown): Page<T> {
  if (!isPage(data)) throw new ApiError('http', 'The server sent an unexpected response.', null, false)
  return data as Page<T>
}

export async function fetchRanking(params: RankingParams, signal?: AbortSignal): Promise<Page<RankingEntry>> {
  const { data } = await apiClient.get<unknown>('/ranking', { params, signal })
  return assertPage<RankingEntry>(data)
}

export async function fetchHistory(
  playerId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<Page<MatchRecord>> {
  const { data } = await apiClient.get<unknown>(`/players/${encodeURIComponent(playerId)}/matches`, {
    params: { page, pageSize },
    signal,
  })
  return assertPage<MatchRecord>(data)
}

export async function submitMatch(record: MatchRecord): Promise<SubmitMatchResponse> {
  const { data } = await apiClient.post<SubmitMatchResponse>('/matches', record, {
    headers: { 'Idempotency-Key': record.matchId },
  })
  return data
}