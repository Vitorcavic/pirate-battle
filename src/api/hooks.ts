import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchHistory, fetchRanking } from './endpoints'
import { PAGE_SIZE, type MatchConfig } from './contracts'
import { queryKeys } from './queryKeys'

export function useRankingQuery(config: MatchConfig, page: number) {
  return useQuery({
    queryKey: queryKeys.rankingPage(config, page),
    queryFn: ({ signal }) => fetchRanking({ ...config, page, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData, // keep the old page on screen while the next one loads
    refetchOnMount: 'always', // showing the tab again always refreshes it
  })
}

export function useHistoryQuery(playerId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.historyPage(playerId, page),
    queryFn: ({ signal }) => fetchHistory(playerId, page, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
    refetchOnMount: 'always',
  })
}