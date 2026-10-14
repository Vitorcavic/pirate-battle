export interface PlayerIdentity {
  id: string
  name: string
}

export const PLAYER_STORAGE_KEY = 'pb:player:v1'
let cached: PlayerIdentity | null = null

function isIdentity(value: unknown): value is PlayerIdentity {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.name === 'string'
}

/** There is no login: this browser is one anonymous player. */
export function getPlayer(): PlayerIdentity {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (isIdentity(parsed)) {
      cached = parsed
      return parsed
    }
  } catch {
    /* storage blocked: fall through and keep an in-memory identity */
  }
  const id = crypto.randomUUID()
  cached = { id, name: `Captain ${id.slice(0, 4).toUpperCase()}` }
  try {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(cached))
  } catch {
    /* ignore */
  }
  return cached
}