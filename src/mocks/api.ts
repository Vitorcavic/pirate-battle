import {
  isMatchRecord,
  type MatchRecord,
  type Page,
  type RankingEntry,
  type RankingParams,
  type SubmitMatchResponse,
} from '../api/contracts'
import { getPlayer } from '../api/identity'
import { validateSettings } from '../game/sim/settings'
import { buildFixtureRecords, buildPlayerHistoryFixtures } from './fixtures'
import { insertStoredRecord, listStoredRecords } from './mockDb'
import { getScenario } from './scenarioStore'
import { SCENARIOS } from './scenarios'

function allRecords(): MatchRecord[] {
  const scenario = SCENARIOS[getScenario()]
  return [
    ...(scenario.hideFixtures ? [] : buildFixtureRecords()),
    ...(scenario.seedPlayerHistory ? buildPlayerHistoryFixtures(getPlayer()) : []),
    ...listStoredRecords(),
  ]
}

const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** Ranking order: higher score, then the earlier finished match, then matchId. Fully deterministic. */
export function compareRanking(a: MatchRecord, b: MatchRecord): number {
  return b.score - a.score || Date.parse(a.endedAt) - Date.parse(b.endedAt) || compareText(a.matchId, b.matchId)
}

/** History order: most recent first. */
function compareHistory(a: MatchRecord, b: MatchRecord): number {
  return Date.parse(b.endedAt) - Date.parse(a.endedAt) || compareText(a.matchId, b.matchId)
}

function paginate<T>(sorted: T[], page: number, pageSize: number): Page<T> {
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages) // out-of-range pages are clamped
  const start = (safePage - 1) * pageSize
  return { items: sorted.slice(start, start + pageSize), page: safePage, pageSize, total, totalPages }
}

export function listRanking(params: RankingParams): Page<RankingEntry> {
  const ranked = allRecords()
    .filter(
      (r) =>
        r.config.sessionDuration === params.sessionDuration && r.config.enemySpawnInterval === params.enemySpawnInterval,
    )
    .sort(compareRanking)
    .map((record, index) => ({ ...record, rank: index + 1 }))
  return paginate(ranked, params.page, params.pageSize)
}

export function listHistory(playerId: string, page: number, pageSize: number): Page<MatchRecord> {
  const own = allRecords()
    .filter((r) => r.playerId === playerId)
    .sort(compareHistory)
  return paginate(own, page, pageSize)
}

/** Idempotent: an existing matchId returns the stored record and creates nothing. */
export function registerMatch(record: MatchRecord): SubmitMatchResponse {
  const existing = listStoredRecords().find((r) => r.matchId === record.matchId)
  if (existing) return { record: existing, created: false }
  insertStoredRecord(record)
  return { record, created: true }
}

export type Validation = { ok: true; record: MatchRecord } | { ok: false; details: string[] }

export function validateSubmission(body: unknown): Validation {
  if (!isMatchRecord(body)) return { ok: false, details: ['Body is not a match record.'] }
  const details: string[] = []
  if (body.matchId.length < 1 || body.matchId.length > 64) details.push('matchId must have 1-64 characters.')
  if (body.playerId.length < 1 || body.playerId.length > 64) details.push('playerId must have 1-64 characters.')
  if (body.playerName.length < 1 || body.playerName.length > 40) details.push('playerName must have 1-40 characters.')
  if (!Number.isFinite(Date.parse(body.endedAt))) details.push('endedAt must be an ISO date.')
  if (!Number.isInteger(body.score) || body.score < 0 || body.score > 9999) details.push('score must be an integer from 0 to 9999.')
  if (Object.keys(validateSettings(body.config)).length > 0) details.push('config is outside the allowed limits.')
  else if (!(body.duration >= 0 && body.duration <= body.config.sessionDuration + 0.5)) {
    details.push('duration must be between 0 and the session time.')
  }
  return details.length > 0 ? { ok: false, details } : { ok: true, record: body }
}