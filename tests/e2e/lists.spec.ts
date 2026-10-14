import { expect, test } from '@playwright/test'
import { openMenu } from './helpers'

const rows = (page: import('@playwright/test').Page) => page.getByTestId('ranking-rows').locator('tr')
const indicator = (page: import('@playwright/test').Page) => page.getByTestId('page-indicator')

test('ranking: ordered, paginated, last page is partial', async ({ page }) => {
  await openMenu(page)
  await expect(rows(page)).toHaveCount(10)
  await expect(indicator(page)).toHaveText('Page 1 of 4')

  const scores = (await page.locator('[data-testid="ranking-rows"] tr td:nth-child(3)').allInnerTexts()).map(Number)
  expect(scores).toEqual([...scores].sort((a, b) => b - a))

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(indicator(page)).toHaveText('Page 2 of 4')
  await expect(rows(page).first().locator('td').first()).toHaveText('11') // ranks continue across pages
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(indicator(page)).toHaveText('Page 4 of 4')
  await expect(rows(page)).toHaveCount(7) // 37 entries
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(indicator(page)).toHaveText('Page 3 of 4')
})

test('ranking shows a loading state on a slow network', async ({ page }) => {
  await openMenu(page, { query: 'scenario=slow&latencyScale=0.4' })
  await expect(page.getByTestId('list-loading')).toBeVisible()
  await expect(rows(page)).toHaveCount(10)
})

test('empty lists', async ({ page }) => {
  await openMenu(page, { query: 'scenario=empty' })
  await expect(page.getByTestId('list-empty')).toBeVisible()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('list-empty')).toBeVisible()
})

test('match history paginates', async ({ page }) => {
  await openMenu(page, { query: 'scenario=many-matches' })
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(indicator(page)).toHaveText('Page 1 of 3') // 27 matches
  await expect(page.getByTestId('history-rows').locator('tr')).toHaveCount(10)
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(indicator(page)).toHaveText('Page 3 of 3')
  await expect(page.getByTestId('history-rows').locator('tr')).toHaveCount(7)
})

test('an error in one list does not affect the other, and it recovers', async ({ page }) => {
  await openMenu(page, { query: 'scenario=ranking-error&retries=0&retryDelay=0' })
  await expect(page.getByTestId('list-error')).toContainText('Could not load the ranking')

  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('list-empty')).toBeVisible() // history works

  await page.getByRole('tab', { name: 'Ranking' }).click()
  await expect(page.getByTestId('list-error')).toBeVisible()
  await page.getByText('Network simulator').click()
  await page.getByLabel('Scenario').selectOption('normal')
  await expect(rows(page)).toHaveCount(10)
})