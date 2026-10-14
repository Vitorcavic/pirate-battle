import type { EndReason } from '../game/sim/types'

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  const time = Date.parse(iso)
  return Number.isFinite(time) ? dateFormat.format(time) : iso
}

export const formatDuration = (seconds: number): string => `${seconds.toFixed(1)} s`

export const REASON_LABEL: Record<EndReason, string> = { time: 'Time is up', death: 'Ship sunk' }