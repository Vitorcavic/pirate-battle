import type { MatchConfig, MatchRecord } from '../api/contracts'
import type { PlayerIdentity } from '../api/identity'
import { Rng } from '../game/sim/random'

const NAMES = [
  'Salty Pete', 'Red Marlow', 'Captain Coral', 'Mad Mabel', 'One-Eye Ozzie', 'Barnacle Bill',
  'Storm Sally', 'Rusty Anchor', 'Dread Dolly', 'Jolly Jonas', 'Kraken Kate', 'Lucky Lars',
  'Mutiny Mo', 'Tidewater Tom', 'Cutlass Cleo', 'Driftwood Dan', 'Scurvy Sue', 'Plank Percy',
]

export const FIXTURE_CONFIG: MatchConfig = { sessionDuration: 120, enemySpawnInterval: 2.5 }

/** Several pages for the default options, a few for others, none for the rest. */
const FIXTURE_SETS: { config: MatchConfig; count: number }[] = [
  { config: FIXTURE_CONFIG, count: 37 },
  { config: { sessionDuration: 60, enemySpawnInterval: 2.5 }, count: 14 },
  { config: { sessionDuration: 180, enemySpawnInterval: 2.5 }, count: 11 },
]

const BASE_TIME = Date.UTC(2026, 8, 1, 12, 0, 0) // fixed: fixtures never depend on "now"
const SPREAD_SECONDS = 40 * 24 * 3600

function makeRecord(rng: Rng, matchId: string, player: PlayerIdentity, config: MatchConfig): MatchRecord {
  const died = rng.next() < 0.45
  const duration = died ? Math.round(rng.range(18, config.sessionDuration - 4) * 10) / 10 : config.sessionDuration
  const score = Math.max(0, Math.round(rng.range(3, 30) * (duration / 120)))
  const endedAt = new Date(BASE_TIME - Math.floor(rng.range(0, SPREAD_SECONDS)) * 1000).toISOString()
  return {
    matchId,
    playerId: player.id,
    playerName: player.name,
    endedAt,
    score, // small range on purpose: ties exercise the tie-break rule
    duration,
    reason: died ? 'death' : 'time',
    config: { ...config },
  }
}

let fixtures: MatchRecord[] | null = null

export function buildFixtureRecords(): MatchRecord[] {
  if (fixtures) return fixtures
  const rng = new Rng(4242)
  const records: MatchRecord[] = []
  for (const set of FIXTURE_SETS) {
    for (let i = 0; i < set.count; i++) {
      const index = (i * 7 + set.count) % NAMES.length
      const player: PlayerIdentity = { id: `fixture-player-${index}`, name: NAMES[index] ?? 'Unknown Pirate' }
      records.push(makeRecord(rng, `fixture-${set.config.sessionDuration}-${i}`, player, set.config))
    }
  }
  fixtures = records
  return records
}

/** Demo history for the current player (scenario "many matches"). */
export function buildPlayerHistoryFixtures(player: PlayerIdentity, count = 27): MatchRecord[] {
  const rng = new Rng(777)
  return Array.from({ length: count }, (_, i) => makeRecord(rng, `fixture-self-${i}`, player, FIXTURE_CONFIG))
}