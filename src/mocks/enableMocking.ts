import { runtimeConfig } from '../api/runtimeConfig'

/** Starts the MSW worker before the app renders. Never throws: the game works without it. */
export async function enableMocking(): Promise<void> {
  if (!runtimeConfig.mocksEnabled) return
  try {
    const { worker } = await import('./browser')
    await worker.start({
      // onUnhandledRequest: 'bypass', // game assets and everything else go through untouched
      quiet: import.meta.env.PROD,
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    })
  } catch (error) {
    console.warn('The mock API could not start. Ranking and history will be unavailable.', error)
  }
}