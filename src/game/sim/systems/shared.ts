export function removeDead<T extends { dead: boolean }>(items: T[]): void {
  let kept = 0
  for (const item of items) {
    if (!item.dead) items[kept++] = item
  }
  items.length = kept
}