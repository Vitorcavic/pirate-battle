import { expect, type Locator, type Page } from '@playwright/test'
import type { TestApi, TestScenario, TestState } from '../../src/game/testHooks'

type Win = { __pb: TestApi }

export const api = {
  state: (page: Page): Promise<TestState> => page.evaluate(() => (window as unknown as Win).__pb.getState()),
  step: (page: Page, seconds: number): Promise<TestState> =>
    page.evaluate((s) => (window as unknown as Win).__pb.step(s), seconds),
  setup: (page: Page, scenario: TestScenario): Promise<TestState> =>
    page.evaluate((s) => (window as unknown as Win).__pb.setup(s), scenario),
}

export const SHORT = { sessionDuration: 60, enemySpawnInterval: 2.5 }

export interface OpenOptions {
  seed?: number
  manual?: boolean // default true: the clock only moves through api.step()
  query?: string // extra URL params, e.g. 'scenario=slow'
  settings?: { sessionDuration: number; enemySpawnInterval: number }
}

export function testUrl(o: OpenOptions = {}): string {
  const parts = ['e2e=1', `seed=${o.seed ?? 1}`]
  if (o.manual ?? true) parts.push('manual=1')
  if (o.query) parts.push(o.query)
  return `/?${parts.join('&')}`
}

const playButton = (page: Page): Locator => page.getByRole('button', { name: 'Play', exact: true })

/** Every test starts from a fresh browser context, so storage is always clean. */
export async function openMenu(page: Page, o: OpenOptions = {}): Promise<void> {
  if (o.settings) {
    await page.addInitScript((s) => localStorage.setItem('pb:settings:v1', JSON.stringify(s)), o.settings)
  }
  await page.goto(testUrl(o))
  await expect(playButton(page)).toBeVisible()
}

export async function waitForApi(page: Page): Promise<void> {
  await page.waitForFunction(() => Boolean((window as unknown as { __pb?: unknown }).__pb))
}

export interface StartOptions extends OpenOptions {
  spawns?: boolean // default false: a quiet arena
}

export async function startMatch(page: Page, o: StartOptions = {}): Promise<void> {
  await openMenu(page, o)
  await playButton(page).click()
  await waitForApi(page)
  if (!o.spawns) await api.setup(page, { spawns: false })
}

/** Holds keys while `action` runs, then releases them. */
export async function withKeys<T>(page: Page, keys: string[], action: () => Promise<T>): Promise<T> {
  for (const key of keys) await page.keyboard.down(key)
  try {
    return await action()
  } finally {
    for (const key of keys) await page.keyboard.up(key)
  }
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return errors
}

export async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element has no bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}