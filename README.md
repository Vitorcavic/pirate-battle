# Pirate Battle

A 2D top-down naval shooter built with React, TypeScript (strict), PixiJS v8, TanStack Query, Axios, MSW and Playwright.
Sail between islands, sink Chasers and Shooters, and score as many points as you can before time runs out.

**Live demo:** https://pirate-battle-six-bice.vercel.app

The game runs entirely in the browser. Gameplay and options are local. Ranking and match history use a REST API
simulated by MSW (also active in the published build).

## Setup

Requirements: Node.js 20+ and npm.

```bash
npm install
npx playwright install chromium   # only needed for the E2E tests
npm run dev                       # http://localhost:5173
```

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serves the production build on http://localhost:4173 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run test:e2e` | Playwright (builds and previews the app automatically) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:e2e:report` | Opens the HTML report |
| `npm run test:e2e:update` | Regenerates visual baselines |

### Environment variables

All optional. See `.env.example` values below.

| Variable | Default | Meaning |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Base URL of the ranking/history API |
| `VITE_ENABLE_MOCKS` | `true` | Set to `false` to use a real backend instead of MSW |
| `VITE_API_TIMEOUT_MS` | `5000` | Axios request timeout |

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move forward | `W` / `↑` | Forward button |
| Turn left / right | `A` `D` / `←` `→` | Turn buttons |
| Fire front (1 ball) | `Space` | Front fire button |
| Fire left broadside (3 parallel balls) | `Q` | Left fire button |
| Fire right broadside (3 parallel balls) | `E` | Right fire button |
| Pause | `Esc` / `P` | Pause button in the HUD |

Movement and firing work at the same time (multi-touch is supported). Open the app with `?touch` to show the
touch buttons on desktop. The supported mobile orientation is **landscape**; in portrait a notice asks the player to
rotate the device and the match pauses.

Pausing happens manually, when the window loses focus, when the tab is hidden, or when the device turns to portrait.
Resuming always requires clicking **Resume**; held keys and time spent paused are discarded.

## Gameplay configuration

All balance values live in one typed object: `src/game/sim/config.ts` (`DEFAULT_CONFIG`). Systems only read from the
per-match snapshot of this config, so balance changes never require logic changes.

User-editable options (Options screen, persisted in `localStorage`):

| Option | Allowed range | Default |
| --- | --- | --- |
| Game session time | 60–180 s | 120 s |
| Enemy spawn time | 0.5–10 s | 2.5 s |

Rules: each enemy destroyed by the player's shots is worth 1 point (a Chaser exploding against the player scores
nothing). The match ends when time runs out or the player's health reaches zero. Abandoning a match (reload or leaving
the arena) records nothing.

## Mock API and network scenarios

The API is simulated with MSW (service worker in `public/mockServiceWorker.js`), so it works in `dev`, in tests and in
the published build. Confirmed records are persisted in `localStorage` and survive a refresh.

Endpoints: `GET /api/ranking`, `GET /api/players/:playerId/matches`, `POST /api/matches` (idempotent, keyed by `matchId`).

**Selecting a scenario:** open the main menu and expand **Network simulator (mock API)**, or use `?scenario=<id>`.
**Resetting:** the **Reset mock data** button restores the default scenario and clears stored matches and the pending queue.

| Scenario id | Behavior |
| --- | --- |
| `normal` | Fixture ranking, empty personal history |
| `many-matches` | 27 demo matches in the history (pagination) |
| `empty` | Empty ranking and history |
| `slow` | 2.5 s latency |
| `variable-latency` | Seeded random latency, 0.1–3 s |
| `out-of-order` | Every other request is slow, so old responses arrive late |
| `timeout` | Requests never answer |
| `network-error` | Connection failures |
| `server-error` | HTTP 500 everywhere |
| `client-error` | 403 on queries, 422 on registration (no automatic retry) |
| `ranking-error` / `history-error` | Only that query fails with 500 |
| `register-timeout-once` | Server saves the match but the first response never arrives; the retry must not duplicate |
| `register-flaky` | First two submissions fail with 503, the third succeeds |
| `register-unavailable` | Registration fails until the scenario is changed; then press Retry |

### URL parameters (testing and debugging)

| Parameter | Effect |
| --- | --- |
| `scenario=<id>` | Selects a mock scenario (sticks across reloads) |
| `apiTimeout=<ms>` | Axios timeout |
| `retries=<n>`, `retryDelay=<ms>` | Query retry count and base delay |
| `latencyScale=<x>` | Multiplies the simulated latency |
| `mockSeed=<n>` | Seed for random latency |
| `e2e=1` | Enables the test API `window.__pb` |
| `seed=<n>` | Fixes the match RNG (spawns) when `e2e=1` |
| `manual=1` | With `e2e=1`, time only advances through `__pb.step(seconds)` |
| `touch` | Shows touch controls on desktop |
| `gallery` | Developer asset gallery / island tile editor |

### Reproducing failures

1. **Query failure:** `/?scenario=ranking-error&retries=0` (ranking) or `history-error` (history).
2. **Timeout:** `/?scenario=timeout&apiTimeout=1500&retryDelay=300`.
3. **Timeout after registering:** `/?scenario=register-timeout-once&apiTimeout=800`, finish a match; it ends as *Saved* with a single history entry.
4. **Registration outage and recovery:** `/?scenario=register-unavailable`, finish a match (*Not saved yet*), switch to `normal` in the simulator, press **Retry**.
5. **Out-of-order responses:** `/?scenario=out-of-order`, click Next/Previous quickly in the ranking.

## Tests

Playwright runs against the production build (`build` + `preview`) in Chromium, in two projects: `desktop` and `mobile`
(Pixel 7, landscape). Combat tests use the real game: they hold real keys or touches while `window.__pb.step()` advances
the real fixed-step simulation under a seed. The test API can read state and place scenario entities; it does not change rules.

Reports: `playwright-report/` (HTML) and traces for failures (`test-results/`). Visual baselines live in
`tests/e2e/__screenshots__/`. See **Known issues** for the current state of the suite.

## Reports

- Performance and memory: [`PERFORMANCE.md`](PERFORMANCE.md)
- Architecture and decisions: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Asset credits: [`CREDITS.md`](CREDITS.md)

## Known issues

  7 failed
    [desktop] › tests/e2e/lists.spec.ts:7:1 › ranking: ordered, paginated, last page is partial ────
    [desktop] › tests/e2e/lists.spec.ts:40:1 › match history paginates ─────────────────────────────
    [mobile] › tests/e2e/lists.spec.ts:7:1 › ranking: ordered, paginated, last page is partial ─────
    [mobile] › tests/e2e/lists.spec.ts:40:1 › match history paginates ──────────────────────────────
    [mobile] › tests/e2e/match-rules.spec.ts:4:1 › ending by time freezes the world and shows the result 
    [mobile] › tests/e2e/match-rules.spec.ts:21:1 › dying ends the match; Play Again restarts clean 
    [mobile] › tests/e2e/visual.spec.ts:14:1 › arena in a stable state ─────────────────────────────

- Failing E2E tests: _TO FILL_
- Sound effects are not implemented (the WAV files are shipped in `public/assets/sounds/` but not wired in).
- Islands use circular colliders over square tile art, so ships can stop a few pixels short of the visible shoreline.
- The developer gallery (`/?gallery`) is still reachable in the production build.
