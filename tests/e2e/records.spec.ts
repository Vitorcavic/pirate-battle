import { expect, test, type Page } from '@playwright/test'
import { api, SHORT, startMatch, testUrl } from './helpers'

const storedRecords = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('pb:mock:db:v1') ?? '[]') as unknown[]).length)

const recordStatus = (page: Page) => page.getByTestId('record-status')

test('a finished match shows up in both tabs', async ({ page }) => {
  await startMatch(page, { settings: SHORT, query: 'scenario=empty' })
  await api.step(page, 200)
  await expect(recordStatus(page)).toHaveAttribute('data-status', 'saved')
  await page.getByRole('button', { name: 'Main Menu' }).click()

  await expect(page.getByTestId('ranking-rows').locator('tr')).toHaveCount(1)
  await expect(page.getByTestId('ranking-rows')).toContainText('(you)')
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('history-rows').locator('tr')).toHaveCount(1)
  await expect(page.getByTestId('history-rows')).toContainText('Time is up')
  expect(await storedRecords(page)).toBe(1)
})

test('a pending record survives a refresh and is sent after recovery, once', async ({ page }) => {
  await startMatch(page, {
    settings: SHORT,
    query: 'scenario=register-unavailable&retries=0&retryDelay=20',
  })
  await api.step(page, 200)
  await expect(recordStatus(page)).toHaveAttribute('data-status', 'failed', { timeout: 15_000 })

  // The player can start another match while the record is pending
  await page.getByRole('button', { name: 'Play Again' }).click()
  await expect(page.getByTestId('match-screen')).toBeVisible()

  // Refresh with the server back to normal: the pending record is sent again
  await page.goto(testUrl({ query: 'scenario=normal' }))
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('history-rows').locator('tr')).toHaveCount(1)
  await expect(page.getByTestId('pending-list')).toHaveCount(0)
  expect(await storedRecords(page)).toBe(1)
})

test('a timeout after the server saved the match does not duplicate it', async ({ page }) => {
  await startMatch(page, {
    settings: SHORT,
    query: 'scenario=register-timeout-once&apiTimeout=800&retryDelay=50',
  })
  await api.step(page, 200)
  await expect(recordStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 15_000 })
  expect(await storedRecords(page)).toBe(1) // the retry returned the stored record

  await page.getByRole('button', { name: 'Main Menu' }).click()
  await page.getByRole('tab', { name: 'Match History' }).click()
  await expect(page.getByTestId('history-rows').locator('tr')).toHaveCount(1)
})

test('late responses never overwrite what is on screen', async ({ page }) => {
  await page.goto(testUrl({ query: 'scenario=out-of-order&latencyScale=0.3' }))
  const indicator = page.getByTestId('page-indicator')
  await expect(indicator).toHaveText('Page 1 of 4') // first request is the slow one

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(indicator).toHaveText('Page 2 of 4')
  await page.getByRole('button', { name: 'Previous' }).click() // cached page 1; slow refresh starts
  await page.getByRole('button', { name: 'Next' }).click() // page 2 again, before page 1 answers
  await page.waitForTimeout(1500) // the slow page-1 response arrives meanwhile
  await expect(indicator).toHaveText('Page 2 of 4')
  await expect(page.getByTestId('ranking-rows').locator('tr').first().locator('td').first()).toHaveText('11')
})