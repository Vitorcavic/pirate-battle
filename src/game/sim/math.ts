export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  let wrapped = (angle + Math.PI) % twoPi
  if (wrapped < 0) wrapped += twoPi
  return wrapped - Math.PI
}