import type { StoredMatch } from '../store/persistence'
import type { MatchRecord } from './contracts'
import type { PlayerIdentity } from './identity'

export function buildMatchRecord(match: StoredMatch, player: PlayerIdentity): MatchRecord {
  return {
    matchId: match.matchId,
    playerId: player.id,
    playerName: player.name,
    endedAt: match.endedAt,
    score: match.score,
    duration: Math.round(match.duration * 100) / 100,
    reason: match.reason,
    config: { ...match.settings },
  }
}