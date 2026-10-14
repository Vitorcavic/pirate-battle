import type { MatchConfig } from './contracts'

export const queryKeys = {
  /** Prefix: invalidates every ranking page of every configuration. */
  ranking: ['ranking'] as const,
  rankingPage: (config: MatchConfig, page: number) =>
    ['ranking', config.sessionDuration, config.enemySpawnInterval, page] as const,
  history: ['history'] as const,
  historyPage: (playerId: string, page: number) => ['history', playerId, page] as const,
}